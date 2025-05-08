const withdrawalSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date
}, { timestamps: true });

module.exports = model('WithdrawalRequest', withdrawalSchema);