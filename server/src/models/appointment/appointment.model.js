import { Schema, model } from "mongoose";

// Enums

// const APPOINTMENT_STATUS = [
//   "pending", // if doctor requests for appointment
//   "accepted", // if doctor accepted the appointment
//   "payment_pending", // if the patient tries to pay
//   "confirmed", // if payment is done
//   "completed", // if the appointment is done
//   "cancelled", // if the appointment is cancelled by the doctor or patient
//   "no-show", // if the patient does not show-up on appointment day
//   "expired", //  if payment timeout
//   "rescheduled", // if the patient or doctor reschedules the appointment
// ];

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  PAYMENT_PENDING: "payment_pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
  EXPIRED: "expired",
  RESCHEDULED: "rescheduled",
};
// const APPOINTMENT_TYPES = ["consultation", "follow-up", "emergency", "therapy", "check-up"];
export const APPOINTMENT_TYPES = {
  IN_PERSON: "in-person",
  VIRTUAL: "virtual",
};

export const CANCELLATION_REASONS = {
  PATIENT_REQUEST: "patient_request",
  DOCTOR_REQUEST: "doctor_request",
  PAYMENT_DELAYED: "payment_delayed",
  NO_SHOW: "no_show",
  SYSTEM_ISSUE: "system_issue",
  EMERGENCY: "emergency",
};

// Time Slot Schema
const timeSlotSchema = new Schema(
  {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
      validate: {
        validator: function () {
          return this.end > this.start;
        },
        message: "End time must be after start time.",
      },
    },
  },
  { _id: false }
);

// Reschedule Schema
const rescheduleSchema = new Schema(
  {
    previousTimeSlot: timeSlotSchema,
    newTimeSlot: timeSlotSchema,
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    rescheduledBy: {
      type: Schema.Types.ObjectId,
      refPath: "rescheduledByRole",
      required: true,
    },
    rescheduledByModel: {
      type: String,
      enum: ["Patient", "Doctor", "Admin"],
      required: true,
    },
    rescheduledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Appointment Schema
const appointmentSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    appointmentType: {
      type: String,
      enum: Object.values(APPOINTMENT_TYPES),
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    slot: {
      type: timeSlotSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: "pending",
      index: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    fee: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    cancellation: {
      reason: {
        type: String,
        default: "",
      },
      cancelledBy: {
        type: Schema.Types.ObjectId,
        refPath: "cancelledByRole",
        default: null,
      },
      cancelledByRole: {
        type: String,
        enum: ["Patient", "Doctor", "Admin"],
        default: null,
      },
      cancelledAt: {
        type: Date,
        default: null,
      },
    },
    rescheduleHistory: {
      type: [rescheduleSchema],
      default: [],
      max: 5,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    virtualDetails: {
      type: {
        videoCallToken: {
          type: String,
          default: "",
        },
        chatToken: {
          type: String,
          default: "",
        },
      },
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
appointmentSchema.index({ "slot.startTime": 1, "slot.endTime": 1 });
appointmentSchema.index({ status: 1, "slot.start": 1 });

export default model("Appointment", appointmentSchema);
