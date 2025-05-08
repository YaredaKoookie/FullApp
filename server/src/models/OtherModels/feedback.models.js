const feedbackSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true }
}, { timestamps: true });

module.exports = model('Feedback', feedbackSchema);