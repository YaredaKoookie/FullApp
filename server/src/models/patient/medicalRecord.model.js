import mongoose from "mongoose";

const SOURCE_OPTIONS = ["Doctor", "System"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Unknown"];
const CONDITION_STATUS = ["Active", "Resolved", "In Remission", "Chronic"];

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      immutable: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      immutable: true,
      validate: {
        validator: async function(appointmentId) {
          const appointment = await mongoose.model('Appointment').findById(appointmentId);
          return appointment?.status === 'Completed';
        },
        message: "Medical records can only be created for completed appointments"
      }
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      immutable: true,
    },

    source: {
      type: String,
      enum: SOURCE_OPTIONS,
      default: "Doctor",
    },

    clinicalNotes: [
      {
        date: { type: Date, default: Date.now },
        note: { type: String, required: true },
      },
    ],

    diagnoses: [
      {
        name: { type: String, required: true },
        status: { type: String, enum: CONDITION_STATUS, default: "Active" },
        diagnosisDate: { type: Date },
        resolvedDate: { type: Date },
        code: { type: String }, // ICD-10/11 or SNOMED code
        notes: { type: String },
      },
    ],

    prescriptions: [
      {
        medication: { type: String, required: true },
        dosage: { type: String },
        frequency: { type: String },
        route: { type: String }, // oral, IV, topical, etc.
        duration: { type: String },
        startDate: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],

    labResults: [
      {
        testName: { type: String, required: true },
        result: { type: String, required: true },
        units: { type: String },
        referenceRange: { type: String },
        date: { type: Date, required: true },
        comments: { type: String },
      },
    ],

    imagingReports: [
      {
        type: { type: String, required: true }, // X-ray, MRI, CT
        findings: { type: String },
        impression: { type: String },
        date: { type: Date, required: true },
        reportUrl: { type: String }, // cloud storage
      },
    ],

    procedures: [
      {
        name: { type: String, required: true },
        date: { type: Date, required: true },
        outcome: { type: String },
        hospital: { type: String },
        surgeon: { type: String },
        notes: { type: String },
      },
    ],

    hospitalizations: [
      {
        reason: { type: String, required: true },
        admissionDate: { type: Date, required: true },
        dischargeDate: { type: Date },
        hospitalName: { type: String },
        dischargeSummary: { type: String },
      },
    ],

    vitalSigns: [
      {
        date: { type: Date, default: Date.now },
        bloodPressure: { type: String },
        heartRate: { type: Number },
        respiratoryRate: { type: Number },
        temperature: { type: Number },
        oxygenSaturation: { type: Number },
      },
    ],

    immunizations: [
      {
        vaccine: { type: String, required: true },
        date: { type: Date, required: true },
        lotNumber: { type: String },
        site: { type: String }, // arm, thigh, etc.
        manufacturer: { type: String },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for quick retrieval
medicalRecordSchema.index({ patient: 1 });
medicalRecordSchema.index({ "diagnoses.name": 1 });
medicalRecordSchema.index({ "labResults.testName": 1 });
medicalRecordSchema.index({ "clinicalNotes.date": -1 });

medicalRecordSchema.virtual('bmi').get(function() {
  if (!this.vitals?.height || !this.vitals?.weight) return null;
  const heightInM = this.vitals.height.unit === 'cm' 
    ? this.vitals.height.value / 100 
    : this.vitals.height.value * 0.0254;
  return (this.vitals.weight.value / (heightInM * heightInM)).toFixed(1);
});

export default mongoose.model("MedicalRecord", medicalRecordSchema);
