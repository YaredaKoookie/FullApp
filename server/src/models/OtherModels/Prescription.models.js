const prescriptionSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    medications: [{ type: String, required: true }],
    notes: String,
  },
  { timestamps: true }
);

module.exports = model("Prescription", prescriptionSchema);
