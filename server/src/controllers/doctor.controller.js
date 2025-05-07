import Doctor from "./../models/doctors/doctor.model";
import User from "../models/user.model";
import Appointment from '../models/appointment/appointment.model';

export const completeProfile = async (req, res) => {
  try {
    const { sub: userId } = req.user;

    let doctor = await Doctor.findOne({ userId });
    const user = await User.findById(userId);

    console.log("user", userId, user);
    console.log("user", doctor);
    if (!doctor) {
      doctor = new Doctor({ userId });
    }
    const {
      fullName,
      specialization,
      qualifications,
      experience,
      bio,
      hospitalName,
      consultationFee,
      weeklyAvailability,
      licenseNumber,
      licenseDocument,
      idProof,
      applicationNotes,
    } = req.body;

    doctor.fullName = fullName;
    doctor.specialization = specialization;
    doctor.qualifications = qualifications;
    doctor.experience = experience;
    doctor.bio = bio;
    doctor.hospitalName = hospitalName;
    doctor.consultationFee = consultationFee;
    doctor.weeklyAvailability = weeklyAvailability;
    doctor.licenseNumber = licenseNumber;
    doctor.licenseDocument = licenseDocument;
    doctor.idProof = idProof;
    doctor.applicationNotes = applicationNotes;
    if (doctor)
      if (doctor.approvalStatus === "pending") {
        doctor.approvalStatus = "pending";
      }

    await doctor.save();
    user.isProfileCompleted = true;
    await user.save();

    return res.status(200).json({
      message: "Profile Completed Successfully Wait for approval",
      doctor,
    });
  } catch (err) {
    console.error("Error completing profile: ", err);
    return res.status(500).json({
      message: "An error occurred while completing your profile.",
      error: err.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { sub: userId } = req.user;

    const doctor = await Doctor.findOne({ userId }).populate("userId");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    return res.status(200).json({
      message: "Doctor profile retrieved successfully",
      user: doctor,
    });
  } catch (err) {
    console.error("Error fetching doctor profile:", err);
    return res.status(500).json({
      message: "An error occurred while retrieving your profile",
      error: err.message,
    });
  }
};

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

export const editProfile = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const updates = req.body;

    const allowedFields = [
      "fullName",
      "profilePicture",
      "bio",
      "hospitalName",
      "consultationFee",
      "weeklyAvailability",
      "applicationNotes",
      "location",
    ];

    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId },
      { $set: filteredUpdates },
      { new: true }
    ).populate("userId", "name email");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      doctor,
    });
  } catch (err) {
    console.error("Error updating doctor profile:", err);
    return res.status(500).json({
      message: "An error occurred while updating your profile",
      error: err.message,
    });
  }
};

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
    // const doctorId = req.user.userId;
    const { sub: userId } = req.user;

    const appointments = await Appointment.find({ userId })
      .populate("patientId", "fullName profilePicture") // adjust as needed
      .sort({ date: -1 }); // latest first

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
    // const doctorId = req.user.userId;
    const { sub: userId } = req.user;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
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

    appointment.status = "approved";
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
    // const doctorId = req.user.userId;
    const { sub: userId } = req.user;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
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

    appointment.status = "declined";
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
    // const doctorId = req.user.userId;
    const { sub: userId } = req.user;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or unauthorized" });
    }

    if (appointment.status !== "approved") {
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
    // const doctorId = req.user.userId;
    const { sub: userId } = req.user;
    const appointmentId = req.params.id;
    const { cancellationReason } = req.body; // Optionally pass a reason for cancellation

    // Find the appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
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

// const setAvailability = async (req, res) => {
//   try {
//     const doctorId = req.user.userId;
//     const { availableDays, availableTimeSlots } = req.body; // Days and time slots from request

//     // Validate input (e.g., ensure availableDays and availableTimeSlots are provided)
//     if (!availableDays || !availableTimeSlots) {
//       return res
//         .status(400)
//         .json({ message: "Both available days and time slots are required" });
//     }

//     // Find the doctor profile
//     const doctor = await Doctor.findOne({ userId: doctorId });

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     // Update the doctor's availability
//     doctor.weeklyAvailability = availableDays;
//     doctor.availableTimeSlots = availableTimeSlots;

//     await doctor.save();

//     return res.status(200).json({
//       message: "Doctor availability updated successfully",
//       doctor: {
//         availableDays: doctor.weeklyAvailability,
//         availableTimeSlots: doctor.availableTimeSlots,
//       },
//     });
//   } catch (err) {
//     console.error("Error setting doctor availability:", err);
//     return res.status(500).json({
//       message: "An error occurred while setting availability",
//       error: err.message,
//     });
//   }
// };

// const getAvailability = async (req, res) => {
//   try {
//     const doctorId = req.user.userId;

//     // Find the doctor's profile
//     const doctor = await Doctor.findOne({ userId: doctorId }).select(
//       "weeklyAvailability availableTimeSlots"
//     );

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     return res.status(200).json({
//       message: "Doctor availability fetched successfully",
//       availability: {
//         availableDays: doctor.weeklyAvailability,
//         availableTimeSlots: doctor.availableTimeSlots,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching doctor availability:", err);
//     return res.status(500).json({
//       message: "An error occurred while fetching availability",
//       error: err.message,
//     });
//   }
// };

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

// const addNotes = async (req, res) => {
//   try {
//     const doctorId = req.user.userId;
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
//       return res
//         .status(403)
//         .json({
//           message: "You are not authorized to add notes to this appointment",
//         });
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
