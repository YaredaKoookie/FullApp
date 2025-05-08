import mongoose from "mongoose";

export const REVIEW_TAGS = ["professional", "helpful", "empathetic", "on-time", "rushed", "disorganized"]

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient", // Assuming Patient model includes both doctors and patients
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // One review per appointment
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    reviewText: {
      type: String,
      maxlength: 1000,
    },
    edited: {
      type: Boolean, 
      default: false,
    },
    tags: {
      type: [String],
      enum: REVIEW_TAGS,
      default: [],
    },
    anonymous: {
      type: Boolean, 
      default: false,
    },
    response: {
      byDoctor: {
        type: String,
        maxlength: 500,
      },
      respondedAt: {
        type: Date,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


reviewSchema.statics.getAverageRating = async function(doctorId) {
  const result = await this.aggregate([
    { $match: { doctor: doctorId, status: 'approved' } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  return result.length ? result[0] : { avgRating: 0, count: 0 };
};

// Compound Indexes
reviewSchema.index({ appointment: 1, rating: -1 });
reviewSchema.index({ patient: 1, appointment: 1 }, { unique: true });
reviewSchema.index({ doctor: 1, isVerified: 1 });

export default mongoose.model("Review", reviewSchema);
