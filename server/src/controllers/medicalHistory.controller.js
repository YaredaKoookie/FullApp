import MedicalHistory, { CONDITION_STATUS, DATA_SOURCE } from "../models/patient/medicalHistory.model";
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
    .populate("currentMedications.prescribedBy", "name")
    .populate("surgeries.surgeon.doctorId", "name specialty")
    .lean();

  if (!medicalHistory) {
    throw ServerError.notFound("Medical history not found");
  }
  const pastConditions = medicalHistory.conditions.filter(c => (c.status === "Resolved" && c.isChronic === true) || (c.status === "In Remission" && c.isChronic === false));
  const chronicConditions = medicalHistory.conditions.filter(c => c.status === "Active"  || (c.isChronic === true && c.status !== "Resolved"));

  // Calculate additional virtual fields
  const enhancedHistory = {
    ...medicalHistory,
    pastConditions,
    chronicConditions,
    activeConditions: medicalHistory.conditions.filter(
      (c) => c.status === "Active"
    ),
    criticalAllergies: medicalHistory.allergies.filter(
      (a) => a.isCritical || a.severity === "Life-threatening"
    ),
  }
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
  const {
    name,
    diagnosisDate,
    resolvedDate,
    status,
    isChronic,
  } = req.body;

  const patient = await Patient.findOne({ user: req.user.sub });

  if (!patient) throw ServerError.notFound("patient not found");

  const medicalHistory = await MedicalHistory.findOne({
    patient: patient._id,
  });

  if (!medicalHistory)
    throw ServerError.notFound("Medical history not found");

  // Validate condition status and dates
  if (status === CONDITION_STATUS.RESOLVED && !resolvedDate) {
    throw ServerError.badRequest("Resolved date is required for resolved conditions");
  }

  if (resolvedDate && new Date(resolvedDate) < new Date(diagnosisDate)) {
    throw ServerError.badRequest("Resolved date cannot be before diagnosis date");
  }

  if (status === CONDITION_STATUS.ACTIVE && resolvedDate) {
    throw ServerError.badRequest("Active conditions cannot have a resolved date");
  }

  if (status === CONDITION_STATUS.IN_REMISSION && !isChronic) {
    throw ServerError.badRequest("Only chronic conditions can be in remission");
  }

  const conditionData = {
    name,
    diagnosisDate: diagnosisDate || new Date(),
    isChronic,
    status: status || CONDITION_STATUS.ACTIVE,
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  };

  if (status === CONDITION_STATUS.RESOLVED) {
    conditionData.resolvedDate = resolvedDate;
  }

  medicalHistory.conditions.push(conditionData);

  await medicalHistory.save();

  res.status(201).json({
    success: true,
    data: {
      medicalHistory,
    },
  });
};

/**
 * @desc    Update a condition
 * @route   PUT /api/medical-history/:id/conditions/:conditionId
 * @access  Private (Doctor)
 */
export const updateCondition = async (req, res) => {
  const { status, ...updateData } = req.body;
  const { conditionId } = req.params;

  if (!Object.values(CONDITION_STATUS).includes(status))
    throw ServerError.badRequest("Invalid Condition Status");

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

  const conditionArray = medicalHistory.conditions;
  const conditionIndex = conditionArray.findIndex(
    (c) => c._id.toString() === conditionId
  );

  if (conditionIndex === -1) {
    return res
      .status(404)
      .json({ success: false, error: "Condition not found" });
  }

  if (conditionArray[conditionIndex]?.source !== DATA_SOURCE.PATIENT)
    throw ServerError.badRequest("cannot update condition added by the doctor");

  // Validate status transitions and dates
  const currentCondition = conditionArray[conditionIndex];
  
  if (status === CONDITION_STATUS.RESOLVED) {
    if (!updateData.resolvedDate) {
      throw ServerError.badRequest("Resolved date is required when marking a condition as resolved");
    }
    if (new Date(updateData.resolvedDate) < new Date(currentCondition.diagnosisDate)) {
      throw ServerError.badRequest("Resolved date cannot be before diagnosis date");
    }
  }

  if (status === CONDITION_STATUS.ACTIVE) {
    if (updateData.resolvedDate) {
      throw ServerError.badRequest("Active conditions cannot have a resolved date");
    }
    updateData.resolvedDate = null;
  }

  if (status === CONDITION_STATUS.IN_REMISSION) {
    if (!currentCondition.isChronic) {
      throw ServerError.badRequest("Only chronic conditions can be in remission");
    }
    // Keep existing resolved date if any
    if (!updateData.resolvedDate) {
      delete updateData.resolvedDate;
    }
  }

  // Update condition
  conditionArray[conditionIndex] = {
    ...conditionArray[conditionIndex].toObject(),
    status,
    ...updateData,
  };

  await medicalHistory.save();

  res.status(200).json({
    success: true,
    data: conditionArray[conditionIndex],
  });
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
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  };

  medicalHistory.currentMedications.push(newMedication);

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
  const { medicationId } = req.params;

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
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  });

  // Remove from current medications
  medicalHistory.currentMedications.splice(medicationIndex, 1);

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
  const { substance, reaction, severity, isCritical, firstObserved } =
    req.body;

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({
    patient: patient._id,
  });
  if (!medicalHistory)
    throw ServerError.notFound("Medical history not found");

  const newAllergy = {
    substance,
    reaction,
    severity,
    isCritical: isCritical || severity === "Life-threatening",
    firstObserved: firstObserved || new Date(),
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  };

  medicalHistory.allergies.push(newAllergy);


  await medicalHistory.save();

  res.status(201).json({
    success: true,
    data: medicalHistory.allergies.slice(-1)[0],
  });
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
      .filter((c) => c.status === CONDITION_STATUS.ACTIVE)
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
  const updateData =
    req.body;
  const { allergyId } = req.params;


  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");

  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({
    patient: patient._id,
  });

  if (!medicalHistory)
    throw ServerError.notFound("Medical history not found")

  const existingAllergyIndex = medicalHistory.allergies.findIndex(allergy => allergy._id.toString() === allergyId);

  if (existingAllergyIndex === -1)
    throw ServerError.notFound("Allergy not found");

  console.log("existingAllergyIndex", existingAllergyIndex);


  if (medicalHistory.allergies[existingAllergyIndex].source !== DATA_SOURCE.PATIENT) {
    throw ServerError.badRequest("Cannot update allergy added by doctor");
  }

  if (!updateData.isCritical)
    updateData.isCritical = updateData?.severity === "Life-threatening";

  console.log("updated data", updateData)

  console.log("index", existingAllergyIndex);
  console.log("selected allergy", medicalHistory.allergies[existingAllergyIndex]);
  medicalHistory.allergies[existingAllergyIndex] = {
    ...medicalHistory.allergies[existingAllergyIndex].toObject(),
    ...updateData
  }

  // Track update

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
  const { vaccine, date, boosterDue, administeredBy } = req.body;

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
  if (!medicalHistory) throw ServerError.notFound("Medical history not found");

  const newImmunization = {
    vaccine,
    date: date || new Date(),
    boosterDue,
    administeredBy: administeredBy || req.user.sub,
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  };

  medicalHistory.immunizations.push(newImmunization);

  await medicalHistory.save();

  res.status(201).json({
    success: true,
    data: medicalHistory.immunizations.slice(-1)[0],
  });
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

    if (medicalHistory.immunizations[immunizationIndex].source !== DATA_SOURCE.PATIENT) {
      throw ServerError.badRequest("Cannot update immunization added by doctor");
    }

    medicalHistory.immunizations[immunizationIndex] = {
      ...medicalHistory.immunizations[immunizationIndex].toObject(),
      ...updateData
    };

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
};

/**
 * @desc    Get due immunizations
 * @route   GET /api/medical-history/:id/immunizations/due
 * @access  Private (Doctor, Patient)
 */
export const getDueImmunizations = async (req, res) => {

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
};

/**
 * @desc    Update surgery record
 * @route   PUT /api/medical-history/:id/surgeries/:surgeryId
 * @access  Private (Doctor)
 */
export const updateSurgery = async (req, res) => {
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

  if (medicalHistory.surgeries[surgeryIndex].source !== DATA_SOURCE.PATIENT) {
    throw ServerError.badRequest("Cannot update surgery added by doctor");
  }

  medicalHistory.surgeries[surgeryIndex] = {
    ...medicalHistory.surgeries[surgeryIndex].toObject(),
    ...updateData
  };

  await medicalHistory.save();

  res.status(200).json({
    success: true,
    data: medicalHistory.surgeries[surgeryIndex],
  });
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

    if (medicalHistory.surgeries[surgeryIndex].source !== DATA_SOURCE.PATIENT) {
      throw ServerError.badRequest("Cannot delete surgery added by doctor");
    }

    const deletedSurgery = medicalHistory.surgeries.splice(surgeryIndex, 1)[0];

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

    if (medicalHistory.hospitalizations[hospIndex].source !== DATA_SOURCE.PATIENT) {
      throw ServerError.badRequest("Cannot update hospitalization added by doctor");
    }

    medicalHistory.hospitalizations[hospIndex] = {
      ...medicalHistory.hospitalizations[hospIndex].toObject(),
      ...updateData
    };

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
  const { hospitalizationId } = req.params;

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
  if (!medicalHistory) throw ServerError.notFound("Medical history not found");

  const hospIndex = medicalHistory.hospitalizations.findIndex(
    h => h._id.toString() === hospitalizationId
  );
  if (hospIndex === -1) throw ServerError.notFound("Hospitalization not found");

  if (medicalHistory.hospitalizations[hospIndex].source !== DATA_SOURCE.PATIENT) {
    throw ServerError.badRequest("Cannot delete hospitalization added by doctor");
  }

  const deletedHosp = medicalHistory.hospitalizations.splice(hospIndex, 1)[0];

  await medicalHistory.save();

  res.status(200).json({
    success: true,
    data: { message: "Hospitalization record deleted successfully" },
  });
};

/**
 * @desc    Get hospitalization timeline
 * @route   GET /api/medical-history/:id/hospitalizations
 * @access  Private (Doctor, Patient)
 */
export const getHospitalizationTimeline = async (req, res) => {
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

  res.json({ success: true, data: sortedHospitalizations });

};


/**
 * @desc    Add family history record
 * @route   POST /api/medical-history/:id/family-history
 * @access  Private (Doctor, Patient)
 */
export const addFamilyHistory = async (req, res) => {
  const { relation, condition, ageAtDiagnosis, deceased } = req.body;

  const patient = await Patient.findOne({ user: req.user.sub }).select("_id");
  if (!patient) throw ServerError.notFound("Patient not found");

  const medicalHistory = await MedicalHistory.findOne({ patient: patient._id });
  if (!medicalHistory) throw ServerError.notFound("Medical history not found");

  const newFamilyHistory = {
    relation,
    condition,
    ageAtDiagnosis,
    deceased,
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  };

  medicalHistory.familyHistory.push(newFamilyHistory);


  await medicalHistory.save();

  res.status(201).json({
    success: true,
    data: medicalHistory.familyHistory.slice(-1)[0],
  });
};

/**
 * @desc    Update family history record
 * @route   PUT /api/medical-history/:id/family-history/:recordId
 * @access  Private (Doctor)
 */
export const updateFamilyHistory = async (req, res) => {
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

  if (medicalHistory.familyHistory[recordIndex].source !== DATA_SOURCE.PATIENT) {
    throw ServerError.badRequest("Cannot update family history record added by doctor");
  }

  medicalHistory.familyHistory[recordIndex] = {
    ...medicalHistory.familyHistory[recordIndex].toObject(),
    ...updateData
  };

  await medicalHistory.save();

  res.status(200).json({
    success: true,
    data: medicalHistory.familyHistory[recordIndex],
  });
};

/**
 * @desc    Delete family history record
 * @route   DELETE /api/medical-history/:id/family-history/:recordId
 * @access  Private (Doctor, Patient)
 */
export const deleteFamilyHistory = async (req, res) => {
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

  await medicalHistory.save();

  res.status(200).json({
    success: true,
    data: { message: "Family history record deleted successfully" },
  });
};

/**
 * @desc    Get genetic risk report
 * @route   GET /api/medical-history/:id/genetic-risk
 * @access  Private (Doctor)
 */
export const getGeneticRiskReport = async (req, res) => {
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

  res.json({ success: true, data: sortedReport });
};


/**
 * @desc    Add a surgical procedure record
 * @route   POST /api/medical-history/surgeries
 * @access  Private (Doctor)
 */
export const addSurgery = async (req, res) => {
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

  if (surgeon?.doctorId) {
    const surgeonExists = await Doctor.exists({ _id: surgeon.doctorId });
    if (!surgeonExists) throw ServerError.badRequest("Surgeon not found");
  }

  const newSurgery = {
    name,
    date: date || new Date(),
    outcome,
    hospital,
    surgeon,
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  };

  if (new Date(newSurgery.date) > new Date()) {
    throw ServerError.badRequest("Surgery date cannot be in the future");
  }

  medicalHistory.surgeries.push(newSurgery);

  await medicalHistory.save();

  res.status(201).json({
    success: true,
    data: medicalHistory.surgeries.slice(-1)[0],
  })
};


/**
 * @desc    Add a hospitalization record
 * @route   POST /api/medical-history/hospitalizations
 * @access  Private (Doctor)
 */
export const addHospitalization = async (req, res) => {
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
    dischargeSummary,
    source: DATA_SOURCE.PATIENT,
    addedBy: patient._id
  };

  if (dischargeDate && new Date(dischargeDate) < new Date(newHospitalization.admissionDate)) {
    throw ServerError.badRequest("Discharge date must be after admission date");
  }

  medicalHistory.hospitalizations.push(newHospitalization);

  await medicalHistory.save();

  res.status(201).json({
    success: true,
    data: medicalHistory.hospitalizations.slice(-1)[0],
  });
};