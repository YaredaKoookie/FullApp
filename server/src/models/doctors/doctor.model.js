const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: String,
    specialization: {
      type: String,
      required: true,
    },
    qualifications: {
      type: [String], // e.g. ['MBBS', 'MD']
      default: [],
    },
    experience: {
      type: Number, // in years
      default: 0,
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    hospitalName: {
      type: String,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    weeklyAvailability: {
      type: Map,
      of: new mongoose.Schema(
        {
          start: { type: String, required: true },
          end: { type: String, required: true },
        },
        { _id: false }
      ),
      default: {},
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalAppointments: {
      type: Number,
      default: 0,
    },
    withdrawalBalance: {
      type: Number,
      default: 0,
    },
    location: {
      city: String,
      state: String,
      country: String,
    },
    profilePicture: {
      type: String, // URL to image
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    licenseDocument: {
      type: String, // URL to uploaded license or medical certification
      required: true,
    },
    idProof: {
      type: String, // URL to uploaded ID (e.g., national ID/passport)
    },
    yearsVerified: {
      type: Boolean,
      default: false,
    },
    applicationNotes: {
      type: String, // Optional field where doctor writes why they’re applying
      maxlength: 1000,
    },
    adminRemarks: {
      type: String, // Admin feedback before/after approval
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);
