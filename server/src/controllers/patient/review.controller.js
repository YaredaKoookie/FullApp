import Patient from "../../models/patient/patient.model.js";
import ServerError from "../../utils/ServerError.js";
import Doctor from "../../models/doctors/doctor.model.js";
import Appointment from "../../models/appointment/appointment.model.js";
import Review from "../../models/review.model.js";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";

async function updateDoctorRating(doctorId) {
  // Convert string ID to ObjectId if needed
  const doctorObjectId = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;
  
  const stats = await Review.aggregate([
    { 
      $match: { 
        doctor: doctorObjectId 
      } 
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      },
    },
  ]);

  console.log("Doctor ID:", doctorId);
  console.log("Stats:", stats);

  const updateData = stats.length > 0
    ? {
        rating: parseFloat(stats[0].averageRating.toFixed(1)),
        totalReviews: stats[0].totalReviews,
      }
    : { rating: 0, totalReviews: 0 };

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    doctorId,
    { $set: updateData },
    { new: true }
  );

  console.log("Updated Doctor:", updatedDoctor);
  return updatedDoctor;
}

export const createReview = async (req, res) => {
  const { doctorId } = req.params;
  const { rating, reviewText, tags, appointmentId, anonymous } = req.body;

  const patient = await Patient.findOne({ user: req.user.sub })
    .select("_id")
    .lean();

  if (!patient) throw ServerError.notFound("Patient not found");

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patient: patient._id,
    doctor: doctorId,
  });

  if (!appointment) throw ServerError.notFound("Appointment not found");

  if (appointment.status !== "completed")
    throw ServerError.badRequest(
      "Reviews are allowed only for completed appointments"
    );

  let review = await Review.findOne({ appointment: appointment._id });

  if (review) throw ServerError.badRequest("Review already exists");

  review = await Review.create({
    patient: patient._id,
    doctor: doctorId, // Use doctorId directly from params
    appointment: appointment._id,
    anonymous,
    rating,
    reviewText,
    tags,
  });

  await updateDoctorRating(doctorId);

  res.json({
    success: true,
    data: { review },
  });
};

export const getReviews = async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 10, minRating } = req.query;
  const skip = (page - 1) * limit;

  if (!doctorId || isValidObjectId(!doctorId))
    throw ServerError.badRequest("Invalid doctor id");

  const query = { doctor: doctorId };
  if (minRating) query.rating = { $gt: Number(minRating) };

  const reviews = await Review.find(query)
    .populate({
      path: "patient",
      select: "firstName middleName lastName profileImage",
      options: { virtuals: true }
    })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalReviews = await Review.countDocuments(query);
  const totalPages = Math.ceil(totalReviews / limit);

  res.json({
    success: true,
    data: { reviews },
    pagination: {
      totalReviews,
      totalPages,
      page: Number(page),
      limit: Number(limit),
    },
  });
};

export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, reviewText, anonymous, tags } = req.body;
  const userId = req.user.sub;
  console.log("body", req.body);
  if (!reviewId || !isValidObjectId(reviewId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid review ID" });
  }

  const patient = await Patient.findOne({ user: userId }).select("_id").lean();

  if (!patient) {
    return res
      .status(403)
      .json({ success: false, message: "Patient not found" });
  }

  const review = await Review.findOneAndUpdate(
    { _id: reviewId, patient: patient._id },
    {
      rating,
      reviewText,
      anonymous,
      tags,
      edited: true,
    },
    { new: true }
  ).populate("doctor", "fullName specialty -_id");

  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "Review not found" });
  }

  // Update doctor rating if rating changed
  if (rating !== review.rating) {
    await updateDoctorRating(review.doctor._id);
  }

  res.json({ success: true, data: { review } });
};

export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.sub;

  const patient = await Patient.findOne({ user: userId }).select("_id").lean();

  if (!patient) throw ServerError.notFound("Patient not found");

  const deleteReview = await Review.findOneAndDelete({
    _id: reviewId,
    patient: patient._id,
  });

  if (!deleteReview) throw ServerError.notFound("Review not found");

  await updateDoctorRating(deleteReview.doctor);

  res.json({
    success: true,
    message: "review deleted successfully",
    data: [],
  });
};

export const canReviewDoctor = async (req, res) => {
  const { doctorId } = req.params;
  const userId = req.user.sub;

  const patient = await Patient.findOne({ user: userId })
    .select("_id")
    .lean();

  if (!patient) throw ServerError.notFound("Patient not found");

  // Find completed appointments for this doctor
  const completedAppointments = await Appointment.find({
    patient: patient._id,
    doctor: doctorId,
    status: "completed"
  }).select("_id slot");

  // Check if any of these appointments don't have reviews
  const appointmentsWithoutReviews = await Promise.all(
    completedAppointments.map(async (appointment) => {
      const review = await Review.findOne({ appointment: appointment._id });
      return review ? null : appointment;
    })
  );

  const availableAppointments = appointmentsWithoutReviews.filter(Boolean);

  res.json({
    success: true,
    data: {
      canReview: availableAppointments.length > 0,
      availableAppointments
    }
  });
};

// #### PUBLIC END
