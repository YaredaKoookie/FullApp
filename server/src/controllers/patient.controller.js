import Patient from "../models/patient/patient.model.js";
import User from "../models/user.model.js";
import ServerError from "../utils/ServerError.js";
import Doctor from "../models/doctors/doctor.model.js"
import Appointment from "../models/appointment/appointment.model.js";

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

export const updateProfile = async (req, res) => {
  const {sub: userId} = req.user;

  const patient = await Patient.findOne({user: userId});

  if(!patient) throw ServerError("Profile not found");

  await patient.updateOne(req.body);

  res.json({
    success: true,
    message: "profile updated",
    data: {
      patient
    }
  })
}

export const bookAppointment = async (req, res) => {
  const {slot, reason, appointmentApp } = req.body;
  const doctorId = req.params.doctorId;

  const patient = await Patient.findOne({user: req.user.sub}).populate("user");
  console.log("patient", patient);

  if(!patient) throw ServerError.notFound("Patient profile not found");

  if(!patient.user.isProfileCompleted)
    throw ServerError.badRequest("Complete your profile to book an appointment");

  const doctor = await Doctor.findById(doctorId);
  
  console.log("doctor", doctor);
  if(!doctor || doctor.approvalStatus !== "approved")
    throw ServerError.notFound("Doctor not found or not approved");
  
  
  const {start, end} = slot;

  const startTime =  new Date(start);
  const endTime = new Date(end);

  if(startTime >= endTime)
    throw ServerError.badRequest("end time must be after start time");

  if(startTime > (new Date()))
    throw ServerError.badRequest("Appointment start time can not be in the past");

  const dayOfWeek = startTime.getDay().toString();
  const availability = doctor.weeklyAvailability.get(dayOfWeek);

  if(!availability)
    throw ServerError.badRequest("Doctor is not available on selected day.");
// 681b94302a3f468306cd9d1b

  const isWithinAvailability = startTime >= availability.start && endTime <= availability.end;

  if(!isWithinAvailability)
   throw ServerError.badRequest("Selected time slot is outside the doctor availability hours.");

  const isOverlappingAppointment = await Appointment.findOne({
    doctor: doctorId,
    slot,
    status: {$in: ["scheduled", "confirmed"]},
    "slot.start": {$lt: endTime},
    "slot.end": {$gt: startTime}
  })

  if(!isOverlappingAppointment) 
    throw ServerError.badRequest("Selected slot is not available");

  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    slot,
    reason,
    status: "pending"
  });


  res.json({
    success: true, 
    message: "appointment created successfully",
    data: {
      appointment
    }
  })
}

export const getPatientAppointments = async (req, res) => {
  const userId = req.user.sub;

  const patient = await Patient.findOne({user: userId});
  if(!patient) throw ServerError.notFound("Patient profile not found");
  const appointments = await Appointment.find({patient: patient._id}).populate("doctor", "fullName specialization").sort({createdAt: -1});

  res.json({
    success: true, 
    data: {
      appointments
    }
  })
}
