import { body, param, check, query } from "express-validator";
import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../../models/appointment/payment.model";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  CANCELLATION_REASONS,
} from "../../models/appointment/appointment.model";

const APPOINTMENT_TYPES_VALUES = Object.values(APPOINTMENT_TYPES);
const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);
const APPOINTMENT_STATUS_VALUES = Object.values(APPOINTMENT_STATUS);
const CANCELLATION_REASONS_VALUES = Object.values(CANCELLATION_REASONS);

export const validateGetAppointments = [
  check("status")
    .optional()
    .isIn(APPOINTMENT_STATUS_VALUES)
    .withMessage(
      `Appointment status must be one of the following ${APPOINTMENT_STATUS_VALUES.join(
        ", "
      )}`
    ),
  query("page").optional().isInt({min: 1}).withMessage("page should be an integer and minimum of 1"),
  query("limit").optional().isInt({min: 1}).withMessage("limit should be an integer and minimum of 1"),
];

export const validateAcceptAppointment = [
  param("doctorId")
    .notEmpty()
    .withMessage("Appointment id is required")
    .isMongoId()
    .withMessage("Invalid appointment id"),
];

export const validateCancelAppointment = [
  param("appointmentId").notEmpty().withMessage("Appointment id is required").isMongoId().withMessage("Invalid appointment id"),
  body("cancellationReason").optional().isString().isLength({ max: 500 }),
];

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
    .isIn(APPOINTMENT_TYPES_VALUES)
    .withMessage(
      `Appointment type must be one of ${APPOINTMENT_TYPES_VALUES.join(", ")}`
    ),
  body("reason")
    .notEmpty()
    .withMessage("Reason for appointment is required")
    .isString()
    .withMessage("Reason must be a string")
    .isLength({ max: 500 })
    .withMessage("Reason can be a maximum of 500 characters"),
  // Slot Validation
  body("slotId")
    .notEmpty()
    .withMessage("slot id is required")
    .isMongoId()
    .withMessage("invalid slot id format"),
];

export const validateRequestSchedule = [
  param("appointmentId")
    .notEmpty()
    .withMessage("appointment id is required")
    .isMongoId()
    .withMessage("invalid appointment id format"),
  body("slotId")
    .notEmpty()
    .withMessage("slot id is required")
    .isMongoId()
    .withMessage("invalid slot id format"),
  body("reason")
  .optional()
  .isLength({min: 2, max: 500})
  .withMessage("reason should be between 2 and 500 character length")
];

export const validateRespondToReschedule = [
  param("appointmentId")
  .notEmpty()
  .withMessage("appointment id is required")
  .isMongoId()
  .withMessage("invalid appointment id format"),
  param("action")
  .notEmpty()
  .withMessage("reschedule action [accept, reject] is required")
  .isIn(['accept', 'reject'])
  .withMessage("reschedule actions are only accept or reject")
]

export const validateOther = [
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
];
