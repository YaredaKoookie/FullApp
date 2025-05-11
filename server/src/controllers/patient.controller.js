import Patient from "../models/patient/patient.model.js";
import User from "../models/user.model.js";
import ServerError from "../utils/ServerError.js";
import Doctor from "../models/doctors/doctor.model.js";
import Appointment from "../models/appointment/appointment.model.js";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import logger from "../utils/logger.util.js";
/**
 * @desc Create a new patient profile linked to an existing user.
 * @route POST /api/patients/profiles
 * @access Private (Requires user authentication)
 */
export const createPatientProfile = async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    gender,
    phone,
    dateOfBirth,
    location,
    emergencyContact,
    insurance,
    preferredLanguage,
    martialStatus,
    bloodType,
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
    throw ServerError.conflict(`Patient profile already exists.`);
  }

  // Basic date validation (more robust validation can be added)
  const parsedDob = new Date(dateOfBirth);
  console.log(parsedDob);
  if (isNaN(parsedDob.getTime()) || parsedDob >= new Date()) {
    throw ServerError.badRequest("Invalid date of birth.");
  }

  let profileImage = null;

  if (req.file) {
    const fileId = crypto.randomUUID().toString("hex");
    const filePath = "/uploads/patients";
    const fileName = `${fileId}.webp`;
    const uploadPath = path.join("public", filePath, fileName);

    await sharp(req.file.buffer)
      .resize(500, 500)
      .webp({ quality: 80 })
      .toFile(uploadPath);

    profileImage = `${filePath}/${fileName}`;
  }

  // Create the patient profile
  const patientProfile = await Patient.create({
    user: userId,
    firstName,
    middleName,
    lastName,
    gender,
    phone,
    dateOfBirth: parsedDob,
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

    await patientProfile.populate("user", "email isProfileCompleted");

    res.status(201).json({
      ...patientProfile.toObject(),
      dateOfBirth: patientProfile.dateOfBirth.toISOString().split("T")[0],
    });
  } else {
    res.status(500);
    throw new Error("Failed to create patient profile.");
  }
};

export const getProfile = async (req, res) => {
  const { sub: userId } = req.user;

  let user = await User.findById(userId);
  if (!user) throw ServerError.notFound("user not found");
  let patient = await Patient.findOne({ user: userId });

  if (!patient || !patient.user)
    throw ServerError.notFound("profile not found");

  res.json({
    success: true,
    data: {
      user: patient,
    },
  });
};

export const updateProfile = async (req, res) => {
  const { sub: userId } = req.user;

  console.log(req.body);

  // Find the patient associated with the user
  let patient = await Patient.findOne({ user: userId });

  if (!patient) throw ServerError.notFound("Profile not found");

  let oldImagePath = null;
  let newImagePath = null;

  if (req.file) {
    if (patient.profileImage) {
      oldImagePath = path.join("public", patient.profileImage);
    }

    const fileId = crypto.randomUUID().toString("hex");
    const filePath = "/uploads/patients";
    const fileName = `${fileId}.webp`;
    const uploadPath = path.join("public", filePath, fileName);

    await sharp(req.file.buffer)
      .resize(500, 500)
      .webp({ quality: 80 })
      .toFile(uploadPath);

    newImagePath = `${filePath}/${fileName}`;
    req.body.profileImage = newImagePath;
  }

  // Only update specific fields from req.body to prevent unwanted changes
  const updatedPatient = await Patient.findByIdAndUpdate(
    patient._id, // Find by the patient's id
    req.body, // Fields to update
    {
      new: true, // Return the updated document
      runValidators: true, // Apply validation rules
    }
  );

  console.log("oldImagePath", oldImagePath);

  if (oldImagePath) {
    fs.unlink(oldImagePath, (err) => {
      if (err) {
        logger.error("Unable to delete old image:", err);
      }
    });
  }

  // Return the updated patient profile
  res.json({
    success: true,
    message: "Profile updated",
    data: {
      patient: updatedPatient,
    },
  });
};

export const uploadPatientProfileImage = async (req, res, next) => {
  const { sub, role } = req.user.role;

  const patient = await Patient.findOne({ userId: sub });

  if (!patient) throw new ServerError.notFound("patient profile not found");

  if (!req.file) throw new ServerError.badRequest("No file provided to upload");

  let oldImagePath = null;
  let newImagePath = null;

  if (patient.profileImage) {
    oldImagePath = path.join("public", patient.profileImage);
  }

  const fileId = crypto.randomUUID().toString("hex");
  const filePath = "/uploads/patients";
  const fileName = `${fileId}.webp`;
  const uploadPath = path.join("public", filePath, fileName);

  await sharp(req.file.buffer)
    .resize(500, 500)
    .webp({ quality: 80 })
    .toFile(uploadPath);

  newImagePath = `${filePath}/${fileName}`;
  req.body.profileImage = newImagePath;

  const updatePatient = await Patient.findByIdAndUpdate(
    patient._id, // Find by the patient's id
    { profileImage: newImagePath }, // Fields to update
    {
      new: true, // Return the updated document
      runValidators: true, // Apply validation rules
    }
  );

  if (oldImagePath) {
    fs.unlink(oldImagePath, (err) => {
      if (err) {
        logger.error("Unable to delete old image:", err);
      }
    });
}

  res.json({
    success: true,
    message: "Profile image have been changed successfully",
    data: {
      profileImage: updatePatient.profileImage,
    },
  });
};

export const bookAppointment = async (req, res) => {
  const { appointmentType, reason, slot } = req.body;

  const { doctorId } = req.params;

  const patient = await Patient.findOne({ user: req.user.sub });

  if (!patient) throw ServerError.notFound("Patient not found");

  let patientId = patient._id;
  const { start, end } = slot;
  if (!start || !end) {
    throw ServerError.badRequest(
      "Invalid slot structure. Start and end time are required."
    );
  }

  const startTime = new Date(start);
  const endTime = new Date(end);

  if (startTime >= endTime) {
    return res
      .status(400)
      .json({ error: "End time must be after start time." });
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    throw ServerError.notFound("Doctor not found.");
  }

  if (doctor.approvalStatus !== "approved") {
    throw ServerError.badRequest("Doctor is not available for appointments.");
  }

  // Check if the slot is within the doctor's availability
  const selectedDay = startTime.toLocaleDateString("en-US", {
    weekday: "long",
  });
  console.log("selected day", selectedDay);
  console.log("doctor", doctor);

  const dayAvailability = doctor.weeklyAvailability.find(
    (availability) => availability.day === selectedDay
  );

  if (!dayAvailability) {
    throw ServerError.badRequest(`Doctor is not available on ${selectedDay}.`);
  }

  const isSlotAvailable = dayAvailability.slots.some(
    (availableSlot) =>
      startTime >= availableSlot.start && endTime <= availableSlot.end
  );

  if (!isSlotAvailable) {
    throw ServerError.badRequest(
      "The selected time slot is not within the doctor's availability."
    );
  }

  // Check for overlapping appointments for the doctor
  const overlappingAppointment = await Appointment.findOne({
    doctor: doctorId,
    "slot.start": { $lt: endTime },
    "slot.end": { $gt: startTime },
  });

  if (overlappingAppointment) {
    return res.status(400).json({
      error: "The selected time slot is already booked for the doctor.",
    });
  }

  // Create new appointment
  const newAppointment = new Appointment({
    patient: patientId,
    doctor: doctor._id,
    appointmentType,
    reason,
    slot: {
      start: startTime,
      end: endTime,
    },
    status: "pending",
  });

  await newAppointment.save();

  doctor.totalAppointments += 1;
  await doctor.save();

  return res.status(201).json({
    message: "Appointment booked successfully.",
    appointment: newAppointment,
  });
};

export const getPatientAppointments = async (req, res) => {
  const userId = req.user.sub;
  const status = req.body.status;

  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw ServerError.notFound("Patient profile not found");

  const query = { patient: patient._id };
  if (status) query.status = status;

  const appointments = await Appointment.find(query)
    .populate("doctor", "firstName lastName specialization")
    .sort({ createdAt: -1 });

  console.log("appointments", appointments);

  res.json({
    success: true,
    data: {
      appointments,
    },
  });
};

export const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  const { cancellationReason } = req.body;

  const patient = await Patient.findOne({ user: req.user.sub });

  if (!patient) throw ServerError.notFound("Patient not found");

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) throw ServerError.notFound("Appointment not found");

  if (appointment.patient.toString() !== patient._id.toString()) {
    throw ServerError.forbidden("You can only cancel you appointments");
  }

  if (appointment.status === "cancelled" || appointment.status === "completed")
    throw ServerError.badRequest(
      `You Cannot cancel an already ${appointment.status} appointment`
    );

  if (["doctor request", "no-show"].includes(cancellationReason))
    throw ServerError.badRequest(
      "Cancellation reason is not allowed for patient"
    );

  appointment.status = "cancelled";
  appointment.cancellation = {
    reason: cancellationReason || "patient request",
    cancelledBy: patient._id,
    cancelledByRole: "Patient",
    cancelledAt: new Date().toISOString(),
  };

  await appointment.save();

  const doctor = await Doctor.findById(appointment.doctor);

  if (doctor) {
    doctor.totalAppointments -= 1;
    await doctor.save();
  }

  res.json({
    success: true,
    message: "Appointment successfully cancelled",
    data: {
      appointment,
    },
  });
};

// ##### PUBLIC
export const getApprovedDoctors = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    specialization,
    location,
    minRating,
  } = req.query;
  const skip = (page - 1) * limit;

  const query = { approvalStatus: "approved" };

  if (specialization) {
    const specializations = specialization
      .split(",")
      .map((spec) => spec.trim());
    query.specialization = { $in: specializations };
  }

  if (location) query["location.city"] = { $regex: location, $options: "i" };

  if (minRating) query.rating = { $gte: Number(minRating) };
  console.log(query);

  const doctors = await Doctor.find(query)
    .select(
      "-licenseNumber -licenseDocument -idProof -withdrawalBalance -adminRemarks -applicationNotes"
    )
    .skip(skip)
    .limit(Number(limit))
    .sort({ rating: -1, experience: -1 });

  const totalDoctors = await Doctor.countDocuments(query);
  const totalPages = Math.ceil(totalDoctors / limit);

  res.json({
    success: true,
    data: {
      doctors,
    },
    pagination: {
      totalDoctors,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit),
    },
  });
};

export const getApprovedDoctorById = async (req, res) => {
  if (!req.params.doctorId)
    throw ServerError.badRequest("doctor id is not provided");

  const query = {
    _id: req.params.doctorId,
    approvalStatus: "approved",
  };

  const doctor = await Doctor.findOne(query).select(
    "-licenseNumber -licenseDocument -idProof -withdrawalBalance -adminRemarks -applicationNotes"
  );

  if (!doctor) throw ServerError.notFound("Doctor doesn't exist");

  res.json({
    success: true,
    data: {
      doctor,
    },
  });
};
