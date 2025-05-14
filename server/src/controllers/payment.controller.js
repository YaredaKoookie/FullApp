import Appointment, {
  APPOINTMENT_STATUS,
} from "../models/appointment/appointment.model";
import Payment, {
  PAYMENT_STATUS,
  REFUND_STATUS,
} from "../models/appointment/payment.model";
import Patient from "../models/patient/patient.model";
import { logger, ServerError } from "../utils";
import { chapa, env } from "../config";
import mongoose from "mongoose";
import Doctor from "../models/doctors/doctor.model";
import {
  initializeChapaPaymentApi,
  refundChapaPayment,
} from "../config/chapa.config";
import { generateUniqueToken } from "../utils/token.util";



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
    const appointment = await Appointment.findById(appointmentId)
      .session(session);
    
    if (!appointment) {
      throw ServerError.notFound("Appointment not found");
    }

    if (!appointment.doctor) {
      throw ServerError.notFound("Doctor not assigned to appointment");
    }

    if (appointment.patient.toString() !== patient._id.toString()) {
      throw ServerError.forbidden("Only appointment owner can initiate payment");
    }

    if (appointment.status !== APPOINTMENT_STATUS.ACCEPTED) {
      throw ServerError.badRequest(
        "Payment can only be initiated for accepted appointments"
      );
    }

    // Check for existing payment
    const existingPayment = await Payment.findOne({ 
      appointment: appointment._id 
    }).session(session);

    if (existingPayment) {
      if (existingPayment.status === PAYMENT_STATUS.PAID) {
        throw ServerError.badRequest("Payment already completed");
      }
      throw ServerError.badRequest("Payment initiation already in progress");
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
        paymentInitiationUrl: `/payments/${payment._id}/initialize`, // Suggested next step
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

    // Generate unique transaction reference
    const tx_ref = `appointment_${payment._id}_${Date.now()}`;

    // Initialize Chapa payment
    const response = await initializeChapaPaymentApi({
      first_name: patient.firstName,
      last_name: patient.lastName,
      email: patient.user.email,
      currency: payment.currency || "ETB",
      amount: payment.amount,
      tx_ref,
      callback_url: `${env.SERVER_URL}/payment/chapa/callback`,
      return_url: `${env.FRONTEND_URL}/patient/payment/callback`,
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
    
    res.status(201).json({
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

export const verifyChapaCallback = async (req, res, next) => {
    console.log("body", req.body);
    console.log("query", req.query);

  const { trx_ref, status, _: ref_id } = req.query;

  if (!trx_ref || !status || !ref_id)
    throw ServerError.badRequest("Invalid chapa payload");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [name, paymentId] = trx_ref.split("_");
    const payment = await Payment.findById(paymentId).session(session);

    if (!payment) throw ServerError.notFound("Payment record not found");

    if(payment.status === PAYMENT_STATUS.PAID)
      throw ServerError.badRequest("Payment already completed");

    if (payment.status !== PAYMENT_STATUS.PENDING) {
      await session.abortTransaction();
      return res.json(404).json({ message: "Payment is not in pending state" });
    }

    const response = await chapa.verify({ tx_ref: trx_ref });

    console.log("response", response);

    if (!response || response.status !== "success")
      throw ServerError.badRequest("Invalid chapa verification response");

    const { status, data, message } = response;

    payment.transactionId = data.tx_ref || trx_ref;
    payment.referenceId = data.reference || ref_id;
    payment.paymentMethod = data.method;
    payment.currency = data.currency;
    payment.paymentDate = data.created_at || new Date();

    if (status === "success") {
      payment.status = PAYMENT_STATUS.PAID;

      const appointment = await Appointment.findById(
        payment.appointment
      ).session(session);

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
    logger.error("Payment verification failed", error);
    next(error);
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

export const handleChapaRefundWebhook = async (req, res, next) => {
  const { tx_ref, status, amount, meta } = req.body;

  console.log("chapa webhook body", req.body);

  if (!tx_ref || !status || !amount)
    throw ServerError.badRequest("Invalid webhook payload");

  const payment = await Payment.findOne({ referenceId: tx_ref });

  if (!payment) throw ServerError.notFound("404", "Payment not found");

  const refund = payment.refunds.find((r) => r.refundId === meta?.refundId);

  if (!refund) throw ServerError.badRequest("refund not found");

  if (refund.status !== REFUND_STATUS.PENDING)
    throw ServerError.badRequest("Refund already processed " + meta?.refundId);

  refund.status =
    status === "success" ? REFUND_STATUS.PROCESSED : REFUND_STATUS.FAILED;
  refund.processedAt = status === "success" ? new Date() : null;

  const totalRefunded = payment.refunds.reduce((sum, refund) => {
    return refund.status === REFUND_STATUS.PROCESSED
      ? sum + refund.amount
      : sum;
  }, 0);

  if (totalRefunded === payment.amount)
    payment.status = PAYMENT_STATUS.REFUNDED;
  if (totalRefunded > payment.amount)
    payment.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;

  await payment.save();

  return res.json({
    success: true,
    message: "refund updated",
    data: { payment },
  });
};


// book
// accept
// pay