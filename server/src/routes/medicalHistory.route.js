import Router from "express";
import { isPatient, verifyJWT } from "../middlewares/auth.middleware";
import { medicalHistoryController } from "../controllers";
import { validate } from "../validations";
import { medicalHistoryChains } from "../validations/chains";

const router = Router();

router.use(verifyJWT); // Ensure all routes are protected
router.use(isPatient); // Ensure user is a patient

// === Core Medical History ===
router.get("/", medicalHistoryController.getMedicalHistory);
router.post("/", medicalHistoryController.createMedicalHistory);
router.put(
  "/",
  validate(medicalHistoryChains.validateUpdateHistory, {matchData: false}),
  medicalHistoryController.updateMedicalHistory
);

// === Conditions ===
router.post(
  "/conditions",
  validate(medicalHistoryChains.validateAddCondition, {matchData: false}),
  medicalHistoryController.addCondition 
);
router.put(
  "/conditions/:conditionId",
  validate(medicalHistoryChains.validateUpdateCondition, {matchData: false}),
  medicalHistoryController.updateCondition 
);

// === Medications ===
router.post(
  "/medications/current",
  validate(medicalHistoryChains.validateAddMedication),
  medicalHistoryController.addCurrentMedication
);
router.post(
  "/medications/:medicationId/discontinue",
  validate(medicalHistoryChains.validateDiscontinueMedication),
  medicalHistoryController.discontinueMedication
);
router.get(
  "/timeline/medications",
  medicalHistoryController.getMedicationTimeline
);

// === Allergies ===
router.post(
  "/allergies",
  validate(medicalHistoryChains.validateAddAllergy),
  medicalHistoryController.addAllergy
);
router.put(
  "/allergies/:allergyId",
  validate(medicalHistoryChains.validateUpdateAllergy),
  medicalHistoryController.updateAllergy
);

// === Immunizations ===
router.post(
  "/immunizations",
  validate(medicalHistoryChains.validateAddImmunization),
  medicalHistoryController.addImmunization
);
router.put(
  "/immunizations/:immunizationId",
  validate(medicalHistoryChains.validateUpdateImmunization),
  medicalHistoryController.updateImmunization
);
router.get(
  "/immunizations",
  medicalHistoryController.getImmunizationHistory
);
router.get(
  "/immunizations/due",
  medicalHistoryController.getDueImmunizations
);

// === Surgeries ===
router.post(
  "/surgeries",
  validate(medicalHistoryChains.validateAddSurgery),
  medicalHistoryController.addSurgery
);
router.put(
  "/surgeries/:surgeryId",
  validate(medicalHistoryChains.validateUpdateSurgery),
  medicalHistoryController.updateSurgery
);
router.delete(
  "/surgeries/:surgeryId",
  medicalHistoryController.deleteSurgery
);
router.get(
  "/surgeries",
  medicalHistoryController.getSurgicalHistory
);

// === Hospitalizations ===
router.post(
  "/hospitalizations",
  validate(medicalHistoryChains.validateAddHospitalization),
  medicalHistoryController.addHospitalization
);
router.put(
  "/hospitalizations/:hospitalizationId",
  validate(medicalHistoryChains.validateUpdateHospitalization),
  medicalHistoryController.updateHospitalization
);
router.delete(
  "/hospitalizations/:hospitalizationId",
  medicalHistoryController.deleteHospitalization
);
router.get(
  "/hospitalizations",
  medicalHistoryController.getHospitalizationTimeline
);

// === Family History ===
router.post(
  "/family-history",
  validate(medicalHistoryChains.validateAddFamilyHistory),
  medicalHistoryController.addFamilyHistory
);
router.put(
  "/family-history/:recordId",
  validate(medicalHistoryChains.validateUpdateFamilyHistory),
  medicalHistoryController.updateFamilyHistory
);
router.delete(
  "/family-history/:recordId",
  medicalHistoryController.deleteFamilyHistory
);
router.get(
  "/family-history/risk-report",
  medicalHistoryController.getGeneticRiskReport
);

// === Advanced Features ===
router.get(
  "/summary",
  medicalHistoryController.getHealthSummary
);
router.get(
  "/search",
  validate(medicalHistoryChains.validateSearch),
  medicalHistoryController.searchMedicalHistory
);

export default router;