import Appointment, {
  APPOINTMENT_STATUS,
  CANCELLATION_REASONS,
} from "../models/appointment/appointment.model";
import Doctor from "../models/doctors/doctor.model";
import Patient from "../models/patient/patient.model";
import ServerError from "../utils/ServerError";
import Payment, {
  PAYMENT_STATUS,
  REFUND_STATUS,
} from "../models/appointment/payment.model";
import SlotUtils from "../utils/slot.util";
import { chapa, env } from "../config";
import Schedule from "../models/schedule/Schedule.model";
import { logger, slotUtils } from "../utils";
import { refundChapaPayment } from "../config/chapa.config";
import mongoose from "mongoose";
import { truncates } from "bcryptjs";
import { generateUniqueToken } from "../utils/token.util";

// patient requests for an appointment
export const requestAppointment = async (req, res) => {
  const doctorId = req.params.doctorId;
  const { reason, appointmentType, slotId } = req.body;

  const doctor = await Doctor.findOne({ userId: doctorId });

  if (!doctor) throw ServerError.notFound("doctor not found");

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("patient not found");

  const { start, end } = await slotUtils.handleSlotConflict(
    slotId,
    doctor._id,
    patient._id
  );

  // Create new appointment
  const newAppointment = new Appointment({
    patient: patient._id,
    doctor: doctor._id,
    appointmentType,
    reason,
    fee: doctor.consultationFee,
    slot: { start, end, slotId },
    status: APPOINTMENT_STATUS.PENDING,
  });

  await newAppointment.save();
  await Schedule.updateOne(
    { doctorId: doctor._id, "availableSlots._id": slotId },
    {
      $set: {
        "availableSlots.$.isBooked": true,
        "availableSlots.$.bookedAt": new Date(),
      },
    }
  );

  // Populate patient and doctor details in the response
  const populatedAppointment = await Appointment.populate(newAppointment, [
    { path: "patient", select: "firstName lastName profileImage" },
    {
      path: "doctor",
      select: "firstName lastName specialization profilePhoto",
    },
  ]);

  res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    data: {
      appointment: populatedAppointment,
    },
  });
};
// doctor accepts patient's requested appointment
export const acceptAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.sub;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw ServerError.notFound("Appointment not found");
  }

  if (appointment.status !== APPOINTMENT_STATUS.PENDING)
    throw ServerError.badRequest(
      "Only pending appointments can set to confirmed"
    );

  const doctor = await Doctor.findOne({ userId });

  if (!doctor) throw ServerError.notFound("doctor not found");

  if (appointment.doctor.toString() !== doctor._id.toString())
    throw ServerError.forbidden("Not authorized to accept this appointment");

  appointment.status = APPOINTMENT_STATUS.ACCEPTED;
  appointment.acceptedAt = new Date().toISOString();

  await appointment.save();

  res.json({
    message: "Appointment accepted successfully",
    data: {
      appointment,
    },
  });
};

export const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  const { cancellationReason } = req.body;

  const patient = await Patient.findOne({ user: req.user.sub });

  if (!patient) throw ServerError.notFound("Patient not found");

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) throw ServerError.notFound("Appointment not found");

  if (appointment.patient.toString() !== patient._id.toString()) {
    throw ServerError.forbidden("You can only cancel you appointments");
  }

  if (appointment.status === "cancelled" || appointment.status === "completed")
    throw ServerError.badRequest(
      `You Cannot cancel an already ${appointment.status} appointment`
    );

  if (["doctor request", "no-show"].includes(cancellationReason))
    throw ServerError.badRequest(
      "Cancellation reason is not allowed for patient"
    );

  appointment.status = "cancelled";
  appointment.cancellation = {
    reason: cancellationReason || "patient request",
    cancelledBy: patient._id,
    cancelledByRole: "Patient",
    cancelledAt: new Date().toISOString(),
  };

  await appointment.save();

  const doctor = await Doctor.findById(appointment.doctor);

  if (doctor) {
    doctor.totalAppointments -= 1;
    await doctor.save();
  }

  res.json({
    success: true,
    message: "Appointment successfully cancelled",
    data: {
      appointment,
    },
  });
};

export const doctorCancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { cancellationReason } = req.body;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) throw ServerError.notFound("appointment not found");

  const doctor = await Doctor.findOne({ userId: req.user.sub });

  if (!doctor) throw ServerError.notFound("doctor not found");

  if (appointment.doctor._id.toString() !== appointment.doctor.toString())
    throw ServerError.notFound("Not the owner of this appointment");

  const payment = await Payment.findOne({
    appointment: appointment._id,
    doctor: doctor._id,
  });

  if (appointment.status === APPOINTMENT_STATUS.CANCELLED)
    throw ServerError.badRequest("Appointment already cancelled");

  if (appointment.status === APPOINTMENT_STATUS.COMPLETED)
    throw ServerError.badRequest("Cannot cancel completed appointment");

  if (appointment.status === APPOINTMENT_STATUS.PAYMENT_PENDING && !payment)
    throw ServerError.notFound("Payment not found for this appointment");
};

export const getDoctorAvailability = async (req, res) => {
  try {
    const { day } = req.query;
    if (!day && !req.params.doctorId)
      throw ServerError.badRequest("day and doctorId is required");

    const doctor = await Doctor.findById(req.params.doctorId);

    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    // Find working hours for the requested day
    const schedule = doctor.workingHours.find((slot) => slot.day === day);
    if (!schedule) return res.json({ available: false });

    console.log("schedule", schedule);
    // Generate theoretical slots (no date filtering yet)
    const slots = SlotUtils.generateDaySlots(
      schedule,
      doctor.appointmentDuration
    );

    res.json({
      available: true,
      slots,
      breaks: schedule.breaks || [],
    });
  } catch (error) {
    console.error("Error getting doctor availability:", error);
    res
      .status(500)
      .json({ message: "Failed to get availability", error: error.message });
  }
};

export const verifyTransaction = async (req, res) => {
  console.log("verify transaction request body", req.body);
  const tx_ref = req.body?.trx_ref;

  if (!tx_ref) throw ServerError.badRequest("tx_ref is not provided");

  const response = await chapa.verify({
    tx_ref: tx_ref,
  });

  if (response.status === "success") {
    const data = response.data;
    const appointment = await Appointment.findById(appointmentId);
    const payment = await Payment.findOne({ appointment: appointmentId });
    const [name, appointmentId, timestamp] = data.tx_ref.split("_");

    appointment.status = APPOINTMENT_STATUS.CONFIRMED;
    payment.status = PAYMENT_STATUS.PAID;

    payment.transactionId = data.tx_ref;
    payment.referenceId = data.reference;
    payment.paymentMethod = data.method;
    payment.currency = data.currency;
    payment.amount = data.amount;

    await payment.save();
    await appointment.save();

    return res.json({
      success: true,
      message: "Payment successfully processed",
      data: {
        payment,
      },
    });
  }

  //TODO: Handle error setting payment failed etc...

  res.json({
    success: false,
    message: "Payment unsuccessful",
  });
};

export const patientCancelAppointment = async (req, res) => {
  const { cancellationReason } = req.body;
  const appointmentId = req.params?.appointmentId;

  if (!appointmentId) throw ServerError.notFound("Appointment id is required");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appointment = await Appointment.findById(appointmentId).session(session);
    if (!appointment) throw ServerError.notFound("Appointment not found");

    const patient = await Patient.findOne({ user: req.user.sub }).session(session);
    if (!patient) throw ServerError.notFound("Patient not found");

    if (appointment.patient.toString() !== patient._id.toString())
      throw ServerError.badRequest("Not allowed action");

    const { ACCEPTED, PENDING, PAYMENT_PENDING, CANCELLED, CONFIRMED } = APPOINTMENT_STATUS;
    if (![ACCEPTED, PENDING, PAYMENT_PENDING, CONFIRMED].includes(appointment.status))
      throw ServerError.badRequest("Appointment must be ACCEPTED, PENDING, CONFIRMED or PAYMENT_PENDING");

    // Handle cancellation metadata
    appointment.status = CANCELLED;
    appointment.cancellation = {
      reason: cancellationReason || "No reason provided",
      cancelledBy: patient._id,
      cancelledByRole: "Patient",
      cancelledAt: new Date(),
    };

    const payment = await Payment.findOne({ appointment: appointment._id }).session(session);
    let refundAmount = 0;

    if (payment) {
      if (payment.status !== PAYMENT_STATUS.PAID) {
        payment.status = PAYMENT_STATUS.CANCELLED;
      } else if(payment.status === PAYMENT_STATUS.PAID) {
        console.log("payment", payment);
        const now = new Date();
        const appointmentTime = new Date(appointment.slot.start);
        const hoursBeforeAppointment = (appointmentTime - now) / (1000 * 60 * 60);

        if (hoursBeforeAppointment > 24 || appointment.status === APPOINTMENT_STATUS.PAYMENT_PENDING) {
          refundAmount = payment.amount; // Full refund
        } else if (hoursBeforeAppointment > 6) {
          refundAmount = Math.ceil(payment.amount * 0.5); // 50% refund
        }

        if (refundAmount > 0) {
          const hasPendingRefund = payment.refunds.some(
            (refund) => refund.status === REFUND_STATUS.PENDING
          );

          const totalRefunded = payment.refunds.reduce(
            (sum, refund) => refund.status !== REFUND_STATUS.FAILED ? sum + refund.amount : sum,
            0
          );

          if (!hasPendingRefund && totalRefunded + refundAmount <= payment.amount) {
            const refundId = generateUniqueToken();

            const payload = {
              tx_ref:  payment.referenceId,
              amount: refundAmount,
              reason: "Patient cancelled appointment",
              meta: {refundId}
            }

            console.log("payload", payload)

            const refundResponse = await refundChapaPayment(
              payment.referenceId,
              refundAmount,
              "Patient cancelled appointment",
              { refundId }
            );

            if (refundResponse.status !== 'success')
              throw ServerError.internal("Refund failed");

            payment.refunds.push({
              refundId,
              amount: refundAmount,
              reason: "appointment_cancelled_by_patient",
              status: REFUND_STATUS.PENDING,
            });
          }
        }
      }
      await payment.save({ session });
    }

    await appointment.save({ session });
    await slotUtils.releaseBlockedSlot(appointment.doctor, appointment.slot.slotId).session(session);
    await session.commitTransaction();

    res.json({
      success: true,
      message: "Appointment cancelled",
      data: { refundAmount },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancellation error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Cancellation failed",
    });
  } finally {
    session.endSession();
  }
};

export const rescheduleAppointment = async (req, res) => {
  const appointmentId = req.params;
  const { startTime, endTime, reason } = req.body;

  if (!appointmentId) throw ServerError.notFound("Appointment id is required");

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) throw ServerError.notFound("Appointment not found");

  const { COMPLETED, CANCELLED } = APPOINTMENT_STATUS;

  if (appointment.status.includes([COMPLETED, CANCELLED]))
    throw ServerError.badRequest(
      "Appointment is already " + appointment.status + "."
    );

  const patient = await Patient.findOne({ _id: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  if (patient._id.toString() !== appointment.patient.toString())
    throw ServerError.badRequest("Not an owner of this appointment");

  const doctor = await Doctor.findById(appointment.doctor);

  if (!doctor)
    throw ServerError.notFound("doctor not found related to this appointment");

  //! THIS LOGIC CHANGES WHEN SLOT LOGIC CHANGE
  const start = new Date(startTime);
  const end = new Date(endTime);

  const selectedDay = start.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const dayAvailability = doctor.weeklyAvailability.find(
    (availability) => availability.day === selectedDay
  );

  if (dayAvailability)
    throw ServerError.badRequest(`Doctor is not available on ${selectedDay}.`);

  // Check slot availability
  const isAvailable = await SlotUtils.isSlotAvailable(doctor._id, start, end);

  if (!isAvailable)
    throw ServerError.badRequest("Selected slot is not available");

  //! TEMPORARY LOGIC ENDS HERE

  if (appointment.rescheduleHistory.length >= 5) {
    throw ServerError.badRequest("Maximum rescheduling capacity reached");
  }

  const rescheduledByModel = req.user.role === "patient" ? "Patient" : "Doctor";

  appointment.rescheduleHistory = {
    previousTimeSlot: { start: appointment.start, end: appointment.end },
    newTimeSlot: { start, end },
    reason: reason || "",
    rescheduledBy: req.user.sub,
    rescheduledByModel: rescheduledByModel,
  };

  appointment.slot.start = start;
  appointment.slot.end = end;

  await appointment.save();

  res.json({
    success: true,
    message: "Appointment rescheduled requested",
    data: {
      appointment,
    },
  });
};

export const completeAppointment = async (req, res) => {
  const appointmentId = req.params;
  const status = req.body.status;

  if (!appointmentId) throw ServerError.notFound("Appointment id is required");

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) throw ServerError.notFound("Appointment not found");

  if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED)
    throw ServerError.badRequest("Appointment is not confirmed yet");

  const endTime = new Date(appointment.slot.end);

  if (endTime > new Date())
    throw ServerError.badRequest(
      "Appointment's scheduled end date is not reached yet"
    );

  appointment.status = APPOINTMENT_STATUS.COMPLETED;

  if (status.includes(APPOINTMENT_STATUS.NO_SHOW))
    appointment.status = APPOINTMENT_STATUS.NO_SHOW;

  await appointment.save();

  res.json({
    success: true,
    message: "Appointment completed successfully",
    data: {
      appointment,
    },
  });
};

export const getPatientAppointments = async (req, res) => {
  const userId = req.user.sub;
  const status = req.body.status;
  const { page = 1, limit = 20 } = req.params;
  const skip = (page - 1) * limit;

  const patient = await Patient.findOne({ user: userId });

  if (!patient) throw ServerError.notFound("Patient profile not found");

  const query = { patient: patient._id };
  if (status) query.status = status;

  const appointments = await Appointment.find(query)
    .populate("doctor", "firstName lastName specialization profilePhoto")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalAppointments = await Appointment.countDocuments(query);
  const totalPages = Math.ceil(totalAppointments / limit);

  res.json({
    success: true,
    data: {
      appointments,
    },
    pagination: {
      totalPages,
      totalAppointments,
      currentPage: Number(page),
      limit: Number(limit),
    },
  });
};
