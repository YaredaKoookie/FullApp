// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
  isVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


// models/Doctor.js
const { Schema, model } = require('mongoose');

const doctorSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true, trim: true },
  qualifications: [{ type: String, trim: true }],
  experience: { type: Number, default: 0, min: 0 },
  bio: { type: String, maxlength: 1000, trim: true },
  hospitalName: { type: String, trim: true },
  consultationFee: { type: Number, default: 0, min: 0 },
  weeklyAvailability: {
    type: Map,
    of: new Schema({ start: String, end: String }, { _id: false }),
    default: {}
  },
  totalReviews: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalEarnings: { type: Number, default: 0, min: 0 },
  totalAppointments: { type: Number, default: 0, min: 0 },
  withdrawalBalance: { type: Number, default: 0, min: 0 },
  location: {
    city: String,
    state: String,
    country: String
  },
  profilePicture: { type: String },
  licenseNumber: { type: String, required: true, unique: true, trim: true },
  licenseDocument: { type: String, required: true },
  idProof: { type: String },
  applicationNotes: { type: String, maxlength: 1000 },
  adminRemarks: { type: String },
  approvalStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedAt: { type: Date },
}, { timestamps: true });

docTor = model('Doctor', doctorSchema);
module.exports = docTor;


// models/Patient.js
const patientSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  age: { type: Number, min: 0 },
  gender: { type: String, enum: ['male','female','other'] },
  medicalHistory: { type: String, trim: true },
}, { timestamps: true });

module.exports = model('Patient', patientSchema);


// models/Appointment.js
const appointmentSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  date: { type: Date, required: true },
  slot: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  reason: { type: String, trim: true },
  status: { type: String, enum: ['pending','approved','declined','cancelled','completed'], default: 'pending' },
  notes: { type: String, trim: true },
  payment: {
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending','paid','refunded'], default: 'pending' },
    method: String,
    transactionId: String
  },
  isVideoCall: { type: Boolean, default: false },
  videoCallToken: String,
  completedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

module.exports = model('Appointment', appointmentSchema);


// models/Chat.js
const chatSchema = new Schema({
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = model('Chat', chatSchema);


// models/Message.js
const messageSchema = new Schema({
  chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, trim: true },
  seen: { type: Boolean, default: false },
  attachments: [String]
}, { timestamps: true });

module.exports = model('Message', messageSchema);


// models/Feedback.js
const feedbackSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true }
}, { timestamps: true });

module.exports = model('Feedback', feedbackSchema);


// models/WithdrawalRequest.js
const withdrawalSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date
}, { timestamps: true });

module.exports = model('WithdrawalRequest', withdrawalSchema);


// models/Transaction.js
const transactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['payment','withdrawal'], required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending','success','failed'], default: 'pending' },
  reference: String
}, { timestamps: true });

module.exports = model('Transaction', transactionSchema);


// models/MedicalRecord.js
const recordSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  fileUrl: { type: String, required: true },
  description: String
}, { timestamps: true });

module.exports = model('MedicalRecord', recordSchema);


// models/Notification.js
const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = model('Notification', notificationSchema);


// models/Prescription.js
const prescriptionSchema = new Schema({
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  medications: [{ type: String, required: true }],
  notes: String
}, { timestamps: true });

module.exports = model('Prescription', prescriptionSchema);
