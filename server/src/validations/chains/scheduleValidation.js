// import { body, param } from "express-validator";

// // Validate doctorId and slot generation params
// export const generateSlotsValidation = [
//   param("doctorId").isMongoId().withMessage("Invalid doctor ID"),
//   body("startDate").isISO8601().toDate(),
//   body("endDate").isISO8601().toDate(),
// ];

// // Validate slot ID and doctorId in params
// export const slotIdValidation = [
//   param("doctorId").isMongoId().withMessage("Invalid doctor ID"),
//   param("slotId").isMongoId().withMessage("Invalid slot ID"),
// ];

// // Validate slot updates (e.g., isBooked)
// export const updateSlotValidation = [
//   param("doctorId").isMongoId().withMessage("Invalid doctor ID"),
//   param("slotId").isMongoId().withMessage("Invalid slot ID"),
//   body("isBooked").optional().isBoolean(),
//   body("startTime").optional().isString(),
//   body("endTime").optional().isString(),
// ];

// // Add to existing validations
// export const blockedSlotValidation = [
//   param("doctorId").isMongoId().withMessage("Invalid doctor ID"),
//   body("date").isISO8601().toDate().withMessage("Invalid date"),
//   body("startTime").isString().notEmpty(),
//   body("endTime").isString().notEmpty(),
//   body("reason").optional().isString(),
// ];

// export const blockIdValidation = [
//   param("doctorId").isMongoId().withMessage("Invalid doctor ID"),
//   param("blockId").isMongoId().withMessage("Invalid blocked slot ID"),
// ];

// export const doctorIdValidation = [
//   param("doctorId").isMongoId().withMessage("Invalid doctor ID"),
// ];

// export const createScheduleValidation = [
//   param("doctorId").isMongoId(),
//   body("workingHours").isArray().notEmpty(),
//   body("workingHours.*.day").isIn([
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//     "Sunday",
//   ]),
//   body("workingHours.*.startTime").isString().notEmpty(),
//   body("workingHours.*.endTime").isString().notEmpty(),
//   body("appointmentDuration").optional().isIn([15, 30, 45, 60]),
// ];

// export const updateScheduleValidation = [
//   param("doctorId").isMongoId(),
//   body("workingHours").optional().isArray(),
//   body("workingHours.*.day")
//     .optional()
//     .isIn([
//       "Monday",
//       "Tuesday",
//       "Wednesday",
//       "Thursday",
//       "Friday",
//       "Saturday",
//       "Sunday",
//     ]),
//   body("workingHours.*.startTime").optional().isString(),
//   body("workingHours.*.endTime").optional().isString(),
//   body("workingHours.*.breaks").optional().isArray(),
//   body("workingHours.*.breaks.*.startTime").optional().isString(),
//   body("workingHours.*.breaks.*.endTime").optional().isString(),
//   body("appointmentDuration").optional().isIn([15, 30, 45, 60]),
//   body("timeSlotSettings.interval").optional().isNumeric(),
//   body("timeSlotSettings.bufferTime").optional().isNumeric(),
//   body("timeSlotSettings.maxDailyAppointments").optional().isNumeric(),
// ];
