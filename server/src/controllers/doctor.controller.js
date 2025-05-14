import Doctor from "./../models/doctors/doctor.model";
import User from "../models/user.model";
import Appointment from "../models/appointment/appointment.model";
import Schedule from "../models/schedule/Schedule.model";
import { ServerError } from "../utils";

export const completeProfile = async (req, res) => {
  const { sub: userId } = req.user;
  let doctor = await Doctor.findOne({ userId });
  const user = await User.findById(userId);

  console.log("user", userId, user);
  if (user?.isProfileCompleted && doctor?.verificationStatus !== "rejected") {
    res.status(400);
    throw new Error("Profile already submitted and under review or verified");
  }

  // Destructure form data from req.body
  const {
    firstName,
    middleName,
    lastName,
    gender,
    dateOfBirth,
    specialization,
    qualifications,
    yearsOfExperience,
    hospitalName,
    phoneNumber,
    consultationFee,
    hospitalAddress,
    languages,
    serviceAreas,
    location,
    applicationNotes,
    bio,
  } = req.body;
  const files = {
    profilePhoto: req.files?.profilePhoto?.[0],
    nationalIdFront: req.files?.nationalIdFront?.[0],
    nationalIdBack: req.files?.nationalIdBack?.[0],
    licenseFront: req.files?.licenseFront?.[0],
    licenseBack: req.files?.licenseBack?.[0],
    boardCertificationsDocument: req.files?.boardCertificationsDocument?.[0],
    educationDocument: req.files?.educationDocument?.[0],
  };
  // Validate required files
  const requiredFiles = [
    "nationalIdFront",
    "nationalIdBack",
    "licenseFront",
    "licenseBack",
    "boardCertificationsDocument",
    "educationDocument",
  ];

  for (const field of requiredFiles) {
    if (!files[field]) {
      res.status(400);
      throw new Error(`${field} is required`);
    }
  }

  if (!doctor) {
    doctor = await Doctor.create({
      userId,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      specialization,
      qualifications,
      yearsOfExperience,
      hospitalName,
      phoneNumber,
      consultationFee,
      nationalIdFront: files.nationalIdFront.path,
      nationalIdBack: files.nationalIdBack.path,
      licenseFront: files.licenseFront.path,
      licenseBack: files.licenseBack.path,
      boardCertificationsDocument: files.boardCertificationsDocument.path,
      educationDocument: files.educationDocument.path,
      verificationStatus: "pending",
      languages,
      hospitalAddress,
      serviceAreas,
      location,
      applicationNotes,
      bio,
    });

    user.isProfileCompleted = true;
    await user.save();

    return res.status(201).json({
      message: "Profile submitted successfully. Awaiting admin review.",
      doctor,
    });
  }

  if (doctor.verificationStatus === "rejected") {
    // CASE 3: Profile is rejected, update and resubmit
    Object.assign(doctor, req.body);

    // Handle file updates
    if (profilePhoto) doctor.profilePhoto = profilePhoto.path;
    if (boardCertificationsDocument)
      doctor.boardCertificationsDocument = boardCertificationsDocument.path;
    if (educationDocument) doctor.educationDocument = educationDocument.path;

    doctor.verificationStatus = "pending";
    await doctor.save();

    doctor.autoDeleteAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Set expiry for re-submission
    await doctor.save();

    return res.status(200).json({
      message: "Profile resubmitted for admin review.",
      doctor,
    });
  }

  res.status(400);
  throw new Error("Profile update not allowed");
};



// GET /doctor/profile - Get doctor profile
export const getCurrentDoctor = async (req, res) => {
  try {
    // The authenticated doctor's ID should be in req.user._id (or wherever your auth middleware puts it)
    const doctor = await Doctor.findOne({ userId: req.user.sub })
      .select("-password") // Exclude sensitive fields
      .lean();

    console.log(req.user);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateDoctorProfile = async (req, res) => {
  try {
    const updates = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v -createdAt -updatedAt');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadDoctorProfileImage = async (req, res, next) => {
  try {
    const { sub } = req.user; // Ensure JWT provides 'sub' = userId

    const doctor = await Doctor.findOne({ userId: sub });
    if (!doctor) throw new ServerError.notFound("Doctor profile not found");

    if (!req.file) throw new ServerError.badRequest("No file provided");

    let oldImagePath = null;

    if (doctor.profilePhoto) {
      oldImagePath = path.join("public", doctor.profilePhoto); // fixed 'patient' typo
    }

    const fileId = crypto.randomUUID().toString("hex");
    const filePath = "/uploads/doctors";
    const fileName = `${fileId}.webp`;
    const uploadPath = path.join("public", filePath, fileName);

    await sharp(req.file.buffer)
      .resize(500, 500)
      .webp({ quality: 80 })
      .toFile(uploadPath);

    const newImagePath = `${filePath}/${fileName}`;

    // Update the doctor record
    doctor.profilePhoto = newImagePath;
    await doctor.save();

    // Delete old image if it exists
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          logger.error("Unable to delete old image:", err);
        }
      });
    }

    res
      .status(200)
      .json({ message: "Profile image updated", profilePhoto: newImagePath });
  } catch (error) {
    next(error);
  }
};

///////////////////////////////////

export const getAllApprovedDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(search, "i");
    const matchingUsers = await User.find({
      $or: [{ fullName: searchRegex }],
    }).select("_id");

    const userIds = matchingUsers.map((user) => user._id);
    const query = {
      approvalStatus: "approved",
      $or: [
        { specialization: searchRegex },
        { "location.city": searchRegex },
        { userId: { $in: userIds } },
      ],
    };

    const total = await Doctor.countDocuments(query);
    const doctors = await Doctor.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "fullName profilePicture rating totalAppointments")
      .select("-licenseDocument -idProof -applicationNotes -adminRemarks");

    return res.status(200).json({
      message: "Approved doctors fetched successfully",
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      doctors,
    });
  } catch (err) {
    console.error("Error fetching approved doctors:", err);
    return res.status(500).json({
      message: "An error occurred while fetching approved doctors",
      error: err.message,
    });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findOne({
      _id: id,
      approvalStatus: "approved",
    }).populate("userId", "fullName profilePicture rating totalAppointments");

    if (!doctor) {
      return res
        .status(404)
        .json({ message: "Doctor not found or not approved" });
    }

    return res.status(200).json({
      message: "Doctor profile fetched successfully",
      doctor,
    });
  } catch (err) {
    console.error("Error fetching doctor by ID:", err);
    return res.status(500).json({
      message: "An error occurred while retrieving the doctor profile",
      error: err.message,
    });
  }
};

// export const editProfile = async (req, res) => {
//   try {
//     const { sub: userId } = req.user;
//     const updates = req.body;

//     const allowedFields = [
//       "fullName",
//       "profilePicture",
//       "bio",
//       "hospitalName",
//       "consultationFee",
//       "weeklyAvailability",
//       "applicationNotes",
//       "location",
//     ];

//     const filteredUpdates = {};
//     for (const key of allowedFields) {
//       if (updates[key] !== undefined) {
//         filteredUpdates[key] = updates[key];
//       }
//     }

//     const doctor = await Doctor.findOneAndUpdate(
//       { userId },
//       { $set: filteredUpdates },
//       { new: true }
//     ).populate("userId", "name email");

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor profile not found" });
//     }

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       doctor,
//     });
//   } catch (err) {
//     console.error("Error updating doctor profile:", err);
//     return res.status(500).json({
//       message: "An error occurred while updating your profile",
//       error: err.message,
//     });
//   }
// };

export const deleteAccount = async (req, res) => {
  try {
    const { sub: userId } = req.user;

    console.log(`Doctor with userId ${userId} deleted their account.`);

    const doctor = await Doctor.findOneAndDelete({ userId });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    return res.status(200).json({
      message: "Doctor account deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting doctor account:", err);
    return res.status(500).json({
      message: "An error occurred while deleting the doctor account",
      error: err.message,
    });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const userId = req.user.sub;

    const doctor = await Doctor.findOne({ userId });

    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate("patient", "fullName email profilePicture")
      .sort({ date: -1, "slot.start": 1 });

    return res.status(200).json({
      message: "Appointments fetched successfully",
      appointments,
    });
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    return res.status(500).json({
      message: "An error occurred while fetching appointments",
      error: err.message,
    });
  }
};

export const approveAppointment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const appointmentId = req.params.id;

    const doctor = await Doctor.findOne({ userId });

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or unauthorized" });
    }

    if (appointment.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending appointments can be approved" });
    }

    appointment.status = "confirmed";
    await appointment.save();

    return res.status(200).json({
      message: "Appointment approved successfully",
      appointment,
    });
  } catch (err) {
    console.error("Error approving appointment:", err);
    return res.status(500).json({
      message: "An error occurred while approving the appointment",
      error: err.message,
    });
  }
};

export const declineAppointment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const appointmentId = req.params.id;
    const doctor = await Doctor.findOne({ userId });

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or unauthorized" });
    }

    if (appointment.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending appointments can be declined" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    return res.status(200).json({
      message: "Appointment declined successfully",
      appointment,
    });
  } catch (err) {
    console.error("Error declining appointment:", err);
    return res.status(500).json({
      message: "An error occurred while declining the appointment",
      error: err.message,
    });
  }
};

export const markComplete = async (req, res) => {
  try {
    const userId = req.user.sub;
    const doctor = await Doctor.findOne({ userId });

    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or unauthorized" });
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        message: "Only approved appointments can be marked as complete",
      });
    }
    appointment.status = "completed";
    appointment.completedAt = new Date(); // Mark the completion time
    await appointment.save();

    return res.status(200).json({
      message: "Appointment marked as completed successfully",
      appointment,
    });
  } catch (err) {
    console.error("Error marking appointment as complete:", err);
    return res.status(500).json({
      message: "An error occurred while marking the appointment as complete",
      error: err.message,
    });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const doctor = await Doctor.findOne({ userId });

    const appointmentId = req.params.id;
    const { cancellationReason } = req.body; // Optionally pass a reason for cancellation

    // Find the appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or unauthorized" });
    }

    if (appointment.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a completed appointment" });
    }

    // Update the appointment status to "cancelled"
    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason || "No reason provided"; // Set cancellation reason if provided
    appointment.cancelledAt = new Date(); // Mark the time when cancelled
    await appointment.save();

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (err) {
    console.error("Error canceling appointment:", err);
    return res.status(500).json({
      message: "An error occurred while canceling the appointment",
      error: err.message,
    });
  }
};

function hasOverlappingSlots(slots) {
  for (let i = 0; i < slots.length - 1; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (
        (slots[i].start < slots[j].end && slots[i].end > slots[j].start) ||
        (slots[j].start < slots[i].end && slots[j].end > slots[i].start)
      ) {
        return true;
      }
    }
  }
  return false;
}

////////////////////////////////////////

// const getChats = async (req, res) => {
//   try {
//     const doctorId = req.user.userId;

//     // Find all chats for the doctor by joining the doctorId with appointmentId or chat data
//     const chats = await Chat.find({ doctorId })
//       .populate("patientId", "fullName profilePicture") // Populate patient details (assuming 'patientId' references User model)
//       .populate("appointmentId", "startTime status") // Optionally populate appointment info if you need it
//       .select("messages patientId appointmentId createdAt"); // Only return relevant fields

//     if (!chats.length) {
//       return res
//         .status(404)
//         .json({ message: "No chats found for this doctor" });
//     }

//     return res.status(200).json({
//       message: "Chats fetched successfully",
//       chats,
//     });
//   } catch (err) {
//     console.error("Error fetching chats:", err);
//     return res.status(500).json({
//       message: "An error occurred while fetching chats",
//       error: err.message,
//     });
//   }
// };

// const requestWithdrawal = async (req, res) => {
//   try {
//     const doctorId = req.user.userId;
//     const { amount } = req.body; // The amount the doctor wants to withdraw

//     // Validate that the amount is a positive number
//     if (amount <= 0) {
//       return res
//         .status(400)
//         .json({ message: "Withdrawal amount must be greater than 0" });
//     }

//     // Find the doctor's profile to get their current withdrawal balance
//     const doctor = await Doctor.findOne({ userId: doctorId });

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     // Check if the doctor has enough balance for the withdrawal request
//     if (doctor.withdrawalBalance < amount) {
//       return res
//         .status(400)
//         .json({ message: "Insufficient withdrawal balance" });
//     }

//     // Create a new withdrawal request
//     const withdrawalRequest = new Withdrawal({
//       doctorId,
//       amount,
//       status: "pending", // Assuming the status starts as 'pending'
//       requestedAt: new Date(),
//     });

//     await withdrawalRequest.save();

//     // Update the doctor's withdrawal balance by subtracting the requested amount
//     doctor.withdrawalBalance -= amount;
//     await doctor.save();

//     return res.status(200).json({
//       message: "Withdrawal request submitted successfully",
//       withdrawalRequest,
//     });
//   } catch (err) {
//     console.error("Error processing withdrawal request:", err);
//     return res.status(500).json({
//       message: "An error occurred while processing the withdrawal request",
//       error: err.message,
//     });
//   }
// };

// const getEarnings = async (req, res) => {
//   try {
//     const doctorId = req.user.userId;

//     // Find the doctor's profile to get total earnings
//     const doctor = await Doctor.findOne({ userId: doctorId });

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     // Retrieve the completed appointments for the doctor and calculate total earnings
//     const completedAppointments = await Appointment.find({
//       doctorId,
//       status: "completed",
//     });

//     // Calculate total earnings by summing up the fees for completed appointments
//     const totalEarnings = completedAppointments.reduce(
//       (acc, appointment) => acc + appointment.consultationFee,
//       doctor.totalEarnings
//     );

//     return res.status(200).json({
//       message: "Doctor earnings fetched successfully",
//       totalEarnings,
//     });
//   } catch (err) {
//     console.error("Error fetching doctor earnings:", err);
//     return res.status(500).json({
//       message: "An error occurred while fetching earnings",
//       error: err.message,
//     });
//   }
// };

// const getTransactionHistory = async (req, res) => {
//   try {
//     const doctorId = req.user.userId;

//     // Find the doctor
//     const doctor = await Doctor.findOne({ userId: doctorId });

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     // Fetch the transaction history for the doctor
//     const transactions = await Transaction.find({ doctorId }).sort({
//       date: -1,
//     }); // Sort transactions by date in descending order

//     if (!transactions.length) {
//       return res.status(404).json({ message: "No transactions found" });
//     }

//     return res.status(200).json({
//       message: "Transaction history fetched successfully",
//       transactions,
//     });
//   } catch (err) {
//     console.error("Error fetching transaction history:", err);
//     return res.status(500).json({
//       message: "An error occurred while fetching transaction history",
//       error: err.message,
//     });
//   }
// };

// export const addNotes = async (req, res) => {
//   try {
//     const doctorId = req.user.sub;
//     const appointmentId = req.params.id;
//     const { notes } = req.body; // The notes the doctor wants to add

//     // Validate that notes are provided
//     if (!notes || notes.trim() === "") {
//       return res.status(400).json({ message: "Notes cannot be empty" });
//     }

//     // Find the appointment by ID
//     const appointment = await Appointment.findById(appointmentId);

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     // Ensure that the doctor is the one associated with the appointment
//     if (appointment.doctorId.toString() !== doctorId) {
//       return res.status(403).json({
//         message: "You are not authorized to add notes to this appointment",
//       });
//     }

//     // Add the notes to the appointment record
//     appointment.notes = notes;
//     await appointment.save();

//     return res.status(200).json({
//       message: "Notes added successfully to the appointment",
//       appointment,
//     });
//   } catch (err) {
//     console.error("Error adding notes to appointment:", err);
//     return res.status(500).json({
//       message: "An error occurred while adding notes to the appointment",
//       error: err.message,
//     });
//   }
// };
