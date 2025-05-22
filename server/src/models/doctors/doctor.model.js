import { Schema, model } from "mongoose";

const qualificationSchema = new Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, required: true }, // Could also be Number
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    street1: { type: String, default: "" },
    street2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "Ethiopia" },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  { _id: false }
);

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
    profilePhoto: { type: String },
    profilePhotoId: { type: String },
    nationalIdFanNumber: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    boardCertificationsDocument: { type: String },
    educationDocument: { type: String },
    specialization: { type: String, required: true },
    qualifications: {
      type: [qualificationSchema],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    languages: {
      type: [String],
      default: [],
    },
    hospitalName: { type: String, default: "" },
    hospitalAddress: {
      type: addressSchema,
      default: () => ({}),
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: (v) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v),
        message: "Invalid phone number format",
      },
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceAreas: { type: String },
    totalReviews: { type: Number, default: 0 },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    withdrawalBalance: { type: Number, default: 0 },
    approvedAt: Date,
    autoDeleteAt: {
      type: Date,
      default: null,
      index: { expires: 0 }, // TTL index to auto-delete after the date
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
doctorSchema.virtual("schedule", {
  ref: "Schedule",
  localField: "_id",
  foreignField: "doctorId",
  justOne: true,
});
doctorSchema.pre("save", function (next) {
  this.isProfileComplete =
    this.specialty && this.qualifications?.length > 0 && this.licenseNumber;
  next();
});
export default model("Doctor", doctorSchema);