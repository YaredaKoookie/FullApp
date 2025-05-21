import mongoose from "mongoose";

export const ALLERGY_SEVERITY = ["Mild", "Moderate", "Severe", "Life-threatening"];
const CONDITION_STATUS = ["Active", "In Remission", "Resolved", "Chronic"];
export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];
const DATA_SOURCES = [
  "Patient Reported",
  "EHR Import",
  "Doctor Added",
  "Clinic Records",
];
export const FREQUENCY_OPTIONS = ["Never", "Occasionally", "Weekly", "Daily"];

const medicalHistorySchema = new mongoose.Schema(
  {
    // === Core Reference ===
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      immutable: true,
    },

    // === Medical Conditions ===
    pastConditions: [
      {
        name: { type: String, required: true },
        diagnosisDate: {
          type: Date,
          validate: {
            validator: function (v) {
              return !v || v <= new Date();
            },
            message: "Diagnosis date cannot be in the future",
          },
        },
        resolvedDate: {
          type: Date,
          validate: {
            validator: function (v) {
              return !v || v >= this.diagnosisDate;
            },
            message: "Resolved date must be after diagnosis date",
          },
        },
      },
    ],

    chronicConditions: [
      {
        name: { type: String, required: true },
        diagnosisDate: {
          type: Date,
          required: true,
          validate: {
            validator: function (v) {
              return v <= new Date();
            },
            message: "Diagnosis date cannot be in the future",
          },
        },
        status: { type: String, enum: CONDITION_STATUS, default: "Active" },
        lastFlareUp: {
          type: Date,
          validate: {
            validator: function (v) {
              return !v || v <= new Date();
            },
            message: "Last flare-up date cannot be in the future",
          },
        },
      },
    ],

    // === Procedures ===
    surgeries: [
      {
        name: { type: String, required: true },
        date: {
          type: Date,
          validate: {
            validator: function (v) {
              return v <= new Date();
            },
            message: "Procedure date cannot be in the future",
          },
        },
        outcome: { type: String },
        hospital: { type: String },
        surgeon: { type: String },
      },
    ],

    hospitalizations: [
      {
        reason: { type: String, required: true },
        admissionDate: { type: Date, required: true },
        dischargeDate: {
          type: Date,
          validate: {
            validator: function (v) {
              return v >= this.admissionDate;
            },
            message: "Discharge date must be after admission",
          },
        },
        hospitalName: { type: String, required: true },
        dischargeSummary: String,
      },
    ],

    // === Medications ===
    currentMedications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        startDate: { type: Date, default: Date.now },
        prescribedBy: { type: String },
        purpose: { type: String },
        isActive: { type: Boolean, default: true },
      },
    ],

    pastMedications: [
      {
        name: { type: String, required: true },
        reasonStopped: { type: String },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        startDate: { type: Date, default: Date.now },
        prescribedBy: { type: String },
        purpose: { type: String },
        endDate: {
          type: Date,
          validate: {
            validator: function (v) {
              return !v || v >= this.startDate;
            },
            message: "End date cannot be before start date",
          },
        },
      },
    ],

    // === Allergies ===
    allergies: [
      {
        substance: { type: String, required: true },
        reaction: { type: String, required: true },
        severity: {
          type: String,
          required: true,
          enum: ALLERGY_SEVERITY,
        },
        isCritical: { type: Boolean, default: false },
        firstObserved: {
          type: Date,
          validate: {
            validator: function (v) {
              return !v || v <= new Date();
            },
            message: "Observation date cannot be in the future",
          },
        },
      },
    ],

    // === Family History ===
    familyHistory: [
      {
        relation: {
          type: String,
          required: true,
          enum: ["Father", "Mother", "Sibling", "Grandparent", "Other"],
        },
        condition: { type: String, required: true },
        ageAtDiagnosis: {
          type: Number,
          min: 0,
          max: 120,
        },
        deceased: Boolean,
      },
    ],

    // === Lifestyle ===
    lifestyle: {
      smoking: {
        status: { type: Boolean, default: false },
        frequency: { type: String, enum: FREQUENCY_OPTIONS },
        years: { type: Number },
      },
      alcohol: {
        status: { type: Boolean, default: false },
        frequency: { type: String },
      },
      exerciseFrequency: { type: String },
      diet: { type: String },
      occupation: { type: String },
    },

    // === Vital Health Data ===
    bloodType: {
      type: String,
      enum: BLOOD_TYPES,
    },
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    lastPhysicalExam: Date,

    // === Immunizations ===
    immunizations: [
      {
        vaccine: { type: String, required: true },
        date: { type: Date, required: true },
        boosterDue: Date,
        administeredBy: String,
      },
    ],

    // === Women's Health (Optional) ===
    womenHealth: {
      pregnancies: Number,
      liveBirths: Number,
      lastMenstrualPeriod: Date,
      contraceptiveUse: Boolean,
      menstrualCycleRegular: Boolean,
    },

    // === Metadata ===
    metadata: {
      lastReviewed: {
        type: Date,
        validate: {
          validator: function (v) {
            return !v || v <= new Date();
          },
          message: "Review date cannot be in the future",
        },
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      source: {
        type: String,
        enum: DATA_SOURCES,
        default: "Patient Reported",
      },
      updates: {
        type: [
          {
            date: { type: Date, required: true },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
            changes: { type: [String], required: true },
          },
        ],
      },
      notes: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === Indexes ===
medicalHistorySchema.index({ patient: 1 }); // Primary patient lookup
medicalHistorySchema.index({ "allergies.substance": 1 }); // Emergency access
medicalHistorySchema.index({ "currentMedications.name": 1 }); // Drug interactions
medicalHistorySchema.index({ "chronicConditions.name": 1 }); // Disease management
medicalHistorySchema.index({ "hospitalizations.admissionDate": -1 }); // Timeline view

// === Virtuals ===
medicalHistorySchema.virtual("age").get(function () {
  if (!this.patient?.dob) return null;
  const diff = Date.now() - this.patient.dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

// === Body Max
medicalHistorySchema.virtual("bmi").get(function () {
  if (!this.height || !this.weight) return null;
  const heightInMeters = this.height / 100;
  return (this.weight / heightInMeters ** 2).toFixed(2);
});

// === Pre-save Hook ===
medicalHistorySchema.pre("save", function (next) {
  if (this.isModified("currentMedications")) {
    this.currentMedications = this.currentMedications.map((med) => ({
      ...med,
      isActive: !med.endDate || med.endDate > new Date(),
    }));
  }
  next();
});

export default mongoose.model("MedicalHistory", medicalHistorySchema);
