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
import { generateUniqueToken } from "../utils/token.util";
import { handleRefund, initiateRefund } from "../utils/payment.util";

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

export const doctorCancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { cancellationReason } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    
    const doctor = await Doctor.findOne({ userId: req.user.sub }).session(
    session
  );

  if (!doctor) throw ServerError.notFound("doctor not found");

  const { PENDING, ACCEPTED, CONFIRMED, PAYMENT_PENDING } = APPOINTMENT_STATUS;
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctor: doctor._id,
    status: { $in: [PENDING, ACCEPTED, CONFIRMED, PAYMENT_PENDING] },
  }).session(session);

  if (!appointment) throw ServerError.notFound("appointment not found");

  if (appointment.doctor._id.toString() !== appointment.doctor.toString())
    throw ServerError.notFound("Not the owner of this appointment");

  appointment.cancellation = {
    reason: cancellationReason,
    cancelledBy: doctor._id,
    cancelledByRole: "Doctor",
    cancelledAt: new Date(),
  };
  appointment.status = APPOINTMENT_STATUS.CANCELLED;

  if (appointment.status === APPOINTMENT_STATUS.PAYMENT_PENDING) {
    await Payment.findOneAndUpdate(
      { appointment: appointment._id },
      { status: PAYMENT_STATUS.CANCELLED },
      { new: true }
    );

    await appointment.save({ session });

    await slotUtils
    .releaseBlockedSlot(appointment.doctor, appointment.slot.slotId)
    .session(session);
    
    session.commitTransaction();

    return res.json({
      success: true,
      message: "appointment cancelled successfully",
    });
  }
  
  const payment = await Payment.findOne({
    appointment: appointment._id,
  }).session(session);
  
  if (payment && payment.status === PAYMENT_STATUS.PAID) {
    refundAmount = appointment.fee;
    payment.refunds.push({
      refundId: generateUniqueToken(),
      amount: refundAmount,
      reason: "doctor cancelled appointment",
      status: REFUND_STATUS.PENDING,
    });
    
    payment.status = PAYMENT_STATUS.REFUND_INITIATED;
    await payment.save({ session });
  }
  
  await appointment.save({ session });
  
  await slotUtils
  .releaseBlockedSlot(appointment.doctor, appointment.slot.slotId)
  .session(session);
  
  res.json({
    success: true,
    message: "appointment cancelled successfully",
  });
} catch (error){
  await session.abortTransaction();
  console.log("doctor cancel error", error);
  throw error;
} finally {
  await session.endSession();
}
};

export const patientCancelAppointment = async (req, res) => {
  const { cancellationReason } = req.body;
  const appointmentId = req.params?.appointmentId;

  if (!appointmentId) throw ServerError.notFound("Appointment id is required");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const patient = await Patient.findOne({ user: req.user.sub }).session(
      session
    );

    if (!patient) throw ServerError.notFound("Patient not found");

    const appointment = await Appointment.findById({
      appointment: appointmentId,
      patient: patient._id,
      status: {
        $in: [
          APPOINTMENT_STATUS.PENDING,
          APPOINTMENT_STATUS.ACCEPTED,
          APPOINTMENT_STATUS.CONFIRMED,
          APPOINTMENT_STATUS.PAYMENT_PENDING,
        ],
      },
    }).session(session);

    if (!appointment) throw ServerError.notFound("Appointment not found");

    if (appointment.patient.toString() !== patient._id.toString())
      throw ServerError.badRequest("Not allowed action");

    // Handle cancellation metadata
    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancellation = {
      reason: cancellationReason || "No reason provided",
      cancelledBy: patient._id,
      cancelledByRole: "Patient",
      cancelledAt: new Date(),
    };

    if (appointment.status === APPOINTMENT_STATUS.PAYMENT_PENDING) {
      await Payment.findOneAndUpdate(
        { appointment: appointment._id },
        { status: PAYMENT_STATUS.CANCELLED }
      );

      await appointment.save({ session });

      return res.json({
        success: true,
        message: "appointment has cancelled successfully",
      });
    }

    const payment = await Payment.findOne({
      appointment: appointment._id,
    }).session(session);

    let refundAmount = 0;

    if (payment && payment.status === PAYMENT_STATUS.PAID) {
      const now = new Date();
      const appointmentTime = appointment.slot.start;
      const hoursBeforeAppointment = (appointmentTime - now) / (1000 * 60 * 60);

      if (hoursBeforeAppointment > 24) {
        refundAmount = appointment.fee;
      } else if (hoursBeforeAppointment > 6) {
        refundAmount = payment.amount * 0.5;
      } else refundAmount = 0;

      if (refundAmount > 0) {
        const refundResponse = await initiateRefund(
          payment.referenceId,
          refundAmount,
          "patient cancelled appointment"
        );

        if (!refundResponse.status !== "success") {
          session.abortTransaction();
          throw ServerError.internal("Unable to set refund");
        }

        payment.refunds.push({
          refundId: generateUniqueToken(),
          amount: refundAmount,
          reason: "patient cancelled appointment",
          status: REFUND_STATUS.PENDING,
        });

        payment.status = PAYMENT_STATUS.REFUND_INITIATED;
        await payment.save({ session });
      }
    }

    await appointment.save({ session });

    await slotUtils
      .releaseBlockedSlot(appointment.doctor, appointment.slot.slotId)
      .session(session);

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Appointment cancelled",
      data: { refundAmount },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancellation error:", error);
    throw error;
  } finally {
    await session.endSession();
  }
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


export const rescheduleAppointment = async (req, res) => {
  const appointmentId = req.params;
  const { slots, reason } = req.body;

  if (!appointmentId) throw ServerError.notFound("Appointment id is required");

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) throw ServerError.notFound("Appointment not found");

  const { COMPLETED, CANCELLED } = APPOINTMENT_STATUS;

  if ([COMPLETED, CANCELLED].includes(appointment.status))
    throw ServerError.badRequest(
      "Appointment is already " + appointment.status + " status."
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




