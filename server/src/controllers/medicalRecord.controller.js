import MedicalRecord from "../models/medicalRecord.model.js";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import mongoose from "mongoose";
import { APPOINTMENT_STATUS } from "../models/appointment/appointment.model.js";

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

      const { patient, appointment } = req.body;

      // Validate required fields
      if (!patient || !appointment) {
        return res.status(400).json({ error: "Patient and appointment are required" });
      }

      // Check if appointment exists and is completed
      const existingAppointment = await Appointment.findById(appointment);
      if (!existingAppointment || existingAppointment.status !== APPOINTMENT_STATUS.COMPLETED) {
        return res.status(400).json({ error: "Medical records can only be created for completed appointments" });
      }

      // Check if patient exists
      const existingPatient = await Patient.findById(patient);
      if (!existingPatient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Check if record already exists for this appointment
      const existingRecord = await MedicalRecord.findOne({ appointment });
      if (existingRecord) {
        return res.status(400).json({ error: "Medical record already exists for this appointment" });
      }

      // Create new record with doctor as the creator
      const newRecord = new MedicalRecord({
        ...req.body,
        addedBy: existingAppointment.doctor,
        source: "Doctor"
      });

      await newRecord.save();

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
      if (req.user.role !== "Doctor") {
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
      );

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
      if (req.user.role !== "Doctor") {
        return res.status(403).json({ error: "Only doctors can add diagnoses" });
      }

      const { recordId } = req.params;
      const { name, status, diagnosisDate, resolvedDate, code, notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Diagnosis name is required" });
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
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update diagnosis status (doctor only)
   */
  static async updateDiagnosisStatus(req, res) {
    try {
      // Verify user is a doctor
      if (req.user.role !== "Doctor") {
        return res.status(403).json({ error: "Only doctors can update diagnoses" });
      }

      const { recordId, diagnosisId } = req.params;
      const { status } = req.body;

      if (!status || !["Active", "Resolved", "In Remission", "Chronic"].includes(status)) {
        return res.status(400).json({ error: "Valid status is required" });
      }

      const updateData = {
        "diagnoses.$.status": status
      };

      if (status === "Resolved") {
        updateData["diagnoses.$.resolvedDate"] = new Date();
      }

      const updatedRecord = await MedicalRecord.findOneAndUpdate(
        {
          _id: recordId,
          "diagnoses._id": diagnosisId
        },
        {
          $set: updateData
        },
        { new: true }
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Record or diagnosis not found" });
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
      if (req.user.role !== "Doctor") {
        return res.status(403).json({ error: "Only doctors can add prescriptions" });
      }

      const { recordId } = req.params;
      const { medication, dosage, frequency, route, duration, notes } = req.body;

      if (!medication) {
        return res.status(400).json({ error: "Medication name is required" });
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
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add lab result to a record (doctor/system only)
   */
  static async addLabResult(req, res) {
    try {
      // Verify user is authorized (doctor or system)
      if (req.user.role !== "Doctor" && req.user.role !== "System") {
        return res.status(403).json({ error: "Only doctors or system can add lab results" });
      }

      const { recordId } = req.params;
      const { testName, result, units, referenceRange, comments } = req.body;

      if (!testName || !result) {
        return res.status(400).json({ error: "Test name and result are required" });
      }

      const labResultData = {
        testName,
        result,
        units,
        referenceRange,
        date: new Date(),
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
      );

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
      // Verify user is authorized (doctor or system)
      if (req.user.role !== "Doctor" && req.user.role !== "System") {
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
      );

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
      if (req.user.role !== "Doctor") {
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
      );

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
      if (req.user.role !== "Doctor") {
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
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add vital signs to a record (doctor/system only)
   */
  static async addVitalSigns(req, res) {
    try {
      // Verify user is authorized (doctor or system)
      if (req.user.role !== "Doctor" && req.user.role !== "System") {
        return res.status(403).json({ error: "Only doctors or system can add vital signs" });
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
      );

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
      // Verify user is authorized (doctor or system)
      if (req.user.role !== "Doctor" && req.user.role !== "System") {
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
      );

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
      if (req.user.role !== "Doctor") {
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
        .populate("addedBy", "fullName specialty");

      res.json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get patient timeline (all medical events in chronological order)
   */
  static async getPatientTimeline(req, res) {
    try {
      const { patientId } = req.params;

      // For patients: only their own records
      if (req.user.role === "patient" && req.user.sub !== patientId) {
        return res.status(403).json({ error: "You can only view your own medical timeline" });
      }

      // Get all records for the patient
      const records = await MedicalRecord.find({ patient: patientId })
        .populate("appointment", "date reason")
        .populate("addedBy", "fullName");

      if (!records || records.length === 0) {
        return res.status(404).json({ error: "No medical records found for this patient" });
      }

      // Create a timeline array with all events
      const timeline = [];

      records.forEach(record => {
        // Add clinical notes
        if (record.clinicalNotes && record.clinicalNotes.length > 0) {
          record.clinicalNotes.forEach(note => {
            timeline.push({
              type: "Clinical Note",
              date: note.date,
              content: note.note,
              addedBy: record.addedBy,
              recordId: record._id
            });
          });
        }

        // Add diagnoses
        if (record.diagnoses && record.diagnoses.length > 0) {
          record.diagnoses.forEach(diagnosis => {
            timeline.push({
              type: "Diagnosis",
              date: diagnosis.diagnosisDate || record.createdAt,
              content: `${diagnosis.name} (${diagnosis.status})`,
              addedBy: record.addedBy,
              recordId: record._id
            });
          });
        }

        // Add prescriptions
        if (record.prescriptions && record.prescriptions.length > 0) {
          record.prescriptions.forEach(prescription => {
            timeline.push({
              type: "Prescription",
              date: prescription.startDate,
              content: `${prescription.medication} - ${prescription.dosage}`,
              addedBy: record.addedBy,
              recordId: record._id
            });
          });
        }

      });

      // Sort timeline by date
      timeline.sort((a, b) => b.date - a.date);

      res.json(timeline);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default MedicalRecordController;