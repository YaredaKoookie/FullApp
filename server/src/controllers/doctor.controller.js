import Doctor from "./../models/doctors/doctor.model";
import User from "../models/user.model";
import Appointment from "../models/appointment/appointment.model";
import Schedule from "../models/schedule/Schedule.model";
import { ServerError } from "../utils";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { deleteImage, uploadImageCloud } from "../config/cloudinary.config";

export const completeProfile = async (req, res) => {
  const { sub: userId } = req.user;
  let doctor = await Doctor.findOne({ userId });
  const user = await User.findById(userId);

  // console.log("user", userId, user);
  if (user?.isProfileCompleted && doctor?.verificationStatus !== "rejected") {
    res.status(400);
    throw new Error("Profile already submitted and under review or verified");
  }
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
  const cleanPath = (file) =>
    file?.path.replace(/\\/g, "/").replace(/^public\//, "");
  console.log("profile completion:", req.body);
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
      nationalIdFront: cleanPath(files.nationalIdFront),
      nationalIdBack: cleanPath(files.nationalIdBack),
      licenseFront: cleanPath(files.licenseFront),
      licenseBack: cleanPath(files.licenseBack),
      boardCertificationsDocument: cleanPath(files.boardCertificationsDocument),
      educationDocument: cleanPath(files.educationDocument),
      verificationStatus: "pending",
      languages,
      hospitalAddress,
      serviceAreas,
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

    // console.log(req.user);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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

export const uploadDoctorProfileImage = async (req, res) => {
  const { sub: userId } = req.user;

  const doctor = await Doctor.findOne({ userId });

  if (!doctor) throw ServerError.notFound("doctor profile not found");

  if (!req.file) throw ServerError.badRequest("No file provided to upload");

  // let oldImagePath = null;
  // let newImagePath = null;

  // if (doctor.profilePhoto) {
  //   oldImagePath = path.join("public", doctor.profilePhoto);
  // }

  // const fileId = crypto.randomUUID().toString("hex");
  // const filePath = "/uploads/doctors";
  // const fileName = `${fileId}.webp`;
  // const uploadPath = path.join("public", filePath, fileName);

  // await sharp(req.file.buffer)
  //   .resize(500, 500)
  //   .webp({ quality: 80 })
  //   .toFile(uploadPath);

  // newImagePath = `${filePath}/${fileName}`;
  // req.body.profilePhoto = newImagePath;

  if (doctor.profilePhotoId) {
    await deleteImage(doctor.profilePhotoId);
  }

  const uploadResult = await uploadImageCloud(req.file.path, "doctorsProfile");

  const updateDoctor = await Doctor.findByIdAndUpdate(
    doctor._id, // Find by the patient's id
    {
      profilePhoto: uploadResult.url,
      profilePhotoId: uploadResult.public_id,
    }, // Fields to update
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
      profileImage: updateDoctor.profilePhoto,
    },
  });
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
