import { Schema, model } from "mongoose";

const NOTIFICATION_TYPES = {
  PROFILE_APPROVAL: "profile_approval",
  PROFILE_REJECTED: "profile_rejected",
  APPOINTMENT_BOOKED: "appointment_booked",
  APPOINTMENT_CONFIRMED: "appointment_confirmed",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  APPOINTMENT_RESCHEDULED: "appointment_rescheduled",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  SUPPORT_MESSAGE: "support_message",
  SYSTEM_ALERT: "system_alert",
  REMINDER: "reminder",
  MESSAGE: "message",
};

const NOTIFICATION_TARGETS = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
};

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
    },
    targetRole: {
      type: String,
      enum: Object.values(NOTIFICATION_TARGETS),
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      refPath: "targetRole", // Dynamic ref based on role
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      refPath: "senderRole",
    },
    senderRole: {
      type: String,
      enum: Object.values(NOTIFICATION_TARGETS),
    },
    data: {
      type: Schema.Types.Mixed, // Can store appointment ID, profile ID, etc.
    },
    read: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Notification", notificationSchema);

await Notification.create({
  type: "profile_approval",
  recipient: adminId,
  recipientModel: "Admin",
  sender: doctorId,
  senderModel: "Doctor",
  title: "New Doctor Awaiting Approval",
  message: `${doctorFullName} has submitted their profile for approval.`,
  linkTo: `/admin/doctors/${doctorId}`,
});

await Notification.create({
  type: "appointment_booked",
  recipient: doctorId,
  recipientModel: "Doctor",
  sender: patientId,
  senderModel: "Patient",
  title: "New Appointment Booked",
  message: `${patientName} booked an appointment on ${date}`,
  linkTo: `/doctor/appointments/${appointmentId}`,
});

await Notification.create({
  title: "Appointment Confirmed",
  body: `Your appointment with Dr. ${doctor.fullName} is confirmed.`,
  type: "appointment",
  targetRole: "Patient",
  recipient: patient._id,
  sender: doctor._id,
  senderRole: "Doctor",
  data: { appointmentId: appointment._id }
});