import Patient from "../models/patient/patient.model.js";
import User from "../models/user.model.js";
import ServerError from "../utils/ServerError.js";

/**
 * @desc Create a new patient profile linked to an existing user.
 * @route POST /api/patients/profiles
 * @access Private (Requires user authentication)
 */
export const createPatientProfile = async (req, res) => {
  const {
    name,
    gender,
    phone,
    dob,
    location,
    emergencyContact,
    insurance,
    preferredLanguage,
    martialStatus,
    bloodType,
    profileImage,
    notificationPreference,
  } = req.body;

  const { sub: userId } = req.user;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw ServerError.conflict(`User with ID ${userId} not found.`);
  }

  // Check if a patient profile already exists for this user
  const existingPatientProfile = await Patient.findOne({ user: userId });

  if (existingPatientProfile) {
    throw ServerError.conflict(
      `Patient profile already exists for user ID ${userId}.`
    );
  }

  // Basic date validation (more robust validation can be added)
  const parsedDob = new Date(dob);

  if (isNaN(parsedDob.getTime()) || parsedDob >= new Date()) {
    throw ServerError.badRequest("Invalid date of birth.");
  }

  console.log(req.user, user);

  // Create the patient profile
  const patientProfile = await Patient.create({
    user: userId,
    name,
    gender,
    phone,
    dob: parsedDob,
    location: {
      locationType: location.locationType,
      country: location.country,
      city: location.city,
      address: location.address,
      postalCode: location.postalCode,
      state: location.state,
      coordinates: location.coordinates,
    },
    emergencyContact: emergencyContact,
    insurance: insurance,
    preferredLanguage,
    martialStatus,
    bloodType,
    profileImage,
    notificationPreference: {
      systemNotification: notificationPreference?.systemNotification ?? true,
      emailNotification: notificationPreference?.emailNotification ?? false,
      smsNotification: notificationPreference?.smsNotification ?? true,
    },
  });

  if (patientProfile) {
    user.isProfileCompleted = true;
    await user.save();

    res.status(201).json({
      ...patientProfile.toObject(),
      dob: patientProfile.dob.toISOString().split("T")[0],
    });
  } else {
    res.status(500);
    throw new Error("Failed to create patient profile.");
  }
};

export const getProfile = async (req, res) => {
  const { sub: userId } = req.user;
  
  let user = await User.findById(userId);
  if(!user) throw ServerError.notFound("user not found")
  let patient = await Patient.findOne({ user: userId });

  if (!patient || !patient.user) throw ServerError.notFound("profile not found");

  res.json({
    success: true,
    data: {
      user: patient,
    },
  });
};
