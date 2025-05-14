import { body, param } from "express-validator";

export const completeProfileValidation = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("middleName").trim().notEmpty().withMessage("Middle name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be 'male', 'female', or 'other'"),
  body("dateOfBirth")
    .isISO8601()
    .toDate()
    .withMessage("Valid date of birth is required"),
  body("specialization").notEmpty().withMessage("Specialization is required"),
  body("yearsOfExperience")
    .isInt({ min: 0 })
    .withMessage("Years of experience must be a positive number"),
  body("phoneNumber")
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage("Invalid phone number format"),
  body("hospitalName").optional().isString(),
  body("hospitalAddress.street1").optional().isString(),
  body("hospitalAddress.street2").optional().isString(),
  body("hospitalAddress.city").optional().isString(),
  body("hospitalAddress.state").optional().isString(),
  body("hospitalAddress.postalCode").optional().isString(),
  body("hospitalAddress.country").optional().isString(),
  body("consultationFee")
    .isFloat({ min: 0 })
    .withMessage("Consultation fee must be a positive number"),
  body("applicationNotes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Application notes must be under 1000 characters"),
  body("bio")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Bio must be under 1000 characters"),
];

export const validateGetDoctor = [
  param("page").optional().isNumeric().withMessage("page should be a number"),
  param("limit").optional().isNumeric().withMessage("limit should be a number"),
  param("skip").optional().isNumeric().withMessage("skip should be a number"),
  param("minRating")
    .optional()
    .isNumeric()
    .withMessage("minRating should be a number"),
  param("location")
    .optional()
    .isString()
    .withMessage("location can be only string"),
];
