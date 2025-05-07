import { body, validationResult, oneOf } from "express-validator";

// Patient Validation Middleware
export const validatePatientCreation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

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
  body("notificationPreferences").optional().isObject().withMessage("Notification preferences must be an object"),
  body("notificationPreferences.systemNotification").optional().isBoolean().withMessage("Must be a boolean"),
  body("notificationPreferences.emailNotification").optional().isBoolean().withMessage("Must be a boolean"),
  body("notificationPreferences.smsNotification").optional().isBoolean().withMessage("Must be a boolean"),

  // 7. Blood Type
  body("bloodType")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood type"),

  // 8. Date of Birth
  body("dob")
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
  body("location.country")
    .notEmpty()
    .withMessage("Country is required"),
  body("location.city")
    .notEmpty()
    .withMessage("City is required"),
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

// export const validatePatientUpdate = [
//   // Only these fields are allowed to be updated
//   oneOf(
//     [
//       body().custom(body => {
//         const allowedFields = [
//           'name',
//           'profileImage',
//           'phone',
//           'notificationPreferences',
//           'bloodType',
//           'emergencyContact',
//           'insurance',
//           'preferredLanguage',
//           'maritalStatus',
//           'location'
//         ];
//         const invalidFields = Object.keys(body).filter(
//           field => !allowedFields.includes(field)
//         );
        
//         if (invalidFields.length > 0) {
//           throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
//         }
//         return true;
//       })
//     ],
//     {
//       message: 'Only specific fields can be updated'
//     }
//   ),

//   // Individual field validations (only validate if field exists in request)
//   optional('name')
//     .trim()
//     .isLength({ min: 2, max: 100 })
//     .withMessage('Name must be between 2-100 characters'),

//   optional('profileImage')
//     .isString()
//     .withMessage('Profile image must be a string URL'),

//   optional('phone')
//     .matches(/^\+?[1-9]\d{1,14}$/)
//     .withMessage('Invalid phone number format (E.164 recommended)'),

//   optional('notificationPreferences.systemNotification')
//     .isBoolean()
//     .withMessage('System notification preference must be true/false'),

//   optional('notificationPreferences.emailNotification')
//     .isBoolean()
//     .withMessage('Email notification preference must be true/false'),

//   optional('notificationPreferences.smsNotification')
//     .isBoolean()
//     .withMessage('SMS notification preference must be true/false'),

//   optional('bloodType')
//     .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''])
//     .withMessage('Invalid blood type'),

//   optional('emergencyContact').isArray().withMessage('Emergency contacts must be an array'),
//   optional('emergencyContact.*.name')
//     .trim()
//     .notEmpty()
//     .withMessage('Emergency contact name is required'),
//   optional('emergencyContact.*.phone')
//     .matches(/^\+?[1-9]\d{1,14}$/)
//     .withMessage('Invalid emergency contact phone format'),
//   optional('emergencyContact.*.email')
//     .isEmail()
//     .withMessage('Invalid emergency contact email'),

//   optional('insurance').isArray().withMessage('Insurance must be an array'),
//   optional('insurance.*.provider')
//     .trim()
//     .notEmpty()
//     .withMessage('Insurance provider is required'),
//   optional('insurance.*.policyNumber')
//     .trim()
//     .notEmpty()
//     .withMessage('Policy number is required'),

//   optional('preferredLanguage')
//     .trim()
//     .isLength({ min: 2 })
//     .withMessage('Preferred language must be at least 2 characters'),

//   optional('maritalStatus')
//     .isIn(['single', 'married', 'divorced', 'widowed', 'separated', 'other', ''])
//     .withMessage('Invalid marital status'),

//   // Location validation
//   optional('location.country')
//     .trim()
//     .notEmpty()
//     .withMessage('Country is required'),
//   optional('location.city')
//     .trim()
//     .notEmpty()
//     .withMessage('City is required'),
//   optional('location.coordinates.coordinates')
//     .isArray({ min: 2, max: 2 })
//     .withMessage('Coordinates must be [longitude, latitude]')
//     .custom((coords) => {
//       const [lng, lat] = coords;
//       return (
//         lng >= -180 && lng <= 180 &&
//         lat >= -90 && lat <= 90
//       );
//     })
//     .withMessage('Invalid coordinates: longitude [-180,180], latitude [-90,90]')
// ];