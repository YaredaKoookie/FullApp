import Patient from '../models/patient/patient.model';
import Consultation from '../models/patient/medicalRecord.model';
import Prescription from '../models/OtherModels/Prescription.models';
import ServerError from '../utils/ServerError';
import Appointment from '../models/appointment/appointment.model';
import Doctor from '../models/doctors/doctor.model'
import mongoose from 'mongoose'


const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

export const getDoctorPatients = async (req, res, next) => {
  try {
    const userId = req.user.sub; // Assuming doctor ID comes from auth middleware
    const { page = 1, limit = 10, search, status, sort = 'lastAppointment:desc' } = req.query;
    const { limit: paginationLimit, offset } = getPagination(page, limit);

    // First get all patient IDs who have appointments with this doctor
    const doctor = await Doctor.findOne({userId});
    if(!doctor) {
      res.json({
        error:true
      })
    }
    const doctorId = doctor._id.toString();
    const appointments = await Appointment.find({ doctor: doctorId })
      .select('patient')
      .lean();


      console.log(appointments)
    const patientIds = [...new Set(appointments.map(a => a.patient))];

    if (patientIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: +page,
          totalPages: 0,
          limit: +limit
        }
      });
    }

    // Build query for patients
    const query = { _id: { $in: patientIds } };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Get sorting key
    const [sortKey, sortOrder] = sort.split(':');
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Get patients with their last appointment date
    const [patients, total] = await Promise.all([
      Patient.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'appointments',
            let: { patientId: '$_id' },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $and: [
                      { $eq: ['$patient', '$$patientId'] },
                      { $eq: ['$doctor', new mongoose.Types.ObjectId(doctorId) ] }
                    ]
                  } 
                } 
              },
              { $sort: { date: -1 } },
              { $limit: 1 }
            ],
            as: 'lastAppointment'
          }
        },
        {
          $addFields: {
            lastAppointmentDate: { $arrayElemAt: ['$lastAppointment.date', 0] }
          }
        },
        { $sort: { [sortKey === 'lastAppointment' ? 'lastAppointmentDate' : sortKey]: sortDirection } },
        { $skip: offset },
        { $limit: paginationLimit },
        {
          $project: {
            password: 0,
            __v: 0,
            lastAppointment: 0
          }
        }
      ]),
      Patient.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: patients,
      pagination: {
        total,
        page: +page,
        totalPages: Math.ceil(total / limit),
        limit: +limit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .select('-__v -createdAt')
      .lean();

    if (!patient) {
      throw new ServerError.notFound('Patient not found');
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const getMedicalHistory = async (req, res, next) => {
  try {
    const history = await Patient.findById(req.params.id)
      .select('medicalHistory allergies chronicConditions')
      .lean();

    if (!history) {
      throw new ServerError.notFound('Patient not found');
    }

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const getConsultations = async (req, res, next) => {
  try {
    const consultations = await Consultation.find({ patient: req.params.id })
      .sort({ date: -1 })
      .lean();

    res.json({ 
      success: true, 
      data: consultations 
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ 
      patient: req.params.id,
      status: 'Active' // Only show active by default
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json({ 
      success: true, 
      data: prescriptions 
    });
  } catch (error) {
    next(error);
  }
};

export const searchPatients = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      throw new ServerError.badRequest('Search query must be at least 3 characters');
    }

    const patients = await Patient.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { 'medicalHistory.condition': { $regex: query, $options: 'i' } }
      ]
    })
    .limit(10)
    .select('name email phone status lastVisit')
    .lean();

    res.json({ success: true, data: patients });
  } catch (error) {
    next(error);
  }
};

export const createConsultation = async (req, res, next) => {
  try {
    const { reason, diagnosis, notes } = req.body;
    
    const consultation = new Consultation({
      patient: req.params.id,
      doctor: req.user.id,
      reason,
      diagnosis,
      notes,
      status: 'Scheduled'
    });

    await consultation.save();

    // Update patient's last visit
    await Patient.findByIdAndUpdate(req.params.id, { 
      lastVisit: new Date() 
    });

    res.status(201).json({ 
      success: true, 
      data: consultation 
    });
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (req, res, next) => {
  try {
    const { medication, dosage, frequency, instructions, duration } = req.body;
    
    const prescription = new Prescription({
      patient: req.params.id,
      doctor: req.user.id,
      medication,
      dosage,
      frequency,
      instructions,
      duration,
      status: 'Active'
    });

    await prescription.save();

    res.status(201).json({ 
      success: true, 
      data: prescription 
    });
  } catch (error) {
    next(error);
  }
};