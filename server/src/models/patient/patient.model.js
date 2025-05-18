import { model, Schema } from "mongoose";

export const phoneRegex =
  /^(\+251|0)(9|7)\d{8}$|^\+?\d{1,3}[-. ]?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}$/;

// Notification Preferences Schema
const notificationPreferencesSchema = new Schema(
  {
    systemNotification: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: false },
    smsNotification: { type: Boolean, default: false },
  },
  { _id: false }
);

// Location Schema
const locationSchema = new Schema(
  {
    locationType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0],
        validate: {
          validator: (arr) => arr.length === 2,
          message: "Coordinates must be an array of [longitude, latitude]",
        },
      },
    },
  },
  { _id: false }
);

// Emergency Contact Schema
const emergencyContactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    relation: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      match: [phoneRegex, "Invalid phone number format"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
  },
  { _id: false }
);

// Insurance Schema
const insuranceSchema = new Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    policyNumber: {
      type: String,
      required: true,
      trim: true,
    },
    coverageDetails: {
      type: String,
      trim: true,
      default: "",
    },
    validTill: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "active",
    },
  },
  { _id: false }
);

// Patient Schema
const patientSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true, index: "text" },
    middleName: { type: String, required: true, index: "text" },
    lastName: { type: String, required: true, index: "text" },
    profileImage: {
      type: String,
      default: null,
    },
    profileImageId: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [phoneRegex, "Invalid phone number format"],
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: {},
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value < new Date(),
        message: "Date of birth must be in the past",
      },
    },
    emergencyContact: {
      type: [emergencyContactSchema],
      required: true,
    },
    insurance: {
      type: [insuranceSchema],
      default: [],
    },
    preferredLanguage: {
      type: String,
      trim: true,
      default: "English",
    },
    maritalStatus: {
      type: String,
      enum: [
        "single",
        "married",
        "divorced",
        "widowed",
        "separated",
        "other",
        "",
      ],
      default: "",
    },
    location: {
      type: locationSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

patientSchema.virtual("fullName").get(function () {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(" ");
});

// Geospatial Index
patientSchema.index(
  { "location.coordinates": "2dsphere" },
  {
    partialFilterExpression: {
      "location.coordinates": { $exists: true },
    },
  }
);

// Text Index for Name
patientSchema.index({ name: "text" });

export default model("Patient", patientSchema);
