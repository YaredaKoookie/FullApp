import Doctor from '../models/doctors/doctor.model.js';
import User from '../models/user.model.js';
import Patient from '../models/patient/patient.model.js';

export const getAllDoctors = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { middleName: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }
    
    // Get doctors with pagination
    const doctors = await Doctor.find(query)
      // .populate('user', 'email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalDoctors = await Doctor.countDocuments(query);
    const totalPages = Math.ceil(totalDoctors / limit);
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      totalDoctors,
      totalPages,
      currentPage: Number(page),
      doctors
    });
    
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctors'
    });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const {sub : userId} = req.user
    const doctor = await Doctor.findOne({userId})
      // .populate('user', 'email');
      
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      doctor
    });
    
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor'
    });
  }
};

export const approveDoctor = async (req, res) => {
  const {doctorId} = req.params;
  try {
    const doctor = await Doctor.findById(doctorId);

    console.log(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    if (doctor.verificationStatus === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Doctor is already verified'
      });
    }
    
    doctor.verificationStatus = 'verified';
    doctor.approvedAt = new Date();
    await doctor.save();
    
    res.status(200).json({
      success: true,
      message: 'Doctor approved successfully',
      doctor
    });
    
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving doctor'
    });
  }
};

export const rejectDoctor = async (req, res) => {
  try {
    const {sub :userId} = req.user;
    const doctor = await Doctor.findOne({userId});
    const user = await User.findById(userId);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    if (doctor.verificationStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Doctor is already rejected'
      });
    }
    
    doctor.verificationStatus = 'rejected';
    user.isProfileCompleted = false;
    // doctor.rejectionReason = rejectionReason;
    await doctor.save();
    await user.save();
    console.log("base",user);
    
    res.status(200).json({
      success: true,
      message: 'Doctor rejected successfully',
      doctor
    });
    
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting doctor'
    });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Status filter
    if (status !== 'all') {
      query.isActive = status === 'active';
    }
    
    // Get patients with pagination
    const patients = await Patient.find(query)
      .select('-password -__v')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalPatients = await Patient.countDocuments(query);
    
    res.json({
      success: true,
      count: patients.length,
      totalPatients,
      totalPages: Math.ceil(totalPatients / limit),
      currentPage: Number(page),
      patients
    });
    
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients'
    });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const {sub : userId} = req.user;
    const patient = await Patient.findById({userId})
      .select('-password -__v')
      .populate({
        path: 'user',
        select: 'email createdAt'
      });
      
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      patient
    });
    
  } catch (error) {
    console.error('Error fetching patient:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient'
    });
  }
};

export const togglePatientStatus = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Toggle status
    patient.isActive = !patient.isActive;
    await patient.save();
    
    // Update corresponding user status if exists
    if (patient.user) {
      await User.findByIdAndUpdate(patient.user, {
        isActive: patient.isActive
      });
    }
    
    res.json({
      success: true,
      message: `Patient ${patient.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: patient.isActive
    });
    
  } catch (error) {
    console.error('Error toggling patient status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling patient status'
    });
  }
};