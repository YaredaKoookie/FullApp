import Appointment, {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  RESCHEDULE_STATUS,
} from "../../models/appointment/appointment.model";
import Doctor from "../../models/doctors/doctor.model";
import Patient from "../../models/patient/patient.model";
import ServerError from "../../utils/ServerError";
import Payment, {
  PAYMENT_STATUS,
  REFUND_STATUS,
} from "../../models/appointment/payment.model";
import SlotUtils, { handleSlotConflict } from "../../utils/slot.util";
import Schedule from "../../models/schedule/Schedule.model";
import { slotUtils } from "../../utils";
import mongoose from "mongoose";
import { generateUniqueToken } from "../../utils/token.util";
import { initiateRefund } from "../../utils/payment.util";

export const requestAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const doctorId = req.params.doctorId;
    const { reason, appointmentType, slotId } = req.body;

    // 1. Verify doctor exists (in transaction)
    const doctor = await Doctor.findById(doctorId).session(session);
    if (!doctor) throw ServerError.notFound("Doctor not found");

    // 2. Verify patient exists (in transaction)
    const patient = await Patient.findOne({ user: req.user.sub })
      .select("_id")
      .session(session);
    if (!patient) throw ServerError.notFound("Patient not found");

    // 3. Atomically reserve slot and check conflicts (with transaction)
    const { start, end } = await slotUtils.handleSlotConflict(
      slotId,
      doctor._id,
      patient._id,
      session
    );

    // 4. Create new appointment (in transaction)
    const newAppointment = new Appointment({
      patient: patient._id,
      doctor: doctor._id,
      appointmentType,
      reason,
      fee: doctor.consultationFee,
      slot: { start, end, slotId },
      status: APPOINTMENT_STATUS.PENDING,
    });

    await newAppointment.save({ session });

    // 5. Confirm slot booking (already done in handleSlotConflict)
    // No need for separate update here

    // 6. Commit the transaction
    await session.commitTransaction();

    // 7. Populate appointment details (outside transaction for better performance)
    const populatedAppointment = await Appointment.populate(newAppointment, [
      { path: "patient", select: "firstName lastName profileImage" },
      {
        path: "doctor",
        select: "firstName lastName specialization profilePhoto",
      },
    ]);

    // 8. Send success response
    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: {
        appointment: populatedAppointment,
      },
    });
  } catch (error) {
    // 9. If anything fails, abort the transaction
    await session.abortTransaction();
    
    // Handle specific error types if needed
    if (error.message.includes("Time slot not available")) {
      throw ServerError.conflict("This time slot was just booked by another user");
    }
    
    // Re-throw other errors
    throw error;
  } finally {
    // 10. End the session
    session.endSession();
  }
};

export const updatePendingAppointment = async (req, res) => {};

export const patientCancelAppointment = async (req, res) => {
  const { cancellationReason } = req.body;
  const appointmentId = req.params?.appointmentId;

  console.log("cancellationReason", cancellationReason);

  if (!appointmentId) throw ServerError.notFound("Appointment id is required");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const patient = await Patient.findOne({ user: req.user.sub }).session(
      session
    );

    if (!patient) throw ServerError.notFound("Patient not found");
    console.log("Appointment ID:", appointmentId);
    console.log("Patient ID:", patient._id);

    const appointment = await Appointment.findOne({
      _id: appointmentId,
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

export const getAppointmentById = async (req, res) => {
  const { appointmentId } = req.params;

  if (!appointmentId)
    throw ServerError.badRequest("Appointment id is required");

  const patient = await Patient.findOne({ user: req.user.sub }).select(
    "_id email"
  );

  if (!patient) throw ServerError.badRequest("User not found");

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patient: patient._id,
  })
    .populate("patient")
    .populate("doctor");

  if (!appointment) throw ServerError.notFound("Appointment not found");

  res.json({
    success: true,
    data: {
      appointment: {
        ...appointment.toObject(),
        patient: {
          ...appointment.patient.toObject(),
          email: patient.email,
        },
      },
    },
  });
};

export const getPatientAppointments = async (req, res) => {
  const userId = req.user.sub;
  const status = req.body.status;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const patient = await Patient.findOne({ user: userId });

  if (!patient) throw ServerError.notFound("Patient profile not found");

  const query = { patient: patient._id };
  if (status) query.status = status;

  const appointments = await Appointment.find(query)
    .populate("doctor", "firstName middleName specialization profilePhoto")
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

export const reschedulePendingAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { slotId } = req.body;
};

export const requestAppointmentReschedule = async (req, res) => {
  const { appointmentId } = req.params;
  const { slotId, reason } = req.body;

  const user =
    req.user.role === "doctor"
      ? await Doctor.findOne({ userId: req.user.sub })
      : await Patient.findOne({ user: req.user.sub });

  if (!user) throw ServerError.notFound("User not found");

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    $or: [{ patient: user._id }, { doctor: user._id }],
    status: {
      $in: [
        APPOINTMENT_STATUS.PENDING,
        APPOINTMENT_STATUS.CONFIRMED,
        APPOINTMENT_STATUS.ACCEPTED,
        APPOINTMENT_STATUS.RESCHEDULED,
      ],
    },
  });

  if (!appointment)
    throw ServerError.notFound(
      "Appointment not found or not in state to be rescheduled"
    );

  const isOwner = [appointment.doctor, appointment.patient].some(
    (id) => id.toString() === user._id.toString()
  );

  if (!isOwner) {
    throw ServerError.badRequest("Not an owner of this appointment");
  }

  const rescheduledByRole = req.user.role === "patient" ? "Patient" : "Doctor";

  if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
    if (appointment.rescheduleHistory?.length >= 5) {
      throw ServerError.badRequest("Maximum rescheduling capacity reached");
    }
    const hasPendingSchedule = appointment?.rescheduleHistory.some(
      (r) => r.status === RESCHEDULE_STATUS.PENDING
    );

    if (hasPendingSchedule) {
      throw ServerError.badRequest(
        "A pending reschedule request already exists"
      );
    }
  }

  const { start, end } = await handleSlotConflict(
    slotId,
    appointment.doctor,
    appointment.patient
  );

  let updateOperation = {};

  let rescheduleHistory = {
    previousTimeSlot: {
      start: appointment.slot.start,
      end: appointment.slot.end,
      slotId: appointment.slot.slotId,
    },
    newTimeSlot: { start, end, slotId },
    reason: reason || "",
    rescheduledBy: req.user.sub,
    rescheduledByRole: rescheduledByRole,
  };

  if (appointment.status === APPOINTMENT_STATUS.PENDING) {
    updateOperation = {
      $set: {
        "slot.start": start,
        "slot.end": end,
        "slot.slotId": slotId,
      },
    };

    await slotUtils.releaseBlockedSlot(
      appointment.doctor,
      appointment.slot.slotId
    );
    await slotUtils.blockAvailableSlot(appointment.doctor, slotId);
  } else {
    updateOperation = {
      $push: { rescheduleHistory },
    };
  }

  console.log("update operation", updateOperation);

  const updatedAppointment = await Appointment.findOneAndUpdate(
    {
      _id: appointmentId,
    },
    updateOperation,
    { new: true }
  );

  if (!updatedAppointment)
    throw ServerError.badRequest("Unable to update the appointment");

  res.json({
    success: true,
    message: "Appointment rescheduled requested",
    data: {
      appointment,
    },
  });
};

// doctor based controller



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

    const { PENDING, ACCEPTED, CONFIRMED, PAYMENT_PENDING } =
      APPOINTMENT_STATUS;
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
  } catch (error) {
    await session.abortTransaction();
    console.log("doctor cancel error", error);
    throw error;
  } finally {
    await session.endSession();
  }
};

// for all roles

export const respondToReschedule = async (req, res) => {
  const { appointmentId, action } = req.params;

  if (!appointmentId) throw ServerError.badRequest("appointment id not found");
  if (!["accept", "reject"].includes(action))
    throw ServerError.badRequest(
      "you can only accept or reject the reschedule"
    );

  const userId = req.user.sub;
  const user = await (req.user.role === "patient"
    ? Patient.findOne({ user: userId })
    : Doctor.findOne({ userId }));

  if (!user) throw ServerError.notFound("User not found");

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    $or: [{ patient: user._id }, { doctor: user._id }],
  });

  if (!appointment) throw new ServerError.notFound("Appointment not found");

  const pendingRescheduleItem = appointment.rescheduleHistory.find(
    (r) => r.status === RESCHEDULE_STATUS.PENDING
  );

  if (!pendingRescheduleItem)
    throw ServerError.notFound("Pending reschedule slot not found");

  if (pendingRescheduleItem.rescheduledBy.toString() === user._id.toString())
    throw ServerError.notFound("You are the requester of this schedule");

  if (action === "reject") {
    pendingRescheduleItem.status = RESCHEDULE_STATUS.REJECTED;
  } else if (action === "accept") {
    pendingRescheduleItem.status = RESCHEDULE_STATUS.ACCEPTED;
    appointment.slot = pendingRescheduleItem.newTimeSlot;
    appointment.status = APPOINTMENT_STATUS.RESCHEDULED;
  }

  await appointment.save();
  await pendingRescheduleItem.save();
  await Schedule.updateOne(
    { doctorId: appointment.doctor, "availableSlots._id": slotId },
    {
      $set: {
        "availableSlots.$.isBooked": true,
        "availableSlots.$.bookedAt": new Date(),
      },
    }
  );
  res.json({
    success: true,
    message: "appointment rescheduled successfully",
  });
};

export const searchAppointments = async (req, res) => {
  try {
    const {
      doctorId,
      status,
      type,
      fromDate,
      toDate,
      createdFrom,
      createdTo,
      searchQuery,
      page = 1,
      limit = 10,
    } = req.query;

    // Build the filter object
    const filter = {};

    const patient = await Patient.findOne({ user: req.user.sub });

    if (!patient) throw ServerError.notFound("Patient not found");

    const patientId = patient._id;

    // Basic filters
    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      filter.patient = new mongoose.Types.ObjectId(patientId);
    }

    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      filter.patient = new mongoose.Types.ObjectId(doctorId);
    }

    // Status filter with special 'upcoming' case
    if (status) {
      if (status === "upcoming") {
        filter.status = APPOINTMENT_STATUS.CONFIRMED;
        filter["slot.start"] = { $gt: new Date() };
      } else {
        filter.status = status;
      }
    }

    // Type filter
    if (type && Object.values(APPOINTMENT_TYPES).includes(type)) {
      filter.appointmentType = type;
    }

    // Date range filters
    if (fromDate || toDate) {
      filter["slot.start"] = {};
      if (fromDate) filter["slot.start"].$gte = new Date(fromDate);
      if (toDate) filter["slot.start"].$lte = new Date(toDate);
    }

    // Creation date filters
    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) filter.createdAt.$gte = new Date(createdFrom);
      if (createdTo) filter.createdAt.$lte = new Date(createdTo);
    }

    // Text search (across doctor name, specialization, and reason)
    if (searchQuery) {
      const doctors = await mongoose
        .model("Doctor")
        .find({
          $or: [
            { firstName: { $regex: searchQuery, $options: "i" } },
            { lastName: { $regex: searchQuery, $options: "i" } },
            { specialization: { $regex: searchQuery, $options: "i" } },
          ],
        })
        .select("_id");

      filter.$or = [
        { reason: { $regex: searchQuery, $options: "i" } },
        { "cancellation.reason": { $regex: searchQuery, $options: "i" } },
        { doctor: { $in: doctors.map((d) => d._id) } },
      ];
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get appointments with population
    const [appointments, total, stats] = await Promise.all([
      Appointment.find(filter)
        .populate("patient", "firstName lastName profileImage")
        .populate("doctor", "firstName lastName specialization profilePhoto")
        .sort({ "slot.start": 1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Appointment.countDocuments(filter),

      // Get statistics
      getAppointmentStats(filter, patientId, doctorId),
    ]);

    // Calculate upcoming appointments (separate from status filter)
    if (status !== "upcoming") {
      const upcomingFilter = {
        ...filter,
        status: APPOINTMENT_STATUS.CONFIRMED,
      };
      upcomingFilter["slot.start"] = { $gt: new Date() };
      stats.upcoming = await Appointment.countDocuments(upcomingFilter);
    }

    res.json({
      success: true,
      data: {
        appointments,
        stats,
      },
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error("Error searching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search appointments",
      error: error.message,
    });
  }
};

// Helper function to get appointment statistics
async function getAppointmentStats(
  filter,
  patientId,
  doctorId
){
  const baseFilter= {};
  if (patientId) baseFilter.patient = new mongoose.Types.ObjectId(patientId);
  if (doctorId) baseFilter.doctor = new mongoose.Types.ObjectId(doctorId);

  const now = new Date();

  const [
    total,
    pending,
    confirmed,
    completed,
    cancelled,
    rescheduled,
    noShow,
    averageFee,
    upcoming,
  ] = await Promise.all([
    // Total appointments
    Appointment.countDocuments(baseFilter),

    // Status counts
    Appointment.countDocuments({
      ...baseFilter,
      status: APPOINTMENT_STATUS.PENDING,
    }),
    Appointment.countDocuments({
      ...baseFilter,
      status: APPOINTMENT_STATUS.CONFIRMED,
    }),
    Appointment.countDocuments({
      ...baseFilter,
      status: APPOINTMENT_STATUS.COMPLETED,
    }),
    Appointment.countDocuments({
      ...baseFilter,
      status: APPOINTMENT_STATUS.CANCELLED,
    }),
    Appointment.countDocuments({
      ...baseFilter,
      status: APPOINTMENT_STATUS.RESCHEDULED,
    }),
    Appointment.countDocuments({
      ...baseFilter,
      status: APPOINTMENT_STATUS.NO_SHOW,
    }),

    // Average fee
    Appointment.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, avgFee: { $avg: "$fee" } } },
    ]),

    // Upcoming appointments (confirmed and in future)
    Appointment.countDocuments({
      ...baseFilter,
      status: APPOINTMENT_STATUS.CONFIRMED,
      "slot.start": { $gt: now },
    }),
  ]);

  return {
    total,
    upcoming,
    pending,
    confirmed,
    completed,
    cancelled,
    rescheduled,
    noShow,
    averageFee: averageFee[0]?.avgFee
      ? parseFloat(averageFee[0].avgFee.toFixed(2))
      : 0,
  };
}
