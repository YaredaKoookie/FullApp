const recordSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  fileUrl: { type: String, required: true },
  description: String
}, { timestamps: true });

module.exports = model('MedicalRecord', recordSchema);