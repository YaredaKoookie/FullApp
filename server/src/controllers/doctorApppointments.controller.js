import Appointment, {
  APPOINTMENT_STATUS,
} from "../models/appointment/appointment.model.js";
import User from "../models/patient/patient.model.js";
import Doctor from "../models/doctors/doctor.model.js";
import ServerError from "../utils/ServerError.js";
import { isValidObjectId } from "mongoose";

// Get all appointments for the logged-in doctor
export const getAppointments = async (req, res) => {
  try {
    const { status, dateRange, search, sort, page = 1, limit = 10 } = req.query;
    const { sub: userId } = req.user;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

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
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query["slot.start"] = { $gte: startDate };
          break;
        case "thisWeek":
          const day = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
          query["slot.start"] = { $gte: startDate };
          break;
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          query["slot.start"] = { $gte: startDate };
          break;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } }
      ];
    }

    // Sort
    let sortOption = { "slot.start": -1 };
    if (sort === "oldest") {
      sortOption = { "slot.start": 1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName profileImage")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in getAppointments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private (Doctor)
export const getAppointmentStats = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    
    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    const stats = {
      completed: await Appointment.countDocuments({
        doctor: doctor._id,
        status: APPOINTMENT_STATUS.COMPLETED
      }),
      pending: await Appointment.countDocuments({
        doctor: doctor._id,
        status: APPOINTMENT_STATUS.PENDING
      }),
      confirmed: await Appointment.countDocuments({
        doctor: doctor._id,
        status: APPOINTMENT_STATUS.CONFIRMED
      }),
      cancelled: await Appointment.countDocuments({
        doctor: doctor._id,
        status: APPOINTMENT_STATUS.CANCELLED
      })
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in getAppointmentStats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

// @desc    Accept an appointment
// @route   POST /api/appointments/:id/accept
// @access  Private (Doctor)
export const acceptAppointment = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;
    const { sub: userId } = req.user;

    if (!isValidObjectId(appointmentId)) {
      throw ServerError.badRequest("Invalid appointment ID");
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
      status: APPOINTMENT_STATUS.PENDING
    });

    if (!appointment) {
      throw ServerError.notFound("Appointment not found or cannot be accepted");
    }

    appointment.status = APPOINTMENT_STATUS.ACCEPTED;
    appointment.acceptedAt = new Date();
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment accepted successfully",
      data: appointment
    });
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in acceptAppointment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

// @desc    Reject an appointment
// @route   POST /api/appointments/:id/reject
// @access  Private (Doctor)
export const rejectAppointment = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;
    const { note } = req.body;
    const { sub: userId } = req.user;

    if (!note) {
      throw ServerError.badRequest("Rejection note is required");
    }

    if (!isValidObjectId(appointmentId)) {
      throw ServerError.badRequest("Invalid appointment ID");
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
      status: APPOINTMENT_STATUS.PENDING
    });

    if (!appointment) {
      throw ServerError.notFound("Appointment not found or cannot be rejected");
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancellation = {
      reason: note,
      cancelledBy: doctor._id,
      cancelledByRole: "Doctor",
      cancelledAt: new Date()
    };
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment rejected successfully",
      data: appointment
    });
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in rejectAppointment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

// @desc    Reschedule an appointment
// @route   POST /api/appointments/:id/reschedule
// @access  Private (Doctor)
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;
    const { newTime, reason } = req.body;
    const { sub: userId } = req.user;

    if (!newTime || !reason) {
      throw ServerError.badRequest("New time and reason are required");
    }

    if (!isValidObjectId(appointmentId)) {
      throw ServerError.badRequest("Invalid appointment ID");
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] }
    });

    if (!appointment) {
      throw ServerError.notFound("Appointment not found or cannot be rescheduled");
    }

    const newDate = new Date(newTime);
    const existingAppointment = await Appointment.findOne({
      doctor: doctor._id,
      "slot.start": newDate,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
      _id: { $ne: appointmentId }
    });

    if (existingAppointment) {
      throw ServerError.badRequest("You already have an appointment at this time");
    }

    // Add to reschedule history
    appointment.rescheduleHistory.push({
      previousTimeSlot: appointment.slot,
      newTimeSlot: {
        slotId: appointment.slot.slotId,
        start: newDate,
        end: new Date(newDate.getTime() + (appointment.slot.end - appointment.slot.start))
      },
      reason,
      rescheduledBy: doctor._id,
      rescheduledByRole: "Doctor",
      rescheduledAt: new Date()
    });

    // Update appointment
    appointment.slot.start = newDate;
    appointment.slot.end = new Date(newDate.getTime() + (appointment.slot.end - appointment.slot.start));
    appointment.status = APPOINTMENT_STATUS.RESCHEDULED;
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: appointment
    });
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in rescheduleAppointment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

// @desc    Cancel an appointment
// @route   POST /api/appointments/:id/cancel
// @access  Private (Doctor)
export const cancelAppointment = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;
    const { reason } = req.body;
    const { sub: userId } = req.user;

    if (!reason) {
      throw ServerError.badRequest("Cancellation reason is required");
    }

    if (!isValidObjectId(appointmentId)) {
      throw ServerError.badRequest("Invalid appointment ID");
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] }
    });

    if (!appointment) {
      throw ServerError.notFound("Appointment not found or cannot be cancelled");
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancellation = {
      reason,
      cancelledBy: doctor._id,
      cancelledByRole: "Doctor",
      cancelledAt: new Date()
    };
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment
    });
  } catch (error) {
    if (error instanceof ServerError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in cancelAppointment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

// Helper function to generate tokens
function generateToken() {
  return require("crypto").randomBytes(20).toString("hex");
}
