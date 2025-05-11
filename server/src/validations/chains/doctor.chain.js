import { body, param } from 'express-validator';

export const completeProfileValidation = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("middleName").trim().notEmpty().withMessage("Middle name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be 'male', 'female', or 'other'"),
  body("dateOfBirth").isISO8601().toDate().withMessage("Valid date of birth is required"),
  body("profilePhoto").isURL().withMessage("Valid profile photo URL is required"),

  body("nationalId.frontImage").isURL().withMessage("National ID front image URL is required"),
  body("nationalId.backImage").isURL().withMessage("National ID back image URL is required"),

  body("licenseInfo.frontImage").isURL().withMessage("License front image URL is required"),
  body("licenseInfo.backImage").isURL().withMessage("License back image URL is required"),

  body("specialization").notEmpty().withMessage("Specialization is required"),

  body("specialties").isArray({ min: 1 }).withMessage("At least one specialty is required"),
  body("specialties.*.name").notEmpty().withMessage("Specialty name is required"),

  body("qualifications").isArray({ min: 1 }).withMessage("At least one qualification is required"),
  body("qualifications.*.degree").notEmpty().withMessage("Degree is required"),
  body("qualifications.*.institution").notEmpty().withMessage("Institution is required"),
  body("qualifications.*.year")
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("Enter a valid year"),

  body("yearsOfExperience")
    .isInt({ min: 0 })
    .withMessage("Years of experience must be a positive number"),

  body("boardCertificationsDocument")
    .isURL()
    .withMessage("Valid board certification document URL is required"),
  body("educationDocument").isURL().withMessage("Valid education document URL is required"),

  body("languages").isArray().withMessage("Languages must be an array of strings"),

  body("hospitalName").optional().isString(),
  body("hospitalAddress.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of [longitude, latitude]"),
  body("hospitalAddress.city").optional().isString(),
  body("hospitalAddress.state").optional().isString(),
  body("hospitalAddress.postalCode").optional().isString(),
  body("hospitalAddress.country").optional().isString(),

  body("phoneNumber")
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage("Invalid phone number format"),

  body("consultationFee").isNumeric().withMessage("Consultation fee must be a number"),
  body("serviceAreas").isArray().withMessage("Service areas must be an array"),

  body("workingHours").isArray().withMessage("Working hours must be an array"),
  body("workingHours.*.day")
    .isIn([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ])
    .withMessage("Invalid day of the week"),
  body("workingHours.*.startTime").notEmpty().withMessage("Start time is required"),
  body("workingHours.*.endTime").notEmpty().withMessage("End time is required"),

  body("appointmentDuration")
    .isInt({ min: 10 })
    .withMessage("Appointment duration must be at least 10 minutes"),

  body("location.city").optional().isString(),
  body("location.state").optional().isString(),
  body("location.country").optional().isString(),

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
  param("page")
  .optional()
  .isNumeric()
  .withMessage("page should be a number"),
  param("limit")
  .optional()
  .isNumeric()
  .withMessage("limit should be a number"),
  param("skip")
  .optional()
  .isNumeric()
  .withMessage("skip should be a number"),
  param("minRating")
  .optional()
  .isNumeric()
  .withMessage("minRating should be a number"),
  param("location")
  .optional()
  .isString()
  .withMessage("location can be only string")
]