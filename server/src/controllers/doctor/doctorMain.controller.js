import Doctor from "../../models/doctors/doctor.model";
import User from "../../models/user.model";
import Appointment from "../../models/appointment/appointment.model";
import { ServerError } from "../../utils";
import { deleteImage, uploadImageCloud } from "../../config/cloudinary.config";

export const getCurrentDoctor = async (req, res) => {
  try {
    // The authenticated doctor's ID should be in req.user._id (or wherever your auth middleware puts it)
    const doctor = await Doctor.findOne({ userId: req.user.sub })
      .select("-password") // Exclude sensitive fields
      .lean();

    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    res.json({
      success: true,
      data: {
        doctor
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

export const updateDoctorProfile = async (req, res, next) => {
  try {
    // const { id } = req.user; // Assuming req.user contains the doctor's ID
    const { sub: userId } = req.user;
    const updates = req.body;

    if (!userId) throw ServerError.unauthorized("User not authenticated");

    const doctor = await Doctor.findOneAndUpdate(
      { userId }, // Find by ID
      { $set: updates },
      {
        new: true,
        runValidators: true,
        select: "-password -__v -createdAt -updatedAt",
      }
    );

    if (!doctor) throw ServerError.notFound("Doctor not found");

    res.status(200).json({
      success: true,
      data: doctor,
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// PUT /doctor/profile - Update doctor profile
export const updateProfile = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      specialization, 
      phoneNumber, 
      location, 
      bio,
      yearsOfExperience,
      qualifications,
      languages,
      hospitalName,
      hospitalAddress,
      consultationFee,
      serviceAreas
    } = req.body;
    
    // Find doctor by userId
    const doctor = await Doctor.findOne({ userId: req.user.sub });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Handle profile photo upload if present
    let uploadedFiles = {};
    if (req.file) {
      // Delete old profile photo if exists
      if (doctor.profilePhotoId) {
        await deleteImage(doctor.profilePhotoId);
      }
      const profilePhotoResult = await uploadImageCloud(req.file.path, 'doctors/profile');
      uploadedFiles.profilePhoto = profilePhotoResult.secure_url;
      uploadedFiles.profilePhotoId = profilePhotoResult.public_id;
    }

    // Update doctor profile
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      {
        firstName,
        lastName,
        specialization,
        phoneNumber,
        location,
        bio,
        yearsOfExperience,
        qualifications,
        languages,
        hospitalName,
        hospitalAddress,
        consultationFee,
        serviceAreas,
        ...uploadedFiles
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      data: updatedDoctor
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default deleteDoctorAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sub: doctorId } = req.user; // From authentication middleware
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      throw new ServerError(
        "Please provide a valid reason (min 10 characters)",
        400
      );
    }

    // 1. Get doctor profile to find associated user ID
    const doctor = await Doctor.findById(doctorId).session(session);
    if (!doctor) {
      throw new ServerError("Doctor profile not found", 404);
    }

    const userId = doctor.user;

    // 2. Delete all appointments associated with this doctor
    await Appointment.deleteMany({ doctor: doctorId }).session(session);

    // 3. Delete doctor profile
    await Doctor.findByIdAndDelete(doctorId).session(session);

    // 4. Delete base user account
    await User.findByIdAndDelete(userId).session(session);

    // 5. (Optional) Log the deletion reason for audit purposes
    await AuditLog.create(
      [
        {
          action: "ACCOUNT_DELETION",
          userId,
          metadata: {
            reason,
            deletedAt: new Date(),
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /doctor/profile/view - Get current doctor's profile view
export const getDoctorProfileView = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.sub })
      .select('profilePhoto profilePhotoId bio yearsOfExperience qualifications languages hospitalName hospitalAddress consultationFee serviceAreas')
      .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found"
      });
    }

    res.json({
      success: true,
      data: {
        profilePicture: {
          url: doctor.profilePhoto,
          id: doctor.profilePhotoId
        },
        bio: doctor.bio,
        yearsOfExperience: doctor.yearsOfExperience,
        qualifications: doctor.qualifications,
        languagesSpoken: doctor.languages,
        hospitalName: doctor.hospitalName,
        hospitalAddress: doctor.hospitalAddress,
        consultationFee: doctor.consultationFee,
        serviceAreas: doctor.serviceAreas
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// GET /doctor/profile/view/:doctorId - Get specific doctor's profile view
export const getDoctorProfileViewById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await Doctor.findById(doctorId)
      .select('profilePhoto profilePhotoId bio yearsOfExperience qualifications languages hospitalName hospitalAddress consultationFee serviceAreas')
      .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found"  
      });
    }

    res.json({
      success: true,
      data: {
        profilePicture: {
          url: doctor.profilePhoto,
          id: doctor.profilePhotoId
        },
        bio: doctor.bio,
        yearsOfExperience: doctor.yearsOfExperience,
        qualifications: doctor.qualifications,
        languagesSpoken: doctor.languages,
        hospitalName: doctor.hospitalName,
        hospitalAddress: doctor.hospitalAddress,
        consultationFee: doctor.consultationFee,
        serviceAreas: doctor.serviceAreas
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
