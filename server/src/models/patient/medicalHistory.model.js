import mongoose from "mongoose";

const ALLERGY_SEVERITY = ["Mild", "Moderate", "Severe", "Life-threating"];

const medicalHistorySchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  pastConditions: [{ type: String }],       // e.g., ["Diabetes", "Hypertension"]
  surgeries: [{ 
    name: { type: String, required: true },
    date: { type: Date },
    outcome: { type: String },
    hospital: {type: String},
  }],
  allergies: [{ 
    substance: { type: String, required: true },
    reaction: { type: String },
    severity: {
      type: String, 
      required: true,
      enum: ALLERGY_SEVERITY
    }
  }],
  hospitalization: [{
    reason: { type: String, required: true}, 
    admissionData: Date, 
    dischargeDate: Date,
    hospitalName: String
  }],
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
  }],
  chronicConditions: [{ name: {type: String}, diagnosisDate: Date }],      // e.g., ["Asthma"]
  familyHistory: [{ 
    relation: { type: String, required: true },             // e.g., "Father"
    condition: { type: String, required: true },            // e.g., "Heart Disease"
  }],
  lifestyle: {
    smoking: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    exerciseFrequency: { type: String },    // e.g., "3 times per week"
  },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('MedicalHistory', medicalHistorySchema);
