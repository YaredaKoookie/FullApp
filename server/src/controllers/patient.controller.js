import Patient, { phoneRegex } from "../models/patient/patient.model.js";
import User from "../models/user.model.js";
import ServerError from "../utils/ServerError.js";
import Doctor from "../models/doctors/doctor.model.js";
import Appointment from "../models/appointment/appointment.model.js";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import logger from "../utils/logger.util.js";
import { deleteImage, uploadImageCloud } from "../config/cloudinary.config.js";
/**
 * @desc Create a new patient profile linked to an existing user.
 * @route POST /api/patients/profiles
 * @access Private (Requires user authentication)
 */
export const createPatientProfile = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      'firstName', 'middleName', 'lastName', 'gender', 
      'phone', 'dateOfBirth', 'location', 'emergencyContact'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw ServerError.badRequest(`Missing required field: ${field}`);
      }
    }

    const {
      firstName,
      middleName,
      lastName,
      gender,
      phone,
      dateOfBirth,
      location,
      emergencyContact,
      insurance = [],
      preferredLanguage = 'English',
      martialStatus = '',
      bloodType = '',
      notificationPreference = {},
    } = req.body;

    const { sub: userId } = req.user;

    // Validate user exists and doesn't have a profile
    const [user, existingPatientProfile] = await Promise.all([
      User.findById(userId),
      Patient.findOne({ user: userId })
    ]);

    if (!user) {
      throw ServerError.notFound(`User with ID ${userId} not found.`);
    }

    if (existingPatientProfile) {
      throw ServerError.conflict('Patient profile already exists');
    }

    // Validate date of birth
    const parsedDob = new Date(dateOfBirth);
    if (isNaN(parsedDob.getTime())) {
      throw ServerError.badRequest('Invalid date format for date of birth');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDob >= today) {
      throw ServerError.badRequest('Date of birth must be in the past');
    }

    // Validate phone number format
    if (!phoneRegex.test(phone)) {
      throw ServerError.badRequest('Invalid phone number format');
    }

    // Validate emergency contacts
    if (!Array.isArray(emergencyContact) || emergencyContact.length === 0) {
      throw ServerError.badRequest('At least one emergency contact is required');
    }

    // Process image upload if exists
    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
        const uploadResult = await uploadImageCloud(req.file.path, "patientsProfile");
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.public_id;
    }

    // Create patient profile
    const patientProfile = await Patient.create({
      user: userId,
      firstName,
      middleName,
      lastName,
      gender,
      phone,
      dateOfBirth: parsedDob,
      location: {
        locationType: location.locationType || 'home',
        country: location.country,
        city: location.city,
        address: location.address || '',
        postalCode: location.postalCode || '',
        state: location.state || '',
        coordinates: {
        type: "Point",
        coordinates: location.coordinates || [0, 0],
        }
      },
      emergencyContact: emergencyContact.map(contact => ({
        name: contact.name,
        relation: contact.relation,
        phone: contact.phone,
        email: contact.email || '',
      })),
      insurance: insurance.map(ins => ({
        provider: ins.provider,
        policyNumber: ins.policyNumber,
        coverageDetails: ins.coverageDetails || '',
        validTill: ins.validTill || null,
        status: ins.status || 'active',
      })),
      preferredLanguage,
      martialStatus,
      bloodType,
      profileImage: imageUrl,
      profileImageId: imagePublicId,
      notificationPreference: {
        systemNotification: notificationPreference.systemNotification !== false, // default true
        emailNotification: !!notificationPreference.emailNotification, // default false
        smsNotification: notificationPreference.smsNotification !== false, // default true
      },
    });

    // Update user profile completion status
    user.isProfileCompleted = true;
    await user.save();

    // Prepare response
    const responseProfile = patientProfile.toObject();
    responseProfile.dateOfBirth = responseProfile.dateOfBirth.toISOString().split('T')[0];

    res.status(201).json({
      success: true, 
      data: {
        patient: responseProfile,
       accessToken: generateAccessToken(user)
      }
    });

  } catch (error) {
    // Clean up uploaded file if error occurred after upload
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }

    // Handle known errors
    if (error instanceof ServerError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    // Handle unexpected errors
    console.error('Error creating patient profile:', error);
    res.status(500).json({ message: 'Internal server error' });
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

  // Find the patient associated with the user
  let patient = await Patient.findOne({ user: userId });

  if (!patient) throw ServerError.notFound("Profile not found");

  console.log("body update", req.body);

  // Only update specific fields from req.body to prevent unwanted changes
  const updatedPatient = await Patient.findByIdAndUpdate(
    patient._id, // Find by the patient's id
    req.body, // Fields to update
    {
      new: true, // Return the updated document
      runValidators: true, // Apply validation rules
    }
  );

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
  const { sub, role } = req.user;

  const patient = await Patient.findOne({ user: sub });

  if (!patient) throw ServerError.notFound("patient profile not found");

  if (!req.file) throw ServerError.badRequest("No file provided to upload");

  // let oldImagePath = null;
  // let newImagePath = null;

  if (patient.profileImageId) {
    await deleteImage(patient.profileImageId);
    // oldImagePath = path.join("public", patient.profileImage);
  }

  const uploadResult = await uploadImageCloud(req.file.path, "patientsProfile");

  // const fileId = crypto.randomUUID().toString("hex");
  // const filePath = "/uploads/patients";
  // const fileName = `${fileId}.webp`;
  // const uploadPath = path.join("public", filePath, fileName);

  // await sharp(req.file.buffer)
  //   .resize(500, 500)
  //   .webp({ quality: 80 })
  //   .toFile(uploadPath);

  // newImagePath = `${filePath}/${fileName}`;
  // req.body.profileImage = newImagePath;

  const updatePatient = await Patient.findByIdAndUpdate(
    patient._id, // Find by the patient's id
    { profileImage: uploadResult.url, profileImageId: uploadResult.public_id }, // Fields to update
    {
      new: true, // Return the updated document
      runValidators: true, // Apply validation rules
    }
  );

  // if (oldImagePath) {
  //   fs.unlink(oldImagePath, (err) => {
  //     if (err) {
  //       logger.error("Unable to delete old image:", err);
  //     }
  //   });
  // }

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

/**
 * @desc    Get all approved doctors with advanced filtering
 * @route   GET /api/doctors/approved
 * @access  Public
 */
export const getApprovedDoctors = async (req, res) => {
  try {
    // Extract query parameters
    const {
      search,
      specialization,
      minExperience,
      maxExperience,
      minFee,
      maxFee,
      minRating,
      gender,
      languages,
      serviceAreas,
      city,
      state,
      country,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build the base query for approved doctors
    let query = {
      verificationStatus: "verified",
      isActive: true,
    };

    // Text search (across name fields)
    if (search) {
      query.$text = { $search: search };
    }

    // Specialization filter
    if (specialization) {
      query.specialization = new RegExp(specialization, "i");
    }

    // Experience range filter
    if (minExperience || maxExperience) {
      query.yearsOfExperience = {};
      if (minExperience) query.yearsOfExperience.$gte = Number(minExperience);
      if (maxExperience) query.yearsOfExperience.$lte = Number(maxExperience);
    }

    // Fee range filter
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee);
      if (maxFee) query.consultationFee.$lte = Number(maxFee);
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Gender filter
    if (gender) {
      query.gender = gender.toLowerCase();
    }

    // Language filter (array - can match any of provided languages)
    if (languages) {
      const langArray = languages
        .split(",")
        .map((lang) => lang.trim().toLowerCase());
      query.languages = { $in: langArray };
    }

    // Service areas filter (array - can match any of provided areas)
    if (serviceAreas) {
      const areasArray = serviceAreas
        .split(",")
        .map((area) => area.trim().toLowerCase());
      query.serviceAreas = { $in: areasArray };
    }

    // Location filters
    if (city) query["location.city"] = new RegExp(city, "i");
    if (state) query["location.state"] = new RegExp(state, "i");
    if (country) query["location.country"] = new RegExp(country, "i");

    // Sorting options
    let sortOption = {};
    if (sort) {
      const sortFields = sort.split(",");
      sortFields.forEach((field) => {
        const [key, order] = field.split(":");
        sortOption[key] = order === "desc" ? -1 : 1;
      });
    } else {
      // Default sort by rating descending
      sortOption = { rating: -1 };
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Execute query with pagination and sorting
    const doctors = await Doctor.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .populate("userId", "email") // Include basic user info
      .populate("schedule"); // Include schedule info

    // Get total count for pagination info
    const total = await Doctor.countDocuments(query);

    // Prepare response
    res.json({
      success: true,
      data: {
        doctors,
      },
      pagination: {
        totalDoctors: total,
        currentPage: pageNumber,
        limit: doctors.length,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching approved doctors:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching doctors",
      error: error.message,
    });
  }
};

export const getDoctorStatistics = async (req, res) => {
  try {
    const matchStage = {
      verificationStatus: "verified",
      isActive: true,
    };

    const [
      specializations,
      experienceRanges,
      feeRanges,
      ratingDistribution,
      languageDistribution,
      locationDistribution,
      totalCounts,
      verifiedCounts,
      averages,
    ] = await Promise.all([
      Doctor.aggregate([
        { $match: matchStage },
        { $group: { _id: "$specialization", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      Doctor.aggregate([
        { $match: matchStage },
        {
          $bucket: {
            groupBy: "$yearsOfExperience",
            boundaries: [0, 5, 10, 15, 20, 30, 50],
            default: "50+",
            output: { count: { $sum: 1 } },
          },
        },
        {
          $project: {
            range: {
              $concat: [{ $toString: "$_id" }, " years"],
            },
            count: 1,
          },
        },
      ]),
      Doctor.aggregate([
        { $match: matchStage },
        {
          $bucket: {
            groupBy: "$consultationFee",
            boundaries: [0, 50, 100, 150, 200, 300, 500],
            default: "500+",
            output: { count: { $sum: 1 } },
          },
        },
        {
          $project: {
            range: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 0] }, then: "$0-$50" },
                  { case: { $eq: ["$_id", 50] }, then: "$50-$100" },
                  { case: { $eq: ["$_id", 100] }, then: "$100-$150" },
                  { case: { $eq: ["$_id", 150] }, then: "$150-$200" },
                  { case: { $eq: ["$_id", 200] }, then: "$200-$300" },
                  { case: { $eq: ["$_id", 300] }, then: "$300-$500" },
                  { case: { $eq: ["$_id", "500+"] }, then: "$500+" },
                ],
                default: "Other",
              },
            },
            count: 1,
          },
        },
      ]),
      Doctor.aggregate([
        { $match: matchStage },
        {
          $project: {
            roundedRating: {
              $divide: [
                { $multiply: { $round: { $multiply: ["$rating", 2] } } },
                2,
              ],
            },
          },
        },
        { $group: { _id: "$roundedRating", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      Doctor.aggregate([
        { $match: matchStage },
        { $unwind: "$languages" },
        { $group: { _id: "$languages", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      Doctor.aggregate([
        { $match: matchStage },
        { $group: { _id: "$location.city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      Doctor.countDocuments(matchStage),
      Doctor.countDocuments({ verificationStatus: "verified" }),

      Doctor.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            avgFee: { $avg: "$consultationFee" },
            avgExperience: { $avg: "$yearsOfExperience" },
          },
        },
      ]),
    ]);

    const result = {
      specializations: specializations.map((s) => ({
        _id: s._id,
        count: s.count,
      })),
      experienceRanges: experienceRanges.map((r) => ({
        range: r.range,
        count: r.count,
      })),
      feeRanges: feeRanges.map((r) => ({
        range: r.range,
        count: r.count,
      })),
      ratingDistribution: ratingDistribution.map((r) => ({
        rating: r._id,
        count: r.count,
      })),
      languageDistribution: languageDistribution.map((l) => ({
        language: l._id,
        count: l.count,
      })),
      locationDistribution: locationDistribution.map((l) => ({
        city: l._id,
        count: l.count,
      })),
      totalDoctors: totalCounts,
      verifiedDoctors: verifiedCounts,
      averageRating: averages[0]?.avgRating
        ? parseFloat(averages[0].avgRating.toFixed(2))
        : 0,
      averageFee: averages[0]?.avgFee
        ? parseFloat(averages[0].avgFee.toFixed(2))
        : 0,
      averageExperience: averages[0]?.avgExperience
        ? parseFloat(averages[0].avgExperience.toFixed(1))
        : 0,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching doctor statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor statistics",
      error: error.message,
    });
  }
};

export const getApprovedDoctorById = async (req, res) => {
  if (!req.params.doctorId)
    throw ServerError.badRequest("doctor id is not provided");

  const query = {
    _id: req.params.doctorId,
    verificationStatus: "verified",
  };
  console.log(query)

  const doctor = await Doctor.findOne(query);
  // .select(
  //   "-licenseNumber -licenseDocument -idProof -withdrawalBalance -adminRemarks -applicationNotes"
  // );
  if (!doctor) throw ServerError.notFound("Doctor doesn't exist");

  res.json({
    success: true,
    data: {
      doctor,
    },
  });
};
