import { body, param, query } from "express-validator";
import MedicalHistory, {
  ALLERGY_SEVERITY,
  BLOOD_TYPES,
  CONDITION_STATUS,
  RELATIONSHIPS,
} from "../../models/patient/medicalHistory.model";
import { FREQUENCY_OPTIONS } from "../../models/patient/medicalHistory.model";

// Shared validators
const validateCondition = [
  body("name").notEmpty().withMessage("Condition name is required"),
  body("status")
    .isIn(Object.values(CONDITION_STATUS))
    .withMessage("Invalid status for chronic condition"),
  body("diagnosisDate")
    .optional()
    .isDate()
    .withMessage("Invalid diagnosis date"),
  body("resolvedDate")
    .optional()
    .isDate()
    .withMessage("Invalid resolved date")
    .custom((value, { req }) => {
      if (!value) return true; // Allow empty/undefined values
      if (!req.body.diagnosisDate) return true; // Skip validation if no diagnosis date
      return new Date(value) >= new Date(req.body.diagnosisDate);
    })
    .withMessage("Resolved date must be after diagnosis date"),
];

const validateMedication = [
  body("name").notEmpty().withMessage("Medication name is required"),
  body("dosage").notEmpty().withMessage("Dosage is required"),
  body("frequency").notEmpty().withMessage("Frequency is required"),
  body("startDate").optional().isDate().withMessage("Invalid start date"),
  body("purpose").optional().isString(),
];

const validateAllergy = [
  body("substance").notEmpty().withMessage("Substance is required"),
  body("reaction").notEmpty().withMessage("Reaction description is required"),
  body("isCritical").optional().isBoolean().withMessage("isCritical must be a boolean"),
  body("severity")
    .isIn(Object.values(ALLERGY_SEVERITY))
    .withMessage("Invalid severity level"),
  body("firstObserved")
    .optional()
    .isDate()
    .custom((value, { req }) => {
      return new Date(value) < new Date();
    })
    .withMessage("first observed date must be in the past"),
];

export const validateUpdateAllergy = [
  body("substance").optional().notEmpty().withMessage("Substance should not be empty"),
  body("reaction").optional().notEmpty().withMessage("Reaction description is required"),
  body("isCritical").optional().isBoolean().withMessage("isCritical must be a boolean"),
  body("severity")
    .optional()
    .isIn(Object.values(ALLERGY_SEVERITY))
    .withMessage("Invalid severity level"),
  body("firstObserved")
    .optional()
    .isDate()
    .custom((value, { req }) => {
      return new Date(value) < new Date();
    })
    .withMessage("first observed date must be in the past"),
];

// Export validators
export const validateMedicalHistoryId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid medical history ID")
    .custom(async (value, { req }) => {
      const history = await MedicalHistory.findById(value);
      if (!history) {
        throw new Error("Medical history not found");
      }
      return true;
    }),
];

export const validateCreateHistory = [
  body("patientId").isMongoId().withMessage("Invalid patient ID"),
];

export const validateUpdateHistory = [
  body("height")
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage("Height must be between 30-300 cm"),
  body("weight")
    .optional()
    .isFloat({ min: 0.5, max: 1000 })
    .withMessage("Weight must be between 0.5-1000 kg"),
  body("bloodType")
    .optional()
    .isIn(BLOOD_TYPES)
    .withMessage("Invalid blood type"),
  body("lifestyle.smoking.status")
    .optional()
    .isBoolean()
    .withMessage("Smoking status must be a boolean"),
  body("lifestyle.smoking.frequency")
    .optional()
    .isIn(FREQUENCY_OPTIONS)
    .withMessage("Invalid smoking frequency"),
];

export const validateAddCondition = [
  ...validateCondition,
  body("isChronic").isBoolean().withMessage("isChronic must be a boolean"),
  // body("lastFlareUp")
  //   .if(body("isChronic").equals(true))
  //   .optional()
  //   .isDate()
  //   .withMessage("Invalid flare-up date"),
];

export const validateUpdateCondition = [
  ...validateCondition,
  body("status")
    .isIn(Object.values(CONDITION_STATUS))
    .withMessage("Invalid status for chronic condition"),
];

export const validateAddMedication = validateMedication;

export const validateDiscontinueMedication = [
  body("reasonStopped")
    .notEmpty()
    .withMessage("Reason for discontinuation is required"),
  body("endDate").optional().isDate().withMessage("Invalid end date"),
];

export const validateAddAllergy = validateAllergy;


// === Immunization Validations ===
export const validateAddImmunization = [
  body("vaccine")
    .notEmpty().withMessage("Vaccine name is required")
    .isString().withMessage("Vaccine must be a string"),

  body("date")
    .notEmpty().withMessage("Vaccination date is required")
    .isISO8601().withMessage("Vaccination date must be a valid ISO date")
    .custom((value) => {
      const date = new Date(value);
      if (date > new Date()) {
        throw new Error("Vaccination date cannot be in the future");
      }
      return true;
    }),

  body("boosterDue")
    .optional()
    .isISO8601().withMessage("Booster due must be a valid ISO date")
    .custom((value, { req }) => {
      if (req.body.date && new Date(value) <= new Date(req.body.date)) {
        throw new Error("Booster due date must be after vaccination date");
      }
      return true;
    }),

  body("administeredBy")
    .optional()
    .isString().withMessage("AdministeredBy must be a string"),

];

export const validateUpdateImmunization = [
  param("immunizationId").isMongoId().withMessage("Invalid immunization ID"),
  body("vaccine")
    .optional()
    .isString().withMessage("Vaccine must be a string"),

  body("date")
    .optional()
    .isISO8601().withMessage("Vaccination date must be a valid ISO date")
    .custom((value) => {
      const date = new Date(value);
      if (date > new Date()) {
        throw new Error("Vaccination date cannot be in the future");
      }
      return true;
    }),

  body("boosterDue")
    .optional()
    .isISO8601().withMessage("Booster due must be a valid ISO date")
    .custom((value, { req }) => {
      if (req.body.date && new Date(value) <= new Date(req.body.date)) {
        throw new Error("Booster due date must be after vaccination date");
      }
      return true;
    }),

  body("administeredBy")
    .optional()
    .isString().withMessage("AdministeredBy must be a string"),

];

// === Surgery Validations ===
export const validateAddSurgery = [
  body("name").notEmpty().withMessage("Surgery name is required"),
  body("date").optional().isISO8601().toDate()
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Surgery date cannot be in the future");
      }
      return true;
    }),
  body("outcome").optional().isString(),
  body("hospital").optional().isString(),
  body("surgeon.doctorId").optional().isMongoId().withMessage("Invalid surgeon id"),
  body("surgeon.name").optional().isString().withMessage("Surgeon name should be a string")
];

export const validateUpdateSurgery = [
  param("surgeryId").isMongoId().withMessage("Invalid surgery ID"),
  body("name").optional().notEmpty(),
  body("date").optional().isISO8601().toDate()
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Surgery date cannot be in the future");
      }
      return true;
    }),
  body("outcome").optional().isString(),
  body("hospital").optional().isString(),
  body("surgeon.doctorId").optional().isMongoId().withMessage("Invalid surgeon id"),
  body("surgeon.name").optional().isString().withMessage("Surgeon name should be a string")
];

// === Hospitalization Validations ===
export const validateAddHospitalization = [
  body("reason").notEmpty().withMessage("Hospitalization reason is required"),
  body("admissionDate").isISO8601().toDate()
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Admission date cannot be in the future");
      }
      return true;
    }),
  body("dischargeDate").optional().isISO8601().toDate()
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date(req.body.admissionDate)) {
        throw new Error("Discharge date must be after admission date");
      }
      return true;
    }),
  body("hospitalName").notEmpty().withMessage("Hospital name is required"),
  body("dischargeSummary").optional().isString()
];

export const validateUpdateHospitalization = [
  param("hospitalizationId").isMongoId().withMessage("Invalid hospitalization ID"),
  body("reason").optional().notEmpty(),
  body("admissionDate").optional().isISO8601().toDate()
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Admission date cannot be in the future");
      }
      return true;
    }),
  body("dischargeDate").optional().isISO8601().toDate()
    .custom((value, { req }) => {
      const admissionDate = req.body.admissionDate || value;
      if (value && new Date(value) < new Date(admissionDate)) {
        throw new Error("Discharge date must be after admission date");
      }
      return true;
    }),
  body("hospitalName").optional().notEmpty(),
  body("dischargeSummary").optional().isString()
];

// === Family History Validations ===
export const validateAddFamilyHistory = [
  body("relation").notEmpty().isIn(RELATIONSHIPS)
    .withMessage("Invalid relation type"),
  body("condition").notEmpty().withMessage("Medical condition is required"),
  body("ageAtDiagnosis").optional().isInt({ min: 0, max: 120 })
    .withMessage("Age at diagnosis must be between 0 and 120"),
  body("deceased").optional().isBoolean(),
  body("notes").optional().isString()
];

export const validateUpdateFamilyHistory = [
  param("recordId").isMongoId().withMessage("Invalid family history record ID"),
  body("relation").optional().isIn(RELATIONSHIPS)
    .withMessage("Invalid relation type"),
  body("condition").optional().notEmpty(),
  body("ageAtDiagnosis").optional().isInt({ min: 0, max: 120 })
    .withMessage("Age at diagnosis must be between 0 and 120"),
  body("deceased").optional().isBoolean(),
  body("notes").optional().isString()
];

// === Search Validation ===
export const validateSearch = [
  query("q").isString().isLength({ min: 3 })
    .withMessage("Search query must be at least 3 characters")
]