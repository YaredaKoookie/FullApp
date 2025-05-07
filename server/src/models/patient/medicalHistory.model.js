const medicalHistorySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    medications: [
      {
        name: {type: String, required: [true, "medication name is required"]},
        dosage: String,
        frequency: String,
      },
    ],
    surgeries: [
      {
        type: String,
        date: Date,
      },
    ],
    familyHistory: [
      {
        relation: {type: String, trim: true},
        condition: {type: String, trim: true},
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("MedicalHistory", medicalHistorySchema);
