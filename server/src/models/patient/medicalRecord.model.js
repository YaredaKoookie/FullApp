const PrescriptionSchema = new Schema(
  {
    name: { type: String, required: true },
    instruction: String,
    dosage: { type: String, required: true },
    duration: { type: String, required: true },
  },
  { timestamps: true }
);

const testOrderedSchema = new Schema({
  testName: { type: String, required: true },
  result: { type: String },
  orderedDate: { type: String, default: Date.now() },
  resultDate: { type: Date },
  reportUrl: String,
});

const medicalRecordSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    prescriptions: [PrescriptionSchema],
    testsOrdered: [testOrderedSchema],
    follUpDate: { type: Date },
    followUpRequired: { type: Boolean, default: false },
    additionalNotes: String,
    lifeStyleChanges: [String],
    symptoms: [{ type: String }],
    fileUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default model("MedicalRecord", medicalRecordSchema);
