const { body } = require("express-validator");

export const doctorEditProfileValidation = [
  body("fullName")
    .optional()
    .isString()
    .withMessage("Full name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("profilePicture")
    .optional()
    .isURL()
    .withMessage("Profile picture must be a valid URL"),

  body("bio")
    .optional()
    .isString()
    .withMessage("Bio must be a string")
    .isLength({ max: 1000 })
    .withMessage("Bio must be at most 1000 characters"),

  body("hospitalName")
    .optional()
    .isString()
    .withMessage("Hospital name must be a string"),

  body("consultationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Consultation fee must be a non-negative number"),

  body("weeklyAvailability")
    .optional()
    .isObject()
    .withMessage(
      "Weekly availability must be an object (e.g., { Monday: [{start, end}] })"
    ),

  body("applicationNotes")
    .optional()
    .isString()
    .withMessage("Application notes must be a string")
    .isLength({ max: 1000 })
    .withMessage("Application notes must be at most 1000 characters"),

  body("location.city").optional().isLength({ max: 50 }),
  body("location.state").optional().isLength({ max: 50 }),
  body("location.country").optional().isLength({ max: 50 }),
];

