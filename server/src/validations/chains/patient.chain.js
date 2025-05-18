import {
  body,
  validationResult,
  oneOf,
  optional,
  check,
  query
} from "express-validator";
import { phoneRegex } from "../../models/patient/patient.model";

// Patient Validation Middleware
export const validateProfileCreation = [
  // Basic Information
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
  body('middleName')
    .trim()
    .notEmpty().withMessage('Middle name is required')
    .isLength({ max: 50 }).withMessage('Middle name cannot exceed 50 characters'),
    
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
  body('gender')
    .isIn(['male', 'female', 'other']).withMessage('Invalid gender value'),
    
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(phoneRegex).withMessage('Invalid phone number format'),
    
  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      return dob < today;
    }).withMessage('Date of birth must be in the past'),
    
  body('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).withMessage('Invalid blood type'),
    
  // Location Validation
  body('location')
    .exists().withMessage('Location is required')
    .isObject().withMessage('Location must be an object'),
    
  body('location.locationType')
    .optional()
    .isIn(['home', 'work', 'other']).withMessage('Invalid location type'),
    
  body('location.country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .isLength({ max: 100 }).withMessage('Country cannot exceed 100 characters'),
    
  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
    
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Address cannot exceed 255 characters'),
    
  body('location.postalCode')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Postal code cannot exceed 20 characters'),
    
  body('location.state')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('State cannot exceed 100 characters'),
    
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array of [longitude, latitude]')
    .custom((value) => {
      return value.every(coord => typeof coord === 'number');
    }).withMessage('Coordinates must be numbers'),
    
  // Emergency Contact Validation
  body('emergencyContact')
    .isArray({ min: 1 }).withMessage('At least one emergency contact is required'),
    
  body('emergencyContact.*.name')
    .trim()
    .notEmpty().withMessage('Emergency contact name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    
  body('emergencyContact.*.relation')
    .trim()
    .notEmpty().withMessage('Emergency contact relation is required')
    .isLength({ max: 50 }).withMessage('Relation cannot exceed 50 characters'),
    
  body('emergencyContact.*.phone')
    .trim()
    .notEmpty().withMessage('Emergency contact phone is required')
    .matches(phoneRegex).withMessage('Invalid phone number format'),
    
  body('emergencyContact.*.email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
    
  // Insurance Validation
  body('insurance')
    .optional()
    .isArray(),
    
  body('insurance.*.provider')
    .if(body('insurance').exists())
    .trim()
    .notEmpty().withMessage('Insurance provider is required')
    .isLength({ max: 100 }).withMessage('Provider name cannot exceed 100 characters'),
    
  body('insurance.*.policyNumber')
    .if(body('insurance').exists())
    .trim()
    .notEmpty().withMessage('Policy number is required')
    .isLength({ max: 50 }).withMessage('Policy number cannot exceed 50 characters'),
    
  body('insurance.*.coverageDetails')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Coverage details cannot exceed 500 characters'),
    
  body('insurance.*.validTill')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
    
  body('insurance.*.status')
    .optional()
    .isIn(['active', 'expired', 'pending']).withMessage('Invalid insurance status'),
    
  // Preferences
  body('preferredLanguage')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Preferred language cannot exceed 50 characters'),
    
  body('martialStatus')
    .optional()
    .isIn(['single', 'married', 'divorced', 'widowed', 'separated', 'other', '']).withMessage('Invalid marital status'),
    
  body('notificationPreference')
    .optional()
    .isObject(),
    
  body('notificationPreference.systemNotification')
    .optional()
    .isBoolean().withMessage('System notification preference must be boolean'),
    
  body('notificationPreference.emailNotification')
    .optional()
    .isBoolean().withMessage('Email notification preference must be boolean'),
    
  body('notificationPreference.smsNotification')
    .optional()
    .isBoolean().withMessage('SMS notification preference must be boolean'),
    
  // File Validation (if using multer)
  check('file')
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new Error('Only JPEG, PNG, and GIF images are allowed');
        }
        if (req.file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('Image size cannot exceed 5MB');
        }
      }
      return true;
    })
];

export const validateGetDoctorStatistics = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be an integer between 1 and 50"),
  query("location")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Location must be a string between 2 and 50 characters"),
  query("specialization")
    .optional()
    .isString()
    .trim()
    .withMessage("Specialization must be a string between 2 and 50 characters"),
  query("minExperience")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Minimum experience must be an integer between 0 and 50"),
  query("maxExperience")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Maximum experience must be an integer between 0 and 50"),
  query("minFee")
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage("Minimum fee must be an integer between 0 and 500"),
  query("maxFee")
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage("Maximum fee must be an integer between 0 and 500"),
  query("minRating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Minimum rating must be a float between 0 and 5"),
  query("maxRating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Maximum rating must be a float between 0 and 5"),
];


export const validatePatientUpdate = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("First Name must be between 2-100 characters"),
  body("middleName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Middle Name must be between 2-100 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Last Name must be between 2-100 characters"),

  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format (E.164 recommended)"),

  body("notificationPreferences.systemNotification")
    .optional()
    .isBoolean()
    .withMessage("System notification preference must be true/false"),
  body("notificationPreferences.emailNotification")
    .optional()
    .isBoolean()
    .withMessage("Email notification preference must be true/false"),
  body("notificationPreferences.smsNotification")
    .optional()
    .isBoolean()
    .withMessage("SMS notification preference must be true/false"),

  body("bloodType")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""])
    .withMessage("Invalid blood type"),

  body("emergencyContact")
    .optional()
    .isArray()
    .withMessage("Emergency contacts must be an array"),
  body("emergencyContact.*.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Emergency contact name is required"),
  body("emergencyContact.*.phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid emergency contact phone format"),
  body("emergencyContact.*.email")
    .optional()
    .isEmail()
    .withMessage("Invalid emergency contact email"),

  body("insurance")
    .optional()
    .isArray()
    .withMessage("Insurance must be an array"),
  body("insurance.*.provider")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Insurance provider is required"),
  body("insurance.*.policyNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Policy number is required"),

  body("preferredLanguage")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Preferred language must be at least 2 characters"),

  body("maritalStatus")
    .optional()
    .isIn([
      "single",
      "married",
      "divorced",
      "widowed",
      "separated",
      "other",
      "",
    ])
    .withMessage("Invalid marital status"),

  // Location validation
  body("location.country")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Country is required"),
  body("location.city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("location.coordinates.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be [longitude, latitude]")
    .custom((coords) => {
      const [lng, lat] = coords;
      return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    })
    .withMessage(
      "Invalid coordinates: longitude [-180,180], latitude [-90,90]"
    ),
];
