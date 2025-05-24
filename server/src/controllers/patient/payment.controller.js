import Appointment, {
  APPOINTMENT_STATUS,
} from "../../models/appointment/appointment.model";
import Payment, {
  PAYMENT_STATUS,
  REFUND_STATUS,
} from "../../models/appointment/payment.model";
import Patient from "../../models/patient/patient.model";
import { logger, ServerError } from "../../utils";
import { chapa, env } from "../../config";
import mongoose from "mongoose";
import Doctor from "../../models/doctors/doctor.model";
import {
  initializeChapaPaymentApi,
  refundChapaPayment,
} from "../../config/chapa.config";
import { generateUniqueToken } from "../../utils/token.util";

export const initiatePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { appointmentId } = req.params;
    const currency = (req.body?.currency || "ETB").toUpperCase();

    // Input validation
    if (!appointmentId) {
      throw ServerError.badRequest("Appointment ID is required");
    }

    if (!["ETB", "USD"].includes(currency)) {
      throw ServerError.badRequest("Only ETB or USD currencies are supported");
    }

    // Get patient with email
    const patient = await Patient.findOne({ user: req.user.sub })
      .select("_id user")
      .populate("user", "email")
      .session(session);

    if (!patient) {
      throw ServerError.notFound("Patient not found");
    }

    // Get and validate appointment
    const appointment = await Appointment.findById(appointmentId).session(
      session
    );

    if (!appointment) {
      throw ServerError.notFound("Appointment not found");
    }

    if (!appointment.doctor) {
      throw ServerError.notFound("Doctor not assigned to appointment");
    }

    if (appointment.patient.toString() !== patient._id.toString()) {
      throw ServerError.forbidden(
        "Only appointment owner can initiate payment"
      );
    }

    if ((appointment.status !== APPOINTMENT_STATUS.ACCEPTED) && (appointment.status !== APPOINTMENT_STATUS.PAYMENT_PENDING)) {
      throw ServerError.badRequest(
        "Payment can only be initiated for accepted appointments"
      );
    }

    // Check for existing payment
    const existingPayment = await Payment.findOne({
      appointment: appointment._id,
    }).session(session);

    if (existingPayment) {
      if (existingPayment.status === PAYMENT_STATUS.PAID) {
        throw ServerError.badRequest("This appointment is already paid");
      }
      return res.json({
        success: true,
        data: {
          payment: existingPayment,
          paymentInitiationUrl: `${env.SERVER_URL}/patient/payments/${existingPayment._id}/initialize`, // Suggested next step
        },
      });
    }

    // Create new payment
    const payment = new Payment({
      patient: patient._id,
      appointment: appointment._id,
      doctor: appointment.doctor,
      amount: appointment.fee,
      currency,
      status: PAYMENT_STATUS.PENDING,
    });

    // Update appointment status
    appointment.status = APPOINTMENT_STATUS.PAYMENT_PENDING;

    // Save changes
    await payment.save({ session });
    await appointment.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        payment,
        paymentInitiationUrl: `${env.SERVER_URL}/patient/payments/${payment._id}/initialize`, // Suggested next step
      },
    });
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ServerError) {
      throw error;
    }

    console.error("Payment initiation error:", error);
    throw ServerError.internal("Failed to initiate payment");
  } finally {
    session.endSession();
  }
};

export const initializeChapaPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId } = req.params;
    if (!paymentId) throw ServerError.notFound("Payment id not found");

    // Get patient with user email
    const patient = await Patient.findOne({ user: req.user.sub })
      .populate("user", "email")
      .session(session);
    if (!patient) throw ServerError.notFound("Patient not found");

    // Find payment
    const payment = await Payment.findOne({
      _id: paymentId,
      patient: patient._id,
    }).session(session);

    if (!payment) throw ServerError.notFound("Payment not found");

    // Check payment status
    if (payment.status === PAYMENT_STATUS.PAID) {
      throw ServerError.badRequest("Payment is already processed");
    }
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      throw ServerError.badRequest("Payment is not in pending state");
    }

    if (payment.transactionId) {
      try {
        const verification = await chapa.verify({
          tx_ref: payment.transactionId,
        });

        if (verification?.status === "success") {
          payment.status = PAYMENT_STATUS.PAID;
          payment.referenceId = verification.data.reference;
          const appointment = await Appointment.findById(payment.appointment).session(session);

          if (
            appointment &&
            appointment.status === APPOINTMENT_STATUS.PAYMENT_PENDING
          ) {
            appointment.status = APPOINTMENT_STATUS.CONFIRMED;
          }

          await payment.save({session});
          
          if (appointment) await appointment.save({session});

          await session.commitTransaction();

          return res.status(400).json({
            success: false,
            message: "Payment already processed",
            data: {
              payment,
            },
          });
        }
      } catch (error) {
        console.log("chapa verification failed:", error);
        throw error;
      }
    }

    // Generate unique transaction reference
    const tx_ref = `appointment_${payment._id}_${Date.now()}`;

    // Initialize Chapa payment
    const response = await initializeChapaPaymentApi({
      first_name: patient.firstName,
      last_name: patient.lastName,
      email: patient.user.email,
      phone_number: "0900123456",
      currency: payment.currency || "ETB",
      amount: payment.amount,
      tx_ref,
      callback_url: `${env.SERVER_URL}/patient/payments/chapa/callback`,
      return_url: `${env.FRONTEND_URL}/patient/payments`,
      customization: {
        title: "Appointment Fee",
        description: "Payment for appointment",
      },
    });

    if (response.status !== "success" || !response?.data) {
      throw ServerError.internal("Failed to initialize payment");
    }

    // Update payment with transaction ID
    payment.transactionId = tx_ref;
    await payment.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        payment_url: response.data.checkout_url,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment initialization error:", error);

    if (error instanceof ServerError) {
      throw error; // Re-throw already formatted errors
    }
    throw ServerError.internal("Unable to initialize payment");
  } finally {
    session.endSession();
  }
};

export const verifyChapaCallback = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const trx_ref = req.query.trx_ref || req.query.tx_ref;
    const ref_id = req.query._ || req.query.ref_id;
    const status = req.query.status;

    if (!trx_ref || !status || !ref_id) {
      throw ServerError.badRequest("Invalid chapa payload");
    }

    const [name, paymentId] = trx_ref.split("_");
    const payment = await Payment.findById(paymentId).session(session);

    if (!payment) throw ServerError.notFound("Payment record not found");

    if (payment.status === PAYMENT_STATUS.PAID) {
      throw ServerError.badRequest("Payment already completed");
    }

    if (payment.status !== PAYMENT_STATUS.PENDING) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Payment is not in pending state" });
    }

    const response = await chapa.verify({ tx_ref: trx_ref });

    if (!response || response.status !== "success") {
      throw ServerError.badRequest("Invalid chapa verification response");
    }

    const { data } = response;

    payment.transactionId = data.tx_ref || trx_ref;
    payment.referenceId = data.reference || ref_id;
    payment.paymentMethod = data.method;
    payment.currency = data.currency;
    payment.paymentDate = data.created_at || new Date();

    if (status === "success") {
      payment.status = PAYMENT_STATUS.PAID;

      const appointment = await Appointment.findById(payment.appointment).session(session);

      if (!appointment) {
        await session.abortTransaction();
        throw ServerError.notFound("Appointment record is not found");
      }

      appointment.status = APPOINTMENT_STATUS.CONFIRMED;
      appointment.confirmedAt = new Date();
      await appointment.save({ session });
    } else {
      payment.status = PAYMENT_STATUS.FAILED;
      payment.failureReason = req.body.message || "payment_failed";
    }

    await payment.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Payment verification failed", error);
    throw error;
  } finally {
    session.endSession();
  }
};

export const processRefund = async (req, res, next) => {
  const { tx_ref, amount, reason } = req.body;

  if (!tx_ref || !amount || !!reason)
    throw ServerError.badRequest(
      "transaction ref, amount and reason are required"
    );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findOne({ transactionId: tx_ref }).session(
      session
    );

    if (!payment) throw ServerError.notFound("Payment record not found");

    let userProfile = null;

    if (req.user.role === "patient")
      userProfile = await Patient.findOne({ user: req.user.sub }).session(
        session
      );
    else if (req.user.role === "doctor")
      userProfile = await Doctor.findOne({ userId: req.user.sub }).session(
        session
      );

    if (!userProfile) throw ServerError.notFound("user not found");

    const { PAID, PARTIALLY_REFUNDED } = PAYMENT_STATUS;

    if (![PAID, PARTIALLY_REFUNDED].includes(payment.status))
      throw ServerError.badRequest(
        "Only paid and partially refunded transactions can be refunded"
      );

    const appointment = await Appointment.findById(payment.appointment).session(
      session
    );

    if (!appointment)
      throw ServerError.notFound("Associated appointment not found");

    const { CANCELLED, NO_SHOW, RESCHEDULED } = APPOINTMENT_STATUS;

    if (![CANCELLED, NO_SHOW, RESCHEDULED].includes(appointment.status))
      throw ServerError.badRequest(
        `Refund is not allowed for ${appointment.status} appointment`
      );

    const hasPendingRefund = payment.refunds.some(
      (refund) => refund.status === REFUND_STATUS.PENDING
    );

    if (hasPendingRefund)
      throw ServerError.badRequest(
        "A refund is already pending for this payment. please wait until it is processed"
      );

    const totalRefunded = payment.refunds.reduce((sum, refund) => {
      return refund.status !== REFUND_STATUS.FAILED ? sum + refund.amount : acc;
    }, 0);

    if (totalRefunded + amount > payment.amount) {
      throw ServerError.badRequest(
        `Refund amount exceeds the original payment amount.`
      );
    }

    let refundId = generateUniqueToken();

    const meta = { refundId };
    const refundResponse = await refundChapaPayment(
      tx_ref,
      amount,
      reason,
      meta
    );

    const { status, data } = refundResponse;

    if (status !== "success")
      throw ServerError.internal("Refund initialization failed");

    refundId = data.meta.refundId;

    if (!refundId) throw ServerError.notFound("refund id is not found");

    const refundEntry = {
      amount,
      refundId,
      reason,
      status: REFUND_STATUS.PENDING,
    };

    payment.refunds.push(refundEntry);

    await payment.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: "Refund processed successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const handleChapaWebhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate webhook signature (critical security check)
    const signature = req.headers["x-chapa-signature"];
    if (!verifyChapaSignature(signature, req.body)) {
      throw ServerError.unauthorized("Invalid webhook signature");
    }

    const {
      tx_ref,
      status,
      event,
      amount,
      meta,
      reference,
      currency,
      payment_method,
    } = req.body;

    // Basic validation (complementing express-validator)
    if (!tx_ref || !status || !event) {
      throw ServerError.badRequest("Missing required webhook fields");
    }

    // Find and lock payment document
    const payment = await Payment.findOne({ referenceId: tx_ref }).session(
      session
    );

    if (!payment) {
      throw ServerError.notFound("Payment not found");
    }

    // Handle different event types
    let message = "";
    switch (event) {
      case "charge.success":
        await handleSuccessfulCharge({
          payment,
          status,
          reference,
          currency,
          payment_method,
          session,
        });
        message = "Payment successful";
        break;

      case "charge.refunded":
        await handleRefund({
          payment,
          status,
          meta,
          session,
        });
        message = "Refund processed";
        break;

      default:
        message = "Webhook received (no action taken)";
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message,
      data: { payment: payment.toObject() },
    });
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof ServerError) {
      throw error;
    }

    console.error("Webhook processing error:", error);
    throw ServerError.internal("Webhook processing failed");
  } finally {
    session.endSession();
  }
};

export const getPayments = async (req, res) => {
  const userId = req.user.sub;
  const status = req.body?.status;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const patient = await Patient.findOne({ user: userId }).select("_id");
  if (!patient) throw ServerError.notFound("Patient profile not found");

  const query = { patient: patient._id };
  if (status) query.status = status;

  // Get paginated payments
  const payments = await Payment.find(query)
    .populate("doctor")
    .populate("patient")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get payment statistics
  const stats = await Payment.aggregate([
    { $match: { patient: patient._id } },
    {
      $group: {
        _id: null,
        totalSuccessAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", PAYMENT_STATUS.PAID] }, "$amount", 0]
          }
        },
        totalPending: {
          $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.PENDING] }, 1, 0] }
        },
        totalPaid: {
          $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.PAID] }, 1, 0] }
        },
        totalFailed: {
          $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.FAILED] }, 1, 0] }
        },
        totalCancelled: {
          $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.CANCELLED] }, 1, 0] }
        },
        totalRefunded: {
          $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.REFUNDED] }, 1, 0] }
        },
        totalPartiallyRefunded: {
          $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.PARTIALLY_REFUNDED] }, 1, 0] }
        },
        totalRefundInitiated: {
          $sum: { $cond: [{ $eq: ["$status", PAYMENT_STATUS.REFUND_INITIATED] }, 1, 0] }
        },
        totalPayments: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        totalSuccessAmount: 1,
        totalPending: 1,
        totalPaid: 1,
        totalFailed: 1,
        totalCancelled: 1,
        totalRefunded: 1,
        totalPartiallyRefunded: 1,
        totalRefundInitiated: 1,
        totalPayments: 1
      }
    }
  ]);

  const totalPayments = await Payment.countDocuments(query);
  const totalPages = Math.ceil(totalPayments / limit);

  res.json({
    success: true,
    data: {
      payments,
      stats: stats[0] || {
        totalSuccessAmount: 0,
        totalPending: 0,
        totalPaid: 0,
        totalFailed: 0,
        totalCancelled: 0,
        totalRefunded: 0,
        totalPartiallyRefunded: 0,
        totalRefundInitiated: 0,
        totalPayments: 0
      }
    },
    pagination: {
      totalPages,
      totalPayments,
      currentPage: Number(page),
      limit: Number(limit),
    },
  });
};

// Helper functions for better separation of concerns
async function handleSuccessfulCharge({
  payment,
  status,
  reference,
  currency,
  payment_method,
  session,
}) {
  if (status !== "success") return;

  // Validate payment can be marked as paid
  const allowedStatuses = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED];
  if (!allowedStatuses.includes(payment.status)) {
    throw ServerError.badRequest(
      `Payment cannot be marked as paid from current state: ${payment.status}`
    );
  }

  // Update payment
  payment.status = PAYMENT_STATUS.PAID;
  payment.referenceId = reference;
  payment.transactionId = tx_ref;
  payment.currency = currency || payment.currency;
  payment.paymentDate = new Date();
  payment.paymentMethod = payment_method;

  // Update related appointment
  const appointment = await Appointment.findById(payment.appointment).session(
    session
  );

  if (appointment) {
    const allowedAppointmentStatuses = [
      APPOINTMENT_STATUS.ACCEPTED,
      APPOINTMENT_STATUS.PAYMENT_PENDING,
    ];

    if (allowedAppointmentStatuses.includes(appointment.status)) {
      appointment.status = APPOINTMENT_STATUS.CONFIRMED;
      appointment.confirmedAt = new Date();
      await appointment.save({ session });
    }
  }

  await payment.save({ session });
}

async function handleRefund({ payment, status, meta, session }) {
  if (status !== "refunded") return;

  const refund = payment.refunds.find((r) => r.refundId === meta?.refundId);
  if (!refund) {
    throw ServerError.notFound("Refund not found");
  }

  if (refund.status === REFUND_STATUS.PROCESSED) {
    throw ServerError.badRequest(`Refund already processed: ${meta?.refundId}`);
  }

  // Process refund
  refund.status = REFUND_STATUS.PROCESSED;
  refund.processedAt = new Date();

  // Calculate total refunded amount
  const totalRefunded = payment.refunds.reduce((sum, r) => {
    return r.status === REFUND_STATUS.PROCESSED ? sum + r.amount : sum;
  }, 0);

  // Update payment status based on refund amount
  if (totalRefunded >= payment.amount) {
    payment.status = PAYMENT_STATUS.REFUNDED;
  } else if (totalRefunded > 0) {
    payment.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;
  }

  await payment.save({ session });
}

// Security verification function
function verifyChapaSignature(signature, payload) {
  const secret = env.CHAPA_WEBHOOK_SECRET_KEY;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return signature === expectedSignature;
}
