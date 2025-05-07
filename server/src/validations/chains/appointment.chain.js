import { body, param, check } from "express-validator";
import mongoose from "mongoose";

// Enums
const APPOINTMENT_STATUS = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no-show",
  "rescheduled",
];
const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"];
const APPOINTMENT_TYPE = [
  "consultation",
  "follow-up",
  "emergency",
  "therapy",
  "check-up",
];
const CANCELLATION_REASONS = [
  "patient request",
  "doctor request",
  "no-show",
  "system issue",
  "emergency",
];
const PAYMENT_METHODS = ["cash", "card", "insurance", "online"];

export const validateGetAppointmentByStatus = [
  check('status')
  .optional()
  .isIn(APPOINTMENT_STATUS)
  .withMessage(`Appointment status must be one of the following ${APPOINTMENT_STATUS.join(", ")}`)
]

export const validateCancelAppointment = [
  param("appointmentId")
  .notEmpty()
  .withMessage("Appointment id is required"),
  body("cancellationReason")
  .optional()
  .isIn(CANCELLATION_REASONS)
  .withMessage(`Appointment cancellation reason must be one of the following ${CANCELLATION_REASONS.join(", ")}`)
]

// Utility: Validate ObjectId
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Appointment Creation Validation
export const validateAppointmentCreation = [
  param("doctorId")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .custom(isValidObjectId)
    .withMessage("Invalid Doctor ID format"),

  body("appointmentType")
    .notEmpty()
    .withMessage("Appointment type is required")
    .isIn(APPOINTMENT_TYPE)
    .withMessage(
      `Appointment type must be one of ${APPOINTMENT_TYPE.join(", ")}`
    ),

  body("reason")
    .notEmpty()
    .withMessage("Reason for appointment is required")
    .isString()
    .withMessage("Reason must be a string")
    .isLength({ max: 500 })
    .withMessage("Reason can be a maximum of 500 characters"),

  // Slot Validation
  body("slot.start")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Start time must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      const start = new Date(value);
      const now = new Date();
      if (start < now) {
        throw new Error("Start time must be in the future");
      }
      return true;
    }),

  body("slot.end")
    .notEmpty()
    .withMessage("End time is required")
    .isISO8601()
    .withMessage("End time must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      const start = new Date(req.body.slot.start);
      const end = new Date(value);
      if (end <= start) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),

  // Payment Validation
  body("payment")
    .optional()
    .isObject()
    .withMessage("Payment must be an object"),

  body("payment.method")
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of ${PAYMENT_METHODS.join(", ")}`),

  body("payment.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount must be a non-negative number"),

  body("payment.currency")
    .optional()
    .isString()
    .withMessage("Currency must be a string"),

  body("payment.status")
    .optional()
    .isIn(PAYMENT_STATUS)
    .withMessage(`Payment status must be one of ${PAYMENT_STATUS.join(", ")}`),

  body("payment.transactionId")
    .optional()
    .isString()
    .withMessage("Transaction ID must be a string"),

  body("payment.refundStats")
    .optional()
    .isIn(["none", "requested", "processed"])
    .withMessage("Refund status must be 'none', 'requested', or 'processed'"),

  // Reschedule History Validation
  body("rescheduleHistory")
    .optional()
    .isArray()
    .withMessage("Reschedule history must be an array"),

  body("rescheduleHistory.*.previousTimeSlot.start")
    .optional()
    .isISO8601()
    .withMessage("Previous start time must be a valid ISO 8601 date"),

  body("rescheduleHistory.*.previousTimeSlot.end")
    .optional()
    .isISO8601()
    .withMessage("Previous end time must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      const previousStart = new Date(
        req.body.rescheduleHistory[0].previousTimeSlot.start
      );
      const previousEnd = new Date(value);
      if (previousEnd <= previousStart) {
        throw new Error("Previous end time must be after previous start time");
      }
      return true;
    }),

  body("rescheduleHistory.*.newTimeSlot.start")
    .optional()
    .isISO8601()
    .withMessage("New start time must be a valid ISO 8601 date"),

  body("rescheduleHistory.*.newTimeSlot.end")
    .optional()
    .isISO8601()
    .withMessage("New end time must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      const newStart = new Date(
        req.body.rescheduleHistory[0].newTimeSlot.start
      );
      const newEnd = new Date(value);
      if (newEnd <= newStart) {
        throw new Error("New end time must be after new start time");
      }
      return true;
    }),

  // Notes
  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 1000 })
    .withMessage("Notes can be a maximum of 1000 characters"),

  // Video Call and Chat Tokens
  body("videoCallToken")
    .optional()
    .isString()
    .withMessage("Video call token must be a string"),

  body("chatToken")
    .optional()
    .isString()
    .withMessage("Chat token must be a string"),
];
