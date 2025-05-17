import Appointment, {
  APPOINTMENT_STATUS,
} from "../models/appointment/appointment.model.js";
import User from "../models/patient/patient.model.js";
// import { sendEmail } from '../utils/emailService.js';
import Doctor from "../models/doctors/doctor.model.js";
import ServerError from "../utils/ServerError.js";
import { isValidObjectId } from "mongoose";
// @desc    Get all appointments with filters
// @route   GET /api/appointments
// @access  Private (Doctor)

export const getAppointments = async (req, res) => {
  try {
    const { status, dateRange, search, sort } = req.query;

    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });

    // Build query object
    const query = { doctor: doctor._id };
    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          query.date = { $gte: startDate };
          break;
        case "thisWeek":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          query.date = { $gte: startDate };
          break;
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          query.date = { $gte: startDate };
          break;
      }
    }

    // Search filter
    if (search) {
      const patients = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
        role: "patient",
      }).select("_id");

      query.$or = [
        { patient: { $in: patients } },
        { reason: { $regex: search, $options: "i" } },
      ];
    }

    // Sort
    let sortOption = { date: -1 }; // Default: newest first
    if (sort) {
      switch (sort) {
        case "date-asc":
          sortOption = { date: 1 };
          break;
        case "fee-desc":
          sortOption = { fee: -1 };
          break;
        case "fee-asc":
          sortOption = { fee: 1 };
          break;
        case "status":
          sortOption = { status: 1 };
          break;
      }
    }

    const appointments = await Appointment.find(query).populate("patient");
    //   .sort(sortOption);
    console.log("app", appointments);
    console.log(query);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private (Doctor)
export const getAppointmentStats = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctorId = await Doctor.findOne({ userId });

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      completed: await Appointment.countDocuments({
        doctor: doctorId._id,
        status: "completed",
      }),

      pending: await Appointment.countDocuments({
        doctor: doctorId._id,
        status: "pending",
      }),

      confirmed: await Appointment.countDocuments({
        doctor: doctorId._id,
        status: "confirmed",
      }),

      cancelled: await Appointment.countDocuments({
        doctor: doctorId._id,
        status: "cancelled",
      }),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Accept an appointment
// @route   POST /api/appointments/:id/accept
// @access  Private (Doctor)
export const acceptAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.sub;

  if (!appointmentId)
    throw ServerError.badRequest("appointment id is required");

  if (!isValidObjectId(appointmentId))
    throw ServerError.badRequest("appointment id is in a valid format");

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

// @desc    Reject an appointment
// @route   POST /api/appointments/:id/reject
// @access  Private (Doctor)
export const rejectAppointment = async (req, res) => {
  try {
    const { note } = req.body;

    if (!note) {
      return res
        .status(400)
        .json({ message: "Please provide a rejection note" });
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        doctor: req.user.id,
        status: "pending",
      },
      {
        status: "cancelled",
        cancellationNote: note,
        cancelledAt: new Date(),
        cancelledBy: req.user.id,
      },
      { new: true }
    ).populate("patient", "name email");

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or already processed" });
    }

    // Send rejection email to patient
    // await sendEmail({
    //   to: appointment.patient.email,
    //   subject: 'Appointment Rejected',
    //   text: `Your appointment with Dr. ${req.user.name} has been rejected. Reason: ${note}`
    // });

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Reschedule an appointment
// @route   POST /api/appointments/:id/reschedule
// @access  Private (Doctor)
export const rescheduleAppointment = async (req, res) => {
  try {
    const { newTime, reason } = req.body;

    if (!newTime || !reason) {
      return res
        .status(400)
        .json({ message: "Please provide new time and reason" });
    }

    const newDate = new Date(newTime);
    const existingAppointment = await Appointment.findOne({
      doctor: req.user.id,
      date: newDate,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return res
        .status(400)
        .json({ message: "You already have an appointment at this time" });
    }

    const oldAppointment = await Appointment.findById(req.params.id);

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        doctor: req.user.id,
        status: { $in: ["pending", "confirmed"] },
      },
      {
        status: "rescheduled",
        rescheduledAt: new Date(),
        rescheduledBy: req.user.id,
        history: [
          ...(oldAppointment.history || []),
          {
            type: "reschedule",
            from: oldAppointment.date,
            to: newDate,
            reason,
            date: new Date(),
          },
        ],
      },
      { new: true }
    );

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or cannot be rescheduled" });
    }

    // Create new appointment
    const newAppointment = await Appointment.create({
      patient: appointment.patient,
      doctor: appointment.doctor,
      date: newDate,
      reason: appointment.reason,
      type: appointment.type,
      fee: appointment.fee,
      status: "confirmed",
      videoCallToken:
        appointment.type === "virtual" ? generateToken() : undefined,
      chatToken: generateToken(),
      previousAppointment: appointment._id,
      history: [
        {
          type: "status_change",
          from: "rescheduled",
          to: "confirmed",
          date: new Date(),
        },
      ],
    });

    // Send reschedule email to patient
    // await sendEmail({
    //   to: newAppointment.patient.email,
    //   subject: 'Appointment Rescheduled',
    //   text: `Your appointment with Dr. ${req.user.name} has been rescheduled to ${newDate}. Reason: ${reason}`
    // });

    res.json(newAppointment);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Cancel an appointment
// @route   POST /api/appointments/:id/cancel
// @access  Private (Doctor)
export const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ message: "Please provide a cancellation reason" });
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        doctor: req.user.id,
        status: { $in: ["pending", "confirmed"] },
      },
      {
        status: "cancelled",
        cancellationNote: reason,
        cancelledAt: new Date(),
        cancelledBy: req.user.id,
        history: [
          ...(appointment.history || []),
          {
            type: "status_change",
            from: appointment.status,
            to: "cancelled",
            date: new Date(),
            note: reason,
          },
        ],
      },
      { new: true }
    ).populate("patient", "name email");

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or cannot be cancelled" });
    }

    // Send cancellation email to patient
    // await sendEmail({
    //   to: appointment.patient.email,
    //   subject: 'Appointment Cancelled',
    //   text: `Your appointment with Dr. ${req.user.name} has been cancelled. Reason: ${reason}`
    // });

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Helper function to generate tokens
function generateToken() {
  return require("crypto").randomBytes(20).toString("hex");
}
