import Doctor from "../../models/doctors/doctor.model.js";
import User from "../../models/user.model.js";
import { hashUtil } from "../../utils/index.js";
import ServerError from "../../utils/ServerError.js";
import { uploadImageCloud } from "../../config/cloudinary.config.js";
import Patient from "../../models/patient/patient.model.js";
import axios from "axios";
import Appointment from "../../models/appointment/appointment.model.js";
import env from "../../config/env.config.js";

// 1. List Doctors with Pagination
export const listDoctors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await Doctor.countDocuments();

    // Get doctors with pagination
    const doctors = await Doctor.find()
      .populate("userId", "email isActive")
      .select(
        "firstName lastName specialization phoneNumber createdAt profilePhoto"
      )
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: doctors.map((doc) => ({
        _id: doc._id,
        fullName: `${doc.firstName} ${doc.lastName}`,
        email: doc.userId.email,
        specialization: doc.specialization,
        phoneNumber: doc.phoneNumber,
        isActive: doc.userId.isActive,
        createdAt: doc.createdAt,
        profilePhoto: doc.profilePhoto,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to list doctors", error);
  }
};

// 2. Add New Doctor
export const addNewDoctor = async (req, res) => {
  try {
    const { email, password, paymentDetails, ...doctorData } = req.body;

      // Parse paymentDetails if it's a string (from multipart/form-data)
    let parsedPaymentDetails = paymentDetails;
    if (typeof paymentDetails === "string") {
      try {
        parsedPaymentDetails = JSON.parse(paymentDetails);
      } catch {
        parsedPaymentDetails = {};
      }
    }

    // 1. Validate required payment details
    if (
      !parsedPaymentDetails ||
      !parsedPaymentDetails.bankName ||
      !parsedPaymentDetails.accountNumber ||
      !parsedPaymentDetails.businessName ||
      !parsedPaymentDetails.bankCode
    ) {
      // Require bankCode
      throw ServerError.badRequest(
        "Payment details (bankName, accountNumber, businessName, bankCode) are required"
      );
    }

    // 2. Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ServerError.conflict("Email already exists");
    }

    // 3. Hash password
    const hashedPassword = await hashUtil.hashPassword(password);

    // 4. Create User first (without doctor dependency)
    const user = new User({
      email,
      password: hashedPassword,
      role: "doctor",
      isActive: true,
      isEmailVerified: true,
      isProfileCompleted: false, // Will be true after doctor creation
      isPhoneVerified: true,
      isApproved: true,
      isPasswordSet: true,
    });

    await user.save();

    // 5. Handle image uploads
    let uploadedFiles = {};
    if (req.files) {
      try {
        const { profilePhoto, boardCertificationsDocument, educationDocument } =
          req.files;

        if (profilePhoto) {
          const profilePhotoResult = await uploadImageCloud(
            profilePhoto[0].path,
            "doctors/profile"
          );
          uploadedFiles.profilePhoto = profilePhotoResult.secure_url;
          uploadedFiles.profilePhotoId = profilePhotoResult.public_id;
        }

        if (boardCertificationsDocument) {
          const boardCertResult = await uploadImageCloud(
            boardCertificationsDocument[0].path,
            "doctors/certifications"
          );
          uploadedFiles.boardCertificationsDocument =
            boardCertResult.secure_url;
        }

        if (educationDocument) {
          const educationDocResult = await uploadImageCloud(
            educationDocument[0].path,
            "doctors/education"
          );
          uploadedFiles.educationDocument = educationDocResult.secure_url;
        }
      } catch (uploadError) {
        console.error("File upload failed:", uploadError);
        await User.findByIdAndDelete(user._id);
        throw ServerError.internal("Failed to upload doctor documents");
      }
    }

    // 6. Create Chapa subaccount (with transaction safety)
    let chapaSubaccountId;
    try {
      const chapaResponse = await axios.post(
        "https://api.chapa.co/v1/subaccount",
        {
          business_name: parsedPaymentDetails.businessName,
          account_name:
            parsedPaymentDetails.accountName ||
            parsedPaymentDetails.businessName,
          bank_code: parsedPaymentDetails.bankCode, // Must be present
          bank_name: parsedPaymentDetails.bankName,
          account_number: parsedPaymentDetails.accountNumber,
          account_type: parsedPaymentDetails.accountType || "business",
          split_type: "percentage",
          split_value: 0.8, // 95% to doctor, 5% to platform
        },
        {
          headers: {
            Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (!chapaResponse.data?.id) {
        throw new Error("Invalid response from Chapa API");
      }
      chapaSubaccountId = chapaResponse.data.id;
    } catch (chapaError) {
      console.error(
        "Chapa subaccount creation failed:",
        chapaError.response?.data || chapaError.message
      );
      await User.findByIdAndDelete(user._id);

      if (chapaError.response?.status === 400) {
        throw ServerError.badRequest(
          "Invalid payment details provided to Chapa"
        );
      }
      throw ServerError.internal("Payment system temporarily unavailable");
    }

    // 7. Parse and validate doctor data
    const parsedDoctorData = {
      ...doctorData,
      qualifications: parseQualifications(doctorData.qualifications),
      hospitalAddress: parseHospitalAddress(doctorData.hospitalAddress),
      languages: parseLanguages(doctorData.languages),
      verificationStatus: true,
      isActive: true,
      isProfileCompleted: true,
    };

    // 8. Create Doctor Profile
    const doctor = new Doctor({
      userId: user._id,
      ...parsedDoctorData,
      ...uploadedFiles,
      paymentDetails: {
        ...parsedPaymentDetails,
        chapaSubaccountId,
        isVerified: true,
      },
      approvedAt: new Date(),
    });

    await doctor.save();

    // 9. Update user profile completion status
    await User.findByIdAndUpdate(user._id, { isProfileCompleted: true });

    res.status(201).json({
      success: true,
      data: {
        doctor: formatDoctorResponse(doctor),
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    console.error("Doctor creation error:", error);
    if (error instanceof ServerError) {
      throw error;
    }
    throw ServerError.internal("Failed to create doctor");
  }
};

// Helper functions
function parseQualifications(qualifications) {
  if (Array.isArray(qualifications)) return qualifications;
  try {
    return JSON.parse(qualifications || "[]");
  } catch {
    return [];
  }
}

function parseHospitalAddress(address) {
  if (typeof address === "object") return address;
  try {
    return JSON.parse(address || "{}");
  } catch {
    return {};
  }
}

function parseLanguages(languages) {
  if (Array.isArray(languages)) return languages;
  if (typeof languages === "string") {
    try {
      const parsed = JSON.parse(languages);
      return Array.isArray(parsed)
        ? parsed
        : languages
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);
    } catch {
      return languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function formatDoctorResponse(doctor) {
  return {
    id: doctor._id,
    fullName: `${doctor.firstName} ${doctor.lastName}`,
    specialization: doctor.specialization,
    // Add other necessary fields
  };
}

function formatUserResponse(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

// 3. Get Doctor for Edit
export const getDoctorForEdit = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.id }).populate(
      "userId",
      "email"
    );

    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    res.json({
      success: true,
      data: {
        email: doctor.userId.email,
        ...doctor.toObject(),
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to get doctor details", error);
  }
};

// 4. Update Doctor
export const updateDoctor = async (req, res) => {
  try {
    const { email, ...doctorData } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    // Update User (email only)
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: doctor.userId },
      });
      if (existingUser) {
        throw ServerError.conflict("Email already exists");
      }

      await User.findByIdAndUpdate(doctor.userId, {
        email,
        isEmailVerified: false, // Reset on email change
      });
    }

    // Handle file uploads if files are present
    if (req.files) {
      const { profilePhoto, boardCertificationsDocument, educationDocument } =
        req.files;

      if (profilePhoto) {
        const profilePhotoResult = await uploadImageCloud(
          profilePhoto[0].path,
          "doctors/profile"
        );
        doctorData.profilePhoto = profilePhotoResult.secure_url;
        doctorData.profilePhotoId = profilePhotoResult.public_id;
      }

      if (boardCertificationsDocument) {
        const boardCertResult = await uploadImageCloud(
          boardCertificationsDocument[0].path,
          "doctors/certifications"
        );
        doctorData.boardCertificationsDocument = boardCertResult.secure_url;
      }

      if (educationDocument) {
        const educationDocResult = await uploadImageCloud(
          educationDocument[0].path,
          "doctors/education"
        );
        doctorData.educationDocument = educationDocResult.secure_url;
      }
    }

    // Update Doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      doctorData,
      { new: true }
    ).populate("userId", "email isActive");

    res.json({
      success: true,
      data: updatedDoctor,
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to update doctor", error);
  }
};

// 5. Toggle Active Status
export const toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    const user = await User.findByIdAndUpdate(
      doctor.userId,
      { isActive: req.body.isActive },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        message: `Doctor ${user.isActive ? "activated" : "deactivated"}`,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to update doctor status", error);
  }
};

// 6. View Full Profile (Read-only)
export const viewDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "userId",
      "email isActive"
    );

    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to get doctor profile", error);
  }
};

// 7. Delete Doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      throw ServerError.notFound("Doctor not found");
    }

    // Delete associated user
    await User.findByIdAndDelete(doctor.userId);

    // Delete doctor profile
    await Doctor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {
        message: "Doctor deleted successfully",
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to delete doctor", error);
  }
};

// User Management Controllers

// 1. List Users with Pagination (Patients only)
export const listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      status = "all",
    } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Build query - only patients
    const query = { role: "patient" };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }
    if (status !== "all") {
      query.isActive = status === "active";
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get patient details for each user
    const patientsWithDetails = await Promise.all(
      users.map(async (user) => {
        const patient = await Patient.findOne({ user: user._id }).select(
          "firstName middleName lastName profileImage gender phone bloodType dateOfBirth emergencyContact location maritalStatus preferredLanguage"
        );

        return {
          ...user.toObject(),
          patientDetails: patient || {},
        };
      })
    );

    res.json({
      success: true,
      data: patientsWithDetails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to list patients", error);
  }
};

// 2. Get User Details (Patient)
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      throw ServerError.notFound("Patient not found");
    }

    if (user.role !== "patient") {
      throw ServerError.forbidden(
        "Access denied. This endpoint is for patients only."
      );
    }

    // Get patient details
    const patient = await Patient.findOne({ user: user._id }).select(
      "firstName middleName lastName profileImage gender phone bloodType dateOfBirth emergencyContact location maritalStatus preferredLanguage"
    );

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        patientDetails: patient || {},
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to get patient details", error);
  }
};

// 3. Update User (Patient)
export const updateUser = async (req, res) => {
  try {
    const { email, ...userData } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      throw ServerError.notFound("Patient not found");
    }

    if (user.role !== "patient") {
      throw ServerError.forbidden(
        "Access denied. This endpoint is for patients only."
      );
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        throw ServerError.conflict("Email already exists");
      }
      userData.email = email;
      userData.isEmailVerified = false; // Reset email verification on email change
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.params.id, userData, {
      new: true,
    }).select("-password");

    // Update patient details if provided
    if (req.body.patientDetails) {
      const patientData = {
        firstName: req.body.patientDetails.firstName,
        middleName: req.body.patientDetails.middleName,
        lastName: req.body.patientDetails.lastName,
        gender: req.body.patientDetails.gender,
        phone: req.body.patientDetails.phone,
        bloodType: req.body.patientDetails.bloodType,
        dateOfBirth: req.body.patientDetails.dateOfBirth,
        emergencyContact: req.body.patientDetails.emergencyContact,
        location: req.body.patientDetails.location,
        maritalStatus: req.body.patientDetails.maritalStatus,
        preferredLanguage: req.body.patientDetails.preferredLanguage,
      };

      await Patient.findOneAndUpdate(
        { user: user._id },
        { $set: patientData },
        { new: true, upsert: true }
      );
    }

    // Get updated patient details
    const patient = await Patient.findOne({ user: user._id }).select(
      "firstName middleName lastName profileImage gender phone bloodType dateOfBirth emergencyContact location maritalStatus preferredLanguage"
    );

    res.json({
      success: true,
      data: {
        ...updatedUser.toObject(),
        patientDetails: patient || {},
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to update patient", error);
  }
};

// 4. Toggle User Status (Patient)
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw ServerError.notFound("Patient not found");
    }

    if (user.role !== "patient") {
      throw ServerError.forbidden(
        "Access denied. This endpoint is for patients only."
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !user.isActive },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      data: {
        message: `Patient ${
          updatedUser.isActive ? "activated" : "deactivated"
        }`,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to update patient status", error);
  }
};

// 5. Delete User (Patient)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw ServerError.notFound("Patient not found");
    }

    if (user.role !== "patient") {
      throw ServerError.forbidden(
        "Access denied. This endpoint is for patients only."
      );
    }

    // Delete patient details first
    await Patient.findOneAndDelete({ user: user._id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {
        message: "Patient deleted successfully",
      },
    });
  } catch (error) {
    if (error instanceof ServerError) throw error;
    throw ServerError.internal("Failed to delete patient", error);
  }
};

export const listAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      date,
      search,
      sortField = "date",
      sortOrder = "desc",
    } = req.query;

    // Build the base query
    let query = Appointment.find().populate("patient").populate("doctor");

    // Apply status filter if provided
    if (status) {
      query = query.where("status", status);
    }

    // Apply date filter if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query = query.where("date").gte(startDate).lte(endDate);
    }

    // Apply search filter if provided (search by patient or doctor name)
    if (search && search.length >= 2) {
      const searchRegex = new RegExp(search, "i");
      query = query.or([
        { "patient.firstName": searchRegex },
        { "doctor.lastName": searchRegex },
      ]);
    }

    // Apply sorting
    const sort = {};
    if (sortField) {
      sort[sortField] = sortOrder === "desc" ? -1 : 1;
    }
    query = query.sort(sort);

    // Get total count for pagination
    const total = await Appointment.countDocuments(query.getFilter());

    // Apply pagination
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(Number(limit));

    const appointments = await query.exec();

    res.json({
      appointments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching appointments",
      error: error.message,
    });
  }
};

export const getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate("patient")
      .populate("doctor")
      .lean();

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Format date for easier frontend display
    if (appointment.date) {
      appointment.formattedDate = new Date(appointment.date)
        .toISOString()
        .split("T")[0];
    }

    res.json({ appointment });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching appointment details",
      error: error.message,
    });
  }
};

export const getBanks = async (req, res) => {
  try {
      const banks = await axios.get("https://api.chapa.co/v1/banks", {
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
        accept: "application/json",
      },
    });
    return res.json({banks : banks?.data?.data || []});
  } catch {
    res.status(500).json({
      message: "There is no banks go find ur banks banks ass",
      error: error.message,
    });
  }
};
