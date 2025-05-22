import mongoose from "mongoose";

export const ALLERGY_SEVERITY = {
  MILD: "Mild",
  MODERATE: "Moderate",
  SEVERE: "Severe",
  LIFE_THREATENING: "Life-threatening",
}
export const CONDITION_STATUS = {
  ACTIVE: "Active",
  IN_REMISSION: "In Remission",
  RESOLVED: "Resolved",
}
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

export const DATA_SOURCE = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  SYSTEM: "System"
}
export const FREQUENCY_OPTIONS = ["Never", "Occasionally", "Weekly", "Daily"];
export const RELATIONSHIPS = ['Mother', 'Father', 'Sister', 'Brother', 'Maternal Grandmother', 'Maternal Grandfather',
  'Paternal Grandmother', 'Paternal Grandfather', 'Aunt', 'Uncle', 'Cou1sin', 'Other'];

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
    conditions: [
      {
        name: { type: String, required: true },
        status: { type: String, enum: Object.values(CONDITION_STATUS), default: CONDITION_STATUS.ACTIVE },
        isChronic: { type: Boolean, default: false },
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
              if (this.status === "Resolved") {
                return !v || v >= this.diagnosisDate;
              }
              return true
            },
            message: "Resolved date must be after diagnosis date",
          },
        },
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
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
        surgeon: {
          doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
          }, 
          name: String
        },
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
        },
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
        hospitalName: { type: String },
        dischargeSummary: { type: String },
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
        },

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
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
        },
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
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
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
          enum: Object.values(ALLERGY_SEVERITY),
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
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
        },
      },
    ],

    // === Family History ===
    familyHistory: [
      {
        relation: {
          type: String,
          required: true,
          enum: RELATIONSHIPS,
        },
        condition: { type: String, required: true },
        ageAtDiagnosis: {
          type: Number,
          min: 0,
          max: 120,
        },
        deceased: Boolean,
        notes: { type: String},
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
        },
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
      source: {
        type: String,
        enum: Object.values(DATA_SOURCE),
        default: DATA_SOURCE.PATIENT,
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "source",
      },
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
        date: {
          type: Date,
          required: true,
          validate: {
            validator: (v) => v <= new Date(),
            message: "Vaccination date cannot be in the future",
          },
        },
        boosterDue: {
          type: Date,
          validate: {
            validator: function (v) {
              return !v || v > this.date;
            },
            message: "Booster due date must be after vaccination date",
          },
        },
        administeredBy: String,
        source: {
          type: String,
          enum: Object.values(DATA_SOURCE),
          default: DATA_SOURCE.PATIENT,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "source",
        },
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
