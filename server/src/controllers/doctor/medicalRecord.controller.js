import MedicalRecord from "../../models/patient/medicalRecord.model.js";
import Appointment from "../../models/appointment/appointment.model.js";
import Patient from "../../models/patient/patient.model.js";
import mongoose from "mongoose";
import { APPOINTMENT_STATUS } from "../../models/appointment/appointment.model.js";

const SOURCE_OPTIONS = ["Doctor", "System"];
const CONDITION_STATUS = ["Active", "Resolved", "In Remission", "Chronic"];

class MedicalRecordController {
  /**
   * Create a new medical record (only for doctors)
   */
  static async createMedicalRecord(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can create medical records" });
      }

      const { patient, appointment, clinicalNotes, diagnoses, prescriptions, labResults, imagingReports, procedures, hospitalizations, vitalSigns, immunizations } = req.body;

      // Validate required fields
      if (!patient) {
        return res.status(400).json({ error: "Patient is required" });
      }

      // Check if patient exists
      const existingPatient = await Patient.findById(patient);
      if (!existingPatient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // If appointment is provided, validate it
      if (appointment) {
        const existingAppointment = await Appointment.findById(appointment);
        if (!existingAppointment || existingAppointment.status !== APPOINTMENT_STATUS.COMPLETED) {
          return res.status(400).json({ error: "Medical records can only be created for completed appointments" });
        }

        // Check if record already exists for this appointment
        const existingRecord = await MedicalRecord.findOne({ appointment });
        if (existingRecord) {
          return res.status(400).json({ error: "Medical record already exists for this appointment" });
        }
      }

      // Validate clinical notes
      if (clinicalNotes && clinicalNotes.length > 0) {
        for (const note of clinicalNotes) {
          if (!note.note || !note.date) {
            return res.status(400).json({ error: "Each clinical note must have content and date" });
          }
        }
      }

      // Validate diagnoses
      if (diagnoses && diagnoses.length > 0) {
        for (const diagnosis of diagnoses) {
          if (!diagnosis.name) {
            return res.status(400).json({ error: "Each diagnosis must have a name" });
          }
          if (diagnosis.status && !CONDITION_STATUS.includes(diagnosis.status)) {
            return res.status(400).json({ error: "Invalid diagnosis status" });
          }
        }
      }

      // Validate prescriptions
      if (prescriptions && prescriptions.length > 0) {
        for (const prescription of prescriptions) {
          if (!prescription.medication || !prescription.dosage) {
            return res.status(400).json({ error: "Each prescription must have medication name and dosage" });
          }
        }
      }

      // Create new record
      const newRecord = new MedicalRecord({
        patient,
        appointment,
        addedBy: req.user.sub,
        source: "Doctor",
        clinicalNotes: clinicalNotes || [],
        diagnoses: diagnoses || [],
        prescriptions: prescriptions || [],
        labResults: labResults || [],
        imagingReports: imagingReports || [],
        procedures: procedures || [],
        hospitalizations: hospitalizations || [],
        vitalSigns: vitalSigns || [],
        immunizations: immunizations || []
      });

      await newRecord.save();

      // Populate references before sending response
      await newRecord.populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      res.status(201).json(newRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get medical records for a patient
   */
  static async getPatientRecords(req, res) {
    try {
      const { patientId } = req.params;

      // Validate patient ID
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ error: "Invalid patient ID" });
      }

      // For doctors: full access
      // For patients: only their own records
      if (req.user.role === "patient" && req.user.sub !== patientId) {
        return res.status(403).json({ error: "You can only view your own medical records" });
      }

      const records = await MedicalRecord.find({ patient: patientId })
        .populate("addedBy", "fullName specialty")
        .populate("appointment", "date reason")
        .populate("patient", "fullName dob gender")
        .sort({ createdAt: -1 });

      res.json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get single medical record by ID
   */
  static async getRecordById(req, res) {
    try {
      const { recordId } = req.params;

      // Validate record ID
      if (!mongoose.Types.ObjectId.isValid(recordId)) {
        return res.status(400).json({ error: "Invalid record ID" });
      }

      const record = await MedicalRecord.findById(recordId)
        .populate("addedBy", "fullName specialty")
        .populate("appointment", "date reason")
        .populate("patient", "fullName dob gender");

      if (!record) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      // Access control
      if (req.user.role === "patient" && req.user.sub !== record.patient._id.toString()) {
        return res.status(403).json({ error: "You can only view your own medical records" });
      }

      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add clinical note to a record (doctor only)
   */
  static async addClinicalNote(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can add clinical notes" });
      }

      const { recordId } = req.params;
      const { note } = req.body;

      if (!note) {
        return res.status(400).json({ error: "Note content is required" });
      }

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            clinicalNotes: {
              note,
              date: new Date()
            }
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add diagnosis to a record (doctor only)
   */
  static async addDiagnosis(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can add diagnoses" });
      }

      const { recordId } = req.params;
      const { name, status, diagnosisDate, resolvedDate, code, notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Diagnosis name is required" });
      }

      if (status && !CONDITION_STATUS.includes(status)) {
        return res.status(400).json({ error: "Invalid diagnosis status" });
      }

      const diagnosisData = {
        name,
        status: status || "Active",
        diagnosisDate: diagnosisDate || new Date(),
        code,
        notes
      };

      if (status === "Resolved" && !resolvedDate) {
        diagnosisData.resolvedDate = new Date();
      } else if (resolvedDate) {
        diagnosisData.resolvedDate = resolvedDate;
      }

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            diagnoses: diagnosisData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add prescription to a record (doctor only)
   */
  static async addPrescription(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can add prescriptions" });
      }

      const { recordId } = req.params;
      const { medication, dosage, frequency, route, duration, notes } = req.body;

      if (!medication || !dosage) {
        return res.status(400).json({ error: "Medication name and dosage are required" });
      }

      const prescriptionData = {
        medication,
        dosage,
        frequency,
        route,
        duration,
        startDate: new Date(),
        notes
      };

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            prescriptions: prescriptionData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add lab result to a record (doctor only)
   */
  static async addLabResult(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can add lab results" });
      }

      const { recordId } = req.params;
      const { testName, result, units, referenceRange, date, comments } = req.body;

      if (!testName || !result) {
        return res.status(400).json({ error: "Test name and result are required" });
      }

      const labResultData = {
        testName,
        result,
        units,
        referenceRange,
        date: date || new Date(),
        comments
      };

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            labResults: labResultData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add imaging report to a record (doctor/system only)
   */
  static async addImagingReport(req, res) {
    try {
      // Verify user is authorized
      if (!SOURCE_OPTIONS.includes(req.user.role)) {
        return res.status(403).json({ error: "Only doctors or system can add imaging reports" });
      }

      const { recordId } = req.params;
      const { type, findings, impression, reportUrl } = req.body;

      if (!type) {
        return res.status(400).json({ error: "Imaging type is required" });
      }

      const imagingData = {
        type,
        findings,
        impression,
        date: new Date(),
        reportUrl
      };

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            imagingReports: imagingData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add procedure to a record (doctor only)
   */
  static async addProcedure(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can add procedures" });
      }

      const { recordId } = req.params;
      const { name, date, outcome, hospital, surgeon, notes } = req.body;

      if (!name || !date) {
        return res.status(400).json({ error: "Procedure name and date are required" });
      }

      const procedureData = {
        name,
        date,
        outcome,
        hospital,
        surgeon,
        notes
      };

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            procedures: procedureData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add hospitalization to a record (doctor only)
   */
  static async addHospitalization(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can add hospitalizations" });
      }

      const { recordId } = req.params;
      const { reason, admissionDate, dischargeDate, hospitalName, dischargeSummary } = req.body;

      if (!reason || !admissionDate) {
        return res.status(400).json({ error: "Reason and admission date are required" });
      }

      const hospitalizationData = {
        reason,
        admissionDate,
        dischargeDate,
        hospitalName,
        dischargeSummary
      };

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            hospitalizations: hospitalizationData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add vital signs to a record (doctor only)
   */
  static async addVitalSigns(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can add vital signs" });
      }

      const { recordId } = req.params;
      const { bloodPressure, heartRate, respiratoryRate, temperature, oxygenSaturation } = req.body;

      const vitalSignsData = {
        date: new Date(),
        bloodPressure,
        heartRate,
        respiratoryRate,
        temperature,
        oxygenSaturation
      };

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            vitalSigns: vitalSignsData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add immunization to a record (doctor/system only)
   */
  static async addImmunization(req, res) {
    try {
      // Verify user is authorized
      if (!SOURCE_OPTIONS.includes(req.user.role)) {
        return res.status(403).json({ error: "Only doctors or system can add immunizations" });
      }

      const { recordId } = req.params;
      const { vaccine, date, lotNumber, site, manufacturer, notes } = req.body;

      if (!vaccine || !date) {
        return res.status(400).json({ error: "Vaccine name and date are required" });
      }

      const immunizationData = {
        vaccine,
        date,
        lotNumber,
        site,
        manufacturer,
        notes
      };

      const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        recordId,
        {
          $push: {
            immunizations: immunizationData
          }
        },
        { new: true }
      ).populate([
        { path: "patient", select: "fullName dob gender" },
        { path: "addedBy", select: "fullName specialty" },
        { path: "appointment", select: "date reason" }
      ]);

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search medical records by diagnosis (doctor only)
   */
  static async searchByDiagnosis(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "doctor") {
        return res.status(403).json({ error: "Only doctors can search records" });
      }

      const { diagnosis } = req.query;

      if (!diagnosis) {
        return res.status(400).json({ error: "Diagnosis name is required" });
      }

      const records = await MedicalRecord.find({
        "diagnoses.name": { $regex: diagnosis, $options: "i" }
      })
        .populate("patient", "fullName dob gender")
        .populate("addedBy", "fullName specialty")
        .populate("appointment", "date reason");

      res.json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default MedicalRecordController;