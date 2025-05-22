import { body, query, param } from "express-validator";
import { REVIEW_TAGS } from "../../models/review.model";

// doctorId, rating, reviewText, tags, appointmentId, anonymous
export const validateCreateReview = [
  param("doctorId").notEmpty().withMessage("Doctor id is required"),
  body("appointmentId").notEmpty().withMessage("Appointment id is required"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating should be between 1 and 5"),
  body("reviewText")
    .optional()
    .isString()
    .withMessage("review must be string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("review text should not exceed 1000 characters"),
  body("anonymous")
    .optional()
    .isBoolean()
    .withMessage("Anonymous must be a boolean value"),
  body("tags")
    .optional()
    .isIn(REVIEW_TAGS)
    .withMessage(`tags must be one of the following: ${REVIEW_TAGS.join(", ")}`)
    .trim(),
];

export const validateUpdateReview = [
  param("reviewId")
    .notEmpty()
    .withMessage("Review ID is required")
    .isMongoId()
    .withMessage("Invalid Review ID format"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("reviewText")
    .optional()
    .isString()
    .withMessage("Comment must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),
  body("anonymous")
    .optional()
    .isBoolean()
    .withMessage("Anonymous must be a boolean value"),
  body("tags")
    .optional()
    .isArray()
    .isIn(REVIEW_TAGS)
    .withMessage(`tags must be one of the following: ${REVIEW_TAGS.join(", ")}`)
    .trim(),
];

export const validateGetDoctorReviews = [
  param("doctorId")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .isMongoId()
    .withMessage("Invalid Doctor ID format"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
  query("minRating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("min rating must be between 1 and 5"),
];
