const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      start: { type: String, required: true }, // e.g. '10:00'
      end: { type: String, required: true }, // e.g. '10:30'
    },
    symptoms: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "cancelled", "completed"],
      default: "pending",
    },
    payment: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending",
      },
      method: { type: String }, // e.g. "card", "paypal"
      transactionId: { type: String },
    },
    notes: {
      doctor: { type: String },
      patient: { type: String },
    },
    isVideoCall: {
      type: Boolean,
      default: false,
    },
    videoCallToken: {
      type: String,
    },
    chatStatus: {
      typing: { type: Boolean, default: false },
      seen: { type: Boolean, default: false },
    },
    uploadedFiles: [
      {
        type: String, // file URL
      },
    ],
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
