import {
  body,
  validationResult,
  oneOf,
  optional,
  check,
  query
} from "express-validator";

// Patient Validation Middleware
export const validatePatientCreation = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),

  body("middleName").trim().notEmpty().withMessage("Middle name is required"),

  body("lastName").trim().notEmpty().withMessage("Last name is required"),

  // 3. Profile Image
  body("profileImage")
    .optional()
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  // 4. Gender
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be either 'male', 'female', or 'other'"),

  // 5. Phone
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),

  // 6. Notification Preferences
  body("notificationPreferences")
    .optional()
    .isObject()
    .withMessage("Notification preferences must be an object"),
  body("notificationPreferences.systemNotification")
    .optional()
    .isBoolean()
    .withMessage("Must be a boolean"),
  body("notificationPreferences.emailNotification")
    .optional()
    .isBoolean()
    .withMessage("Must be a boolean"),
  body("notificationPreferences.smsNotification")
    .optional()
    .isBoolean()
    .withMessage("Must be a boolean"),

  // 7. Blood Type
  body("bloodType")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood type"),

  // 8. Date of Birth
  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      if (new Date(value) >= new Date()) {
        throw new Error("Date of birth must be in the past");
      }
      return true;
    }),

  // 9. Emergency Contact Array Validation
  body("emergencyContact")
    .optional()
    .isArray()
    .withMessage("Emergency contact must be an array"),

  body("emergencyContact.*").custom((contact) => {
    if (typeof contact !== "object") {
      throw new Error("Each emergency contact entry must be an object");
    }

    const { name, relation, phone } = contact;

    if (!name) {
      throw new Error("Emergency contact name is required");
    }
    if (!relation) {
      throw new Error("Emergency contact relation is required");
    }
    if (!phone) {
      throw new Error("Emergency contact phone is required");
    }

    return true;
  }),

  body("emergencyContact.*.name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .notEmpty()
    .withMessage("Name is required"),

  body("emergencyContact.*.relation")
    .optional()
    .isString()
    .withMessage("Relation must be a string")
    .notEmpty()
    .withMessage("Relation is required"),

  body("emergencyContact.*.phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),

  // 10. Insurance Array Validation
  body("insurance")
    .optional()
    .isArray()
    .withMessage("Insurance must be an array"),

  body("insurance.*").custom((insurance) => {
    if (typeof insurance !== "object") {
      throw new Error("Each insurance entry must be an object");
    }

    const { provider, policyNumber } = insurance;

    if (!provider) {
      throw new Error("Insurance provider is required");
    }
    if (!policyNumber) {
      throw new Error("Insurance policy number is required");
    }

    return true;
  }),

  body("insurance.*.provider")
    .optional()
    .isString()
    .withMessage("Provider must be a string")
    .notEmpty()
    .withMessage("Provider is required"),

  body("insurance.*.policyNumber")
    .optional()
    .isString()
    .withMessage("Policy number must be a string")
    .notEmpty()
    .withMessage("Policy number is required"),

  body("insurance.*.status")
    .optional()
    .isIn(["active", "expired", "pending"])
    .withMessage("Status must be 'active', 'expired', or 'pending'"),
  body("location.locationType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("Location type must be 'home', 'work', or 'other'"),
  body("location.country").notEmpty().withMessage("Country is required"),
  body("location.city").notEmpty().withMessage("City is required"),
  body("location.coordinates.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of [longitude, latitude]"),

  body("location.coordinates.coordinates.*")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Coordinates must be valid longitude/latitude"),

  // 12. Medical History
  body("medicalHistory")
    .optional()
    .isArray()
    .withMessage("Medical history must be an array"),

  body("medicalHistory.*")
    .optional()
    .isMongoId()
    .withMessage("Each medical history entry must be a valid MongoDB ObjectId"),
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
