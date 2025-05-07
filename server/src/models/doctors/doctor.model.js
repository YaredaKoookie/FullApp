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
    weeklyAvailability: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          required: true,
        },
        slots: {
          type: [
          {
              start: { type: Date, required: true },
              end: { type: Date, required: true },
            },
          ],
          validate: {
            validator: function (slots) {
              for (let i = 0; i < slots.length - 1; i++) {
                for (let j = i + 1; j < slots.length; j++) {
                  if (
                    (slots[i].start < slots[j].end && slots[i].end > slots[j].start) ||
                    (slots[j].start < slots[i].end && slots[j].end > slots[i].start)
                  ) {
                    return false;
                  }
                }
              }
              return true;
            },
            message: "Time slots cannot overlap.",
          },
        },
      },
    ],
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
