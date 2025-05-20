import { body, param, query } from "express-validator";
import MedicalHistory, {
  ALLERGY_SEVERITY,
  BLOOD_TYPES,
} from "../../models/patient/medicalHistory.model";
import { FREQUENCY_OPTIONS } from "../../models/patient/medicalHistory.model";

// Shared validators
const validateCondition = [
  body("name").notEmpty().withMessage("Condition name is required"),
  body("diagnosisDate")
    .optional()
    .isDate()
    .withMessage("Invalid diagnosis date"),
  body("resolvedDate")
    .optional()
    .isDate()
    .withMessage("Invalid resolved date")
    .custom((value, { req }) => {
      if (
        req.body.diagnosisDate &&
        new Date(value) < new Date(req.body.diagnosisDate)
      ) {
        throw new Error("Resolved date must be after diagnosis date");
      }
      return true;
    }),
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
    .isIn(ALLERGY_SEVERITY)
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
    .isIn(ALLERGY_SEVERITY)
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
  body("status")
    .if(body("isChronic").equals(true))
    .isIn(["Active", "In Remission", "Resolved", "Chronic"])
    .withMessage("Invalid status for chronic condition"),
  body("lastFlareUp")
    .if(body("isChronic").equals(true))
    .optional()
    .isDate()
    .withMessage("Invalid flare-up date"),
];

export const validateUpdateCondition = [
  ...validateCondition,
  body("conditionType")
    .isIn(["chronic", "past"])
    .withMessage("Invalid condition type"),
  body("status")
    .if(body("conditionType").equals("chronic"))
    .isIn(["Active", "In Remission", "Resolved", "Chronic"])
    .withMessage("Invalid status for chronic condition"),
  body("lastFlareUp")
    .if(body("conditionType").equals("chronic"))
    .optional()
    .isDate()
    .withMessage("Invalid flare-up date"),
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
  body("vaccine").notEmpty().withMessage("Vaccine name is required"),
  body("date").optional().isISO8601().toDate()
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Vaccine date cannot be in the future");
      }
      return true;
    }),
  body("boosterDue").optional().isISO8601().toDate(),
  body("administeredBy").optional().isMongoId()
];

export const validateUpdateImmunization = [
  param("immunizationId").isMongoId().withMessage("Invalid immunization ID"),
  body("vaccine").optional().notEmpty(),
  body("date").optional().isISO8601().toDate()
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Vaccine date cannot be in the future");
      }
      return true;
    }),
  body("boosterDue").optional().isISO8601().toDate(),
  body("administeredBy").optional().isMongoId()
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
  body("surgeon").optional().isMongoId()
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
  body("surgeon").optional().isMongoId()
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
  body("relation").notEmpty().isIn(["Father", "Mother", "Sibling", "Grandparent", "Other"])
    .withMessage("Invalid relation type"),
  body("condition").notEmpty().withMessage("Medical condition is required"),
  body("ageAtDiagnosis").optional().isInt({ min: 0, max: 120 })
    .withMessage("Age at diagnosis must be between 0 and 120"),
  body("deceased").optional().isBoolean()
];

export const validateUpdateFamilyHistory = [
  param("recordId").isMongoId().withMessage("Invalid family history record ID"),
  body("relation").optional().isIn(["Father", "Mother", "Sibling", "Grandparent", "Other"])
    .withMessage("Invalid relation type"),
  body("condition").optional().notEmpty(),
  body("ageAtDiagnosis").optional().isInt({ min: 0, max: 120 })
    .withMessage("Age at diagnosis must be between 0 and 120"),
  body("deceased").optional().isBoolean()
];

// === Search Validation ===
export const validateSearch = [
  query("q").isString().isLength({ min: 3 })
    .withMessage("Search query must be at least 3 characters")
]