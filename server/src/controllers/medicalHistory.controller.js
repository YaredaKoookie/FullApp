import MedicalHistory from "../models/patient/medicalHistory.model";
import Patient from "../models/patient/patient.model";
import Doctor from "../models/doctors/doctor.model";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { ServerError } from "../utils";

/**
 * @desc    Get complete medical history for a patient
 * @route   GET /api/medical-history/:patientId
 * @access  Private (Doctor, Patient)
 */
export const getMedicalHistory = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  let patientId = patient._id;

  const medicalHistory = await MedicalHistory.findOne({ patient: patientId })
    .populate("patient", "firstName gender")
    .populate("metadata.reviewedBy", "name specialty")
    .populate("currentMedications.prescribedBy", "name")
    .populate("surgeries.surgeon", "name specialty")
    .lean();

  if (!medicalHistory) {
    throw ServerError.notFound("Medical history not found");
  }

  // Calculate additional virtual fields
  const enhancedHistory = {
    ...medicalHistory,
    activeConditions: medicalHistory.chronicConditions.filter(
      (c) => c.status === "Active"
    ),
    criticalAllergies: medicalHistory.allergies.filter(
      (a) => a.isCritical || a.severity === "Life-threatening"
    ),
  };



  res.status(200).json({ success: true, data: enhancedHistory });
};

/**
 * @desc    Create or initialize medical history for a patient
 * @route   POST /api/medical-history
 * @access  Private (Doctor, Admin)
 */
export const createMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.sub;

    // Check if patient exists
    const patientExists = await Patient.findOne({ user: userId });
    if (!patientExists) {
      return res
        .status(404)
        .json({ success: false, error: "Patient not found" });
    }

    let patientId = patientExists._id;

    // Check if history already exists
    const existingHistory = await MedicalHistory.findOne({
      patient: patientId,
    });
    if (existingHistory) {
      throw ServerError.badRequest("Medical history already exists");
    }

    const medicalHistory = new MedicalHistory({
      patient: patientId,
    });

    await medicalHistory.save();

    res.status(201).json({ success: true, data: medicalHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Update core medical history fields
 * @route   PUT /api/medical-history/:id
 * @access  Private (Doctor)
 */
export const updateMedicalHistory = async (req, res) => {
  try {
    const { height, weight, bloodType, lifestyle } = req.body;

    const patient = await Patient.findOne({ user: req.user.sub });

    if (!patient) throw ServerError.notFound("patient not found");

    const medicalHistory = await MedicalHistory.findOne({
      patient: patient._id,
    });
    if (!medicalHistory) {
      return res
        .status(404)
        .json({ success: false, error: "Medical history not found" });
    }

    // Update fields
    if (height) medicalHistory.height = height;
    if (weight) medicalHistory.weight = weight;
    if (bloodType) medicalHistory.bloodType = bloodType;
    if (lifestyle) medicalHistory.lifestyle = lifestyle;

    // Track update
    medicalHistory.metadata.lastReviewed = new Date();
    medicalHistory.metadata.reviewedBy = patient._id;
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: ["Updated core health metrics"],
    });

    await medicalHistory.save();

    res.status(200).json({ success: true, data: medicalHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// ===== Condition Management =====

/**
 * @desc    Add a condition (chronic or past)
 * @route   POST /api/medical-history/:id/conditions
 * @access  Private (Doctor)
 */
export const addCondition = async (req, res) => {
  try {
    const {
      name,
      diagnosisDate,
      resolvedDate,
      isChronic,
      status,
      lastFlareUp,
    } = req.body;

    const patient = await Patient.findOne({ user: req.user.sub });

    if (!patient) throw ServerError.notFound("patient not found");
    const medicalHistory = await MedicalHistory.findOne({
      patient: patient._id,
    });
    if (!medicalHistory) {
      return res
        .status(404)
        .json({ success: false, error: "Medical history not found" });
    }

    const conditionData = {
      name,
      diagnosisDate: diagnosisDate || new Date(),
    };

    if (isChronic) {
      conditionData.status = status || "Active";
      if (lastFlareUp) conditionData.lastFlareUp = lastFlareUp;
      medicalHistory.chronicConditions.push(conditionData);
    } else {
      if (resolvedDate) conditionData.resolvedDate = resolvedDate;
      medicalHistory.pastConditions.push(conditionData);
    }

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Added ${isChronic ? "chronic" : "past"} condition: ${name}`],
    });

    await medicalHistory.save();

    res.status(201).json({
      success: true,
      data: {
        medicalHistory,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Update a condition
 * @route   PUT /api/medical-history/:id/conditions/:conditionId
 * @access  Private (Doctor)
 */
export const updateCondition = async (req, res) => {
  try {
    const { conditionType, ...updateData } = req.body;
    const { id, conditionId } = req.params;
    console.log(conditionId);

    if (!["chronic", "past"].includes(conditionType)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid condition type" });
    }

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({
      patient: patient._id,
    });
    if (!medicalHistory) {
      return res
        .status(404)
        .json({ success: false, error: "Medical history not found" });
    }

    const conditionArray =
      conditionType === "chronic"
        ? medicalHistory.chronicConditions
        : medicalHistory.pastConditions;

    const conditionIndex = conditionArray.findIndex(
      (c) => c._id.toString() === conditionId
    );

    if (conditionIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Condition not found" });
    }

    // Update condition
    const originalName = conditionArray[conditionIndex].name;
    conditionArray[conditionIndex] = {
      ...conditionArray[conditionIndex].toObject(),
      ...updateData,
    };

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Updated ${conditionType} condition: ${originalName}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: conditionArray[conditionIndex],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// ===== Medication Management =====

/**
 * @desc    Add current medication
 * @route   POST /api/medical-history/:id/medications/current
 * @access  Private (Doctor)
 */
export const addCurrentMedication = async (req, res) => {
  const { name, dosage, frequency, startDate, prescribedBy, purpose } =
    req.body;

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });

  if (!medicalHistory) {
    throw ServerError.notFound("Medical history not found");
  }

  const newMedication = {
    name,
    dosage,
    frequency,
    startDate: startDate || new Date(),
    prescribedBy: prescribedBy || patient._id,
    purpose,
    isActive: true,
  };

  medicalHistory.currentMedications.push(newMedication);

  // Track update
  medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
  medicalHistory.metadata.updates.push({
    date: new Date(),
    changedBy: patient._id,
    changes: [`Added current medication: ${name}`],
  });

  await medicalHistory.save();

  res.status(201).json({
    success: true,
    data: medicalHistory.currentMedications.slice(-1)[0],
  });
};

/**
 * @desc    Discontinue a current medication (move to past medications)
 * @route   POST /api/medical-history/:id/medications/:medicationId/discontinue
 * @access  Private (Doctor)
 */
export const discontinueMedication = async (req, res) => {
  const { reasonStopped, endDate } = req.body;
  const { id, medicationId } = req.params;

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });

  if (!medicalHistory) {
    throw ServerError.notFound("Medical history not found");
  }

  const medicationIndex = medicalHistory.currentMedications.findIndex(
    (m) => m._id.toString() === medicationId
  );

  if (medicationIndex === -1) {
    throw ServerError.notFound("Medication not found in current medications");
  }

  const discontinuedMed = medicalHistory.currentMedications[medicationIndex];
  const { name, dosage, frequency, startDate, prescribedBy, purpose } =
    discontinuedMed;

  // Add to past medications
  medicalHistory.pastMedications.push({
    name,
    dosage,
    frequency,
    startDate,
    prescribedBy,
    purpose,
    reasonStopped,
    endDate: endDate || new Date(),
  });

  // Remove from current medications
  medicalHistory.currentMedications.splice(medicationIndex, 1);

  // Track update
  medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
  medicalHistory.metadata.updates.push({
    date: new Date(),
    changedBy: patient._id,
    changes: [`Discontinued medication: ${name}`],
  });

  await medicalHistory.save();

  res
    .status(200)
    .json({ success: true, data: medicalHistory.pastMedications.slice(-1)[0] });
};

// ===== Allergy Management =====

/**
 * @desc    Add an allergy
 * @route   POST /api/medical-history/:id/allergies
 * @access  Private (Doctor, Patient)
 */
export const addAllergy = async (req, res) => {
  try {
    const { substance, reaction, severity, isCritical, firstObserved } =
      req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({
      patient: patient._id,
    });
    if (!medicalHistory) {
      return res
        .status(404)
        .json({ success: false, error: "Medical history not found" });
    }

    const newAllergy = {
      substance,
      reaction,
      severity,
      isCritical: isCritical || severity === "Life-threatening",
      firstObserved: firstObserved || new Date(),
    };

    medicalHistory.allergies.push(newAllergy);

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Added allergy: ${substance}`],
    });

    await medicalHistory.save();

    res.status(201).json({
      success: true,
      data: medicalHistory.allergies.slice(-1)[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// ===== Advanced Features =====

/**
 * @desc    Get medication history timeline
 * @route   GET /api/medical-history/:id/timeline/medications
 * @access  Private (Doctor, Patient)
 */
export const getMedicationTimeline = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
    .select("currentMedications pastMedications")
    .lean();

  if (!medicalHistory) throw ServerError.notFound("Medical history not found");

  // Combine current and past medications
  const timeline = [
    ...medicalHistory.currentMedications.map((m) => ({
      ...m,
      type: "current",
      endDate: null,
    })),
    ...medicalHistory.pastMedications.map((m) => ({
      ...m,
      type: "past",
    })),
  ].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  res.status(200).json({ success: true, data: timeline });
};

/**
 * @desc    Get health summary (key metrics and active issues)
 * @route   GET /api/medical-history/:id/summary
 * @access  Private (Doctor, Patient)
 */
export const getHealthSummary = async (req, res) => {
  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
    .select(
      "height weight bloodType allergies chronicConditions currentMedications lifestyle"
    )
    .lean();

  if (!medicalHistory) {
    return res
      .status(404)
      .json({ success: false, error: "Medical history not found" });
  }

  const summary = {
    vitals: {
      height: medicalHistory.height,
      weight: medicalHistory.weight,
      bloodType: medicalHistory.bloodType,
      bmi:
        medicalHistory.height && medicalHistory.weight
          ? (
              medicalHistory.weight /
              (medicalHistory.height / 100) ** 2
            ).toFixed(2)
          : null,
    },
    activeConditions: medicalHistory.chronicConditions
      .filter((c) => c.status === "Active")
      .map((c) => c.name),
    criticalAllergies: medicalHistory.allergies
      .filter((a) => a.isCritical || a.severity === "Life-threatening")
      .map((a) => a.substance),
    currentMedications: medicalHistory.currentMedications
      .filter((m) => m.isActive)
      .map((m) => m.name),
    lifestyleFactors: {
      smoker: medicalHistory.lifestyle?.smoking?.status || false,
      alcoholUse: medicalHistory.lifestyle?.alcohol?.status || false,
      exerciseFrequency:
        medicalHistory.lifestyle?.exerciseFrequency || "Unknown",
    },
  };

  res.status(200).json({ success: true, data: summary });
};


/**
 * @desc    Update allergy 
 * @route   PUT /medical-history/allergy/:allergyId
 * @access  Private (Patient)
 */

export const updateAllergy = async (req, res) => {
    const { isCritical, ...updateData } =
      req.body;
    const {allergyId} = req.params;

    console.log(isCritical, updateData)

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({
      patient: patient._id,
    });

    if (!medicalHistory) {
      return res
        .status(404)
        .json({ success: false, error: "Medical history not found" });
    }

    const existingAllergyIndex = medicalHistory.allergies.findIndex(allergy => allergy._id.toString() === allergyId);

    if(existingAllergyIndex === -1)
      throw ServerError.notFound("Allergy not found");

    console.log("existingAllergyIndex", existingAllergyIndex);

    if(isCritical)
      updateData.isCritical = isCritical || severity === "Life-threatening";

    console.log("index", existingAllergyIndex);
    console.log("selected allergy", medicalHistory.allergies[existingAllergyIndex]);
    medicalHistory.allergies[existingAllergyIndex] = {
      ...medicalHistory.allergies[existingAllergyIndex].toObject(),
      ...updateData
    }

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Update allergy: ${allergyId}`],
    });

    await medicalHistory.save();

    res.status(201).json({
      success: true,
      data: medicalHistory.allergies.slice(-1)[0],
    });
};

/**
 * @desc    Search medical history
 * @route   GET /api/medical-history/:id/search?q=query
 * @access  Private (Doctor)
 */
export const searchMedicalHistory = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 3) {
    throw ServerError.badRequest("Search query must be at least 3 characters");
  }

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  const results = await MedicalHistory.aggregate([
    { $match: { patient: patient._id } },
    {
      $project: {
        conditions: {
          $concatArrays: ["$chronicConditions", "$pastConditions"],
        },
        medications: {
          $concatArrays: ["$currentMedications", "$pastMedications"],
        },
        allergies: 1,
        surgeries: 1,
        hospitalizations: 1,
      },
    },
    {
      $project: {
        allItems: {
          $concatArrays: [
            {
              $map: {
                input: "$conditions",
                as: "c",
                in: { type: "condition", data: "$$c" },
              },
            },
            {
              $map: {
                input: "$medications",
                as: "m",
                in: { type: "medication", data: "$$m" },
              },
            },
            {
              $map: {
                input: "$allergies",
                as: "a",
                in: { type: "allergy", data: "$$a" },
              },
            },
            {
              $map: {
                input: "$surgeries",
                as: "s",
                in: { type: "surgery", data: "$$s" },
              },
            },
            {
              $map: {
                input: "$hospitalizations",
                as: "h",
                in: { type: "hospitalization", data: "$$h" },
              },
            },
          ],
        },
      },
    },
    { $unwind: "$allItems" },
    {
      $match: {
        $or: [
          { "allItems.data.name": { $regex: q, $options: "i" } },
          { "allItems.data.substance": { $regex: q, $options: "i" } },
          { "allItems.data.reason": { $regex: q, $options: "i" } },
          { "allItems.data.purpose": { $regex: q, $options: "i" } },
        ],
      },
    },
    {
      $group: {
        _id: "$allItems.type",
        items: { $push: "$allItems.data" },
      },
    },
  ]);

  res.status(200).json({ success: true, data: results });
};

/**
 * @desc    Add immunization record
 * @route   POST /api/medical-history/:id/immunizations
 * @access  Private (Doctor)
 */
export const addImmunization = async (req, res) => {
  try {
    const { vaccine, date, boosterDue, administeredBy } = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const newImmunization = {
      vaccine,
      date: date || new Date(),
      boosterDue,
      administeredBy: administeredBy || req.user.sub
    };

    medicalHistory.immunizations.push(newImmunization);

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Added immunization: ${vaccine}`],
    });

    await medicalHistory.save();

    res.status(201).json({
      success: true,
      data: medicalHistory.immunizations.slice(-1)[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Update immunization record
 * @route   PUT /api/medical-history/:id/immunizations/:immunizationId
 * @access  Private (Doctor)
 */
export const updateImmunization = async (req, res) => {
  try {
    const { immunizationId } = req.params;
    const updateData = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const immunizationIndex = medicalHistory.immunizations.findIndex(
      i => i._id.toString() === immunizationId
    );
    if (immunizationIndex === -1) throw ServerError.notFound("Immunization not found");

    medicalHistory.immunizations[immunizationIndex] = {
      ...medicalHistory.immunizations[immunizationIndex].toObject(),
      ...updateData
    };

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Updated immunization: ${medicalHistory.immunizations[immunizationIndex].vaccine}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: medicalHistory.immunizations[immunizationIndex],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Get immunization timeline
 * @route   GET /api/medical-history/:id/immunizations
 * @access  Private (Doctor, Patient)
 */
export const getImmunizationHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
      .select("immunizations")
      .lean();

    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    // Sort by date descending
    const sortedImmunizations = [...medicalHistory.immunizations].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json({ success: true, data: sortedImmunizations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Get due immunizations
 * @route   GET /api/medical-history/:id/immunizations/due
 * @access  Private (Doctor, Patient)
 */
export const getDueImmunizations = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.sub }).select("_id dob");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
      .select("immunizations")
      .lean();

    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const today = new Date();
    const dueImmunizations = medicalHistory.immunizations.filter(immunization => {
      return immunization.boosterDue && new Date(immunization.boosterDue) <= today;
    });

    res.status(200).json({ success: true, data: dueImmunizations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Update surgery record
 * @route   PUT /api/medical-history/:id/surgeries/:surgeryId
 * @access  Private (Doctor)
 */
export const updateSurgery = async (req, res) => {
  try {
    const { surgeryId } = req.params;
    const updateData = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const surgeryIndex = medicalHistory.surgeries.findIndex(
      s => s._id.toString() === surgeryId
    );
    if (surgeryIndex === -1) throw ServerError.notFound("Surgery not found");

    const originalName = medicalHistory.surgeries[surgeryIndex].name;
    medicalHistory.surgeries[surgeryIndex] = {
      ...medicalHistory.surgeries[surgeryIndex].toObject(),
      ...updateData
    };

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Updated surgery: ${originalName}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: medicalHistory.surgeries[surgeryIndex],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Delete surgery record
 * @route   DELETE /api/medical-history/:id/surgeries/:surgeryId
 * @access  Private (Doctor, Admin)
 */
export const deleteSurgery = async (req, res) => {
  try {
    const { surgeryId } = req.params;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const surgeryIndex = medicalHistory.surgeries.findIndex(
      s => s._id.toString() === surgeryId
    );
    if (surgeryIndex === -1) throw ServerError.notFound("Surgery not found");

    const deletedSurgery = medicalHistory.surgeries.splice(surgeryIndex, 1)[0];

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Deleted surgery: ${deletedSurgery.name}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: { message: "Surgery record deleted successfully" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Get surgical history timeline
 * @route   GET /api/medical-history/:id/surgeries
 * @access  Private (Doctor, Patient)
 */
export const getSurgicalHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
      .select("surgeries")
      .populate("surgeries.surgeon", "name specialty")
      .lean();

    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    // Sort by date descending
    const sortedSurgeries = [...medicalHistory.surgeries].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });

    res.status(200).json({ success: true, data: sortedSurgeries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};


/**
 * @desc    Update hospitalization record
 * @route   PUT /api/medical-history/:id/hospitalizations/:hospitalizationId
 * @access  Private (Doctor)
 */
export const updateHospitalization = async (req, res) => {
  try {
    const { hospitalizationId } = req.params;
    const updateData = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const hospIndex = medicalHistory.hospitalizations.findIndex(
      h => h._id.toString() === hospitalizationId
    );
    if (hospIndex === -1) throw ServerError.notFound("Hospitalization not found");

    const originalReason = medicalHistory.hospitalizations[hospIndex].reason;
    medicalHistory.hospitalizations[hospIndex] = {
      ...medicalHistory.hospitalizations[hospIndex].toObject(),
      ...updateData
    };

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Updated hospitalization: ${originalReason}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: medicalHistory.hospitalizations[hospIndex],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Delete hospitalization record
 * @route   DELETE /api/medical-history/:id/hospitalizations/:hospitalizationId
 * @access  Private (Doctor, Admin)
 */
export const deleteHospitalization = async (req, res) => {
  try {
    const { hospitalizationId } = req.params;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const hospIndex = medicalHistory.hospitalizations.findIndex(
      h => h._id.toString() === hospitalizationId
    );
    if (hospIndex === -1) throw ServerError.notFound("Hospitalization not found");

    const deletedHosp = medicalHistory.hospitalizations.splice(hospIndex, 1)[0];

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Deleted hospitalization: ${deletedHosp.reason}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: { message: "Hospitalization record deleted successfully" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Get hospitalization timeline
 * @route   GET /api/medical-history/:id/hospitalizations
 * @access  Private (Doctor, Patient)
 */
export const getHospitalizationTimeline = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
      .select("hospitalizations")
      .lean();

    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    // Sort by admission date descending
    const sortedHospitalizations = [...medicalHistory.hospitalizations].sort(
      (a, b) => new Date(b.admissionDate) - new Date(a.admissionDate)
    );

    res.status(200).json({ success: true, data: sortedHospitalizations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};


/**
 * @desc    Add family history record
 * @route   POST /api/medical-history/:id/family-history
 * @access  Private (Doctor, Patient)
 */
export const addFamilyHistory = async (req, res) => {
  try {
    const { relation, condition, ageAtDiagnosis, deceased } = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const newFamilyHistory = {
      relation,
      condition,
      ageAtDiagnosis,
      deceased
    };

    medicalHistory.familyHistory.push(newFamilyHistory);

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Added family history: ${condition} in ${relation}`],
    });

    await medicalHistory.save();

    res.status(201).json({
      success: true,
      data: medicalHistory.familyHistory.slice(-1)[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Update family history record
 * @route   PUT /api/medical-history/:id/family-history/:recordId
 * @access  Private (Doctor)
 */
export const updateFamilyHistory = async (req, res) => {
  try {
    const { recordId } = req.params;
    const updateData = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const recordIndex = medicalHistory.familyHistory.findIndex(
      fh => fh._id.toString() === recordId
    );
    if (recordIndex === -1) throw ServerError.notFound("Family history record not found");

    const originalCondition = medicalHistory.familyHistory[recordIndex].condition;
    medicalHistory.familyHistory[recordIndex] = {
      ...medicalHistory.familyHistory[recordIndex].toObject(),
      ...updateData
    };

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Updated family history: ${originalCondition}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: medicalHistory.familyHistory[recordIndex],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Delete family history record
 * @route   DELETE /api/medical-history/:id/family-history/:recordId
 * @access  Private (Doctor, Patient)
 */
export const deleteFamilyHistory = async (req, res) => {
  try {
    const { recordId } = req.params;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const recordIndex = medicalHistory.familyHistory.findIndex(
      fh => fh._id.toString() === recordId
    );
    if (recordIndex === -1) throw ServerError.notFound("Family history record not found");

    const deletedRecord = medicalHistory.familyHistory.splice(recordIndex, 1)[0];

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Deleted family history: ${deletedRecord.condition} in ${deletedRecord.relation}`],
    });

    await medicalHistory.save();

    res.status(200).json({
      success: true,
      data: { message: "Family history record deleted successfully" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * @desc    Get genetic risk report
 * @route   GET /api/medical-history/:id/genetic-risk
 * @access  Private (Doctor)
 */
export const getGeneticRiskReport = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
      .select("familyHistory")
      .lean();

    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    // Group conditions by relation and count occurrences
    const riskReport = medicalHistory.familyHistory.reduce((acc, record) => {
      if (!acc[record.condition]) {
        acc[record.condition] = {
          condition: record.condition,
          relations: [],
          totalCount: 0
        };
      }
      
      acc[record.condition].relations.push({
        relation: record.relation,
        ageAtDiagnosis: record.ageAtDiagnosis,
        deceased: record.deceased
      });
      acc[record.condition].totalCount++;
      
      return acc;
    }, {});

    // Convert to array and sort by highest risk (most occurrences)
    const sortedReport = Object.values(riskReport).sort(
      (a, b) => b.totalCount - a.totalCount
    );

    res.status(200).json({ success: true, data: sortedReport });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};


/**
 * @desc    Add a surgical procedure record
 * @route   POST /api/medical-history/surgeries
 * @access  Private (Doctor)
 */
export const addSurgery = async (req, res) => {
  try {
    const {
      name,
      date,
      outcome,
      hospital,
      surgeon
    } = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    // Validate surgeon exists if provided
    if (surgeon) {
      const surgeonExists = await Doctor.exists({ _id: surgeon });
      if (!surgeonExists) throw ServerError.badRequest("Surgeon not found");
    }

    const newSurgery = {
      name,
      date: date || new Date(),
      outcome,
      hospital,
      surgeon
    };

    // Validate surgery date is not in the future
    if (new Date(newSurgery.date) > new Date()) {
      throw ServerError.badRequest("Surgery date cannot be in the future");
    }

    medicalHistory.surgeries.push(newSurgery);

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Added surgical procedure: ${name}`],
    });

    await medicalHistory.save();

    res.status(201).json({
      success: true,
      data: medicalHistory.surgeries.slice(-1)[0],
    });
  } catch (err) {
    console.error(err);
    if (err instanceof ServerError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: "Server Error" });
    }
  }
};


/**
 * @desc    Add a hospitalization record
 * @route   POST /api/medical-history/hospitalizations
 * @access  Private (Doctor)
 */
export const addHospitalization = async (req, res) => {
  try {
    const {
      reason,
      admissionDate,
      dischargeDate,
      hospitalName,
      dischargeSummary
    } = req.body;

    const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
    if (!patient) throw ServerError.notFound("Patient not found");

    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
    if (!medicalHistory) throw ServerError.notFound("Medical history not found");

    const newHospitalization = {
      reason,
      admissionDate: admissionDate || new Date(),
      dischargeDate,
      hospitalName,
      dischargeSummary
    };

    // Validate discharge date is after admission if both exist
    if (dischargeDate && new Date(dischargeDate) < new Date(newHospitalization.admissionDate)) {
      throw ServerError.badRequest("Discharge date must be after admission date");
    }

    medicalHistory.hospitalizations.push(newHospitalization);

    // Track update
    medicalHistory.metadata.updates = medicalHistory.metadata.updates || [];
    medicalHistory.metadata.updates.push({
      date: new Date(),
      changedBy: patient._id,
      changes: [`Added hospitalization at ${hospitalName} for ${reason}`],
    });

    await medicalHistory.save();

    res.status(201).json({
      success: true,
      data: medicalHistory.hospitalizations.slice(-1)[0],
    });
  } catch (err) {
    console.error(err);
    if (err instanceof ServerError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: "Server Error" });
    }
  }
};