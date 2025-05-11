import { Schema, model } from "mongoose";

const doctorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true, index: "text" },
    middleName: { type: String, required: true, index: "text" },
    lastName: { type: String, required: true, index: "text" },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    dateOfBirth: { type: Date, required: true },
    profilePhoto: { type: String, required: true },

    nationalId: {
      frontImage: { type: String, required: true },
      backImage: { type: String, required: true },
    },

    licenseInfo: {
      frontImage: { type: String, required: true },
      backImage: { type: String, required: true },
    },

    specialization: { type: String, required: true },
    specialties: [
      {
        name: { type: String, required: true, index: true },
        category: { type: String },
      },
    ],
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],
    yearsOfExperience: { type: Number, required: true },
    boardCertificationsDocument: { type: String, required: true },
    educationDocument: { type: String, required: true },
    languages: { type: [String], default: [] },
    hospitalName: { type: String },
    hospitalAddress: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
        required: false,
      },
      street1: String,
      street2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: (v) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v),
        message: "Invalid phone number format",
      },
    },
    consultationFee: { type: Number, default: 0 },
    serviceAreas: { type: [String], default: [] },
    workingHours: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        breaks: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],

    appointmentDuration: { type: Number, default: 30 },
    totalReviews: { type: Number, default: 0 },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalAppointments: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    withdrawalBalance: { type: Number, default: 0 },

    location: {
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    applicationNotes: {
      type: String,
      maxlength: 1000,
    },

    approvedAt: Date,
    autoDeleteAt: {
  type: Date,
  default: null,
  index: { expires: 0 }  // TTL index to auto-delete after the date
},
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    isActive: { type: Boolean, default: true },
    bio: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

doctorSchema.virtual("fullName").get(function () {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(" ");
});

doctorSchema.virtual("formattedAddress").get(function () {
  const addr = this.hospitalAddress;
  const parts = [
    addr?.street1,
    addr?.street2,
    addr?.city && `${addr.city}, ${addr.state} ${addr.postalCode}`,
    addr?.country,
  ].filter(Boolean);
  return parts.join(", ");
});
doctorSchema.index({ autoDeleteAt: 1 }, { expireAfterSeconds: 0 });
export default model("Doctor", doctorSchema);
