import { Schema, model } from "mongoose";

// Enums
const APPOINTMENT_STATUS = ["pending", "confirmed", "completed", "cancelled", "no-show", "rescheduled"];
const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"];
const APPOINTMENT_TYPE = ["consultation", "follow-up", "emergency", "therapy", "check-up"];
const CANCELLATION_REASONS = [
  "patient request",
  "doctor request",
  "no-show",
  "system issue",
  "emergency",
];

// Payment Schema
const paymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["cash", "card", "insurance", "online"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending",
    },
    transactionId: {
      type: String,
      default: null,
    },
    refundStats: {
      type: String, 
      enum: ["none", "requested", "processed"],
      default: "none"
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

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
      enum: APPOINTMENT_TYPE,
      required: true,
      default: "consultation",
    },
    reason: {
      type: String,
      trim: true,
      required: true,
    },
    slot: {
      type: timeSlotSchema,
      required: true,
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUS,
      default: "pending",
      index: true,
    },
    payment: {
      type: paymentSchema,
      default: null,
    },
    cancellation: {
      reason: {
        type: String,
        enum: CANCELLATION_REASONS,
        default: null,
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
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    videoCallToken: {
      type: String, 
      default: "",
    },
    chatToken: {
      type: String, 
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
appointmentSchema.index({ "slot.startTime": 1, "slot.endTime": 1 });
appointmentSchema.index({ "payment.status": 1 });
appointmentSchema.index({ status: 1, "slot.start": 1 });

export default model("Appointment", appointmentSchema);
