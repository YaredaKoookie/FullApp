import Patient from '../../models/patient/patient.model';
import Appointment from '../../models/appointment/appointment.model';
import Doctor from '../../models/doctors/doctor.model';
import MedicalHistory from '../../models/patient/medicalHistory.model';
import MedicalRecord from '../../models/patient/medicalRecord.model';
import ServerError from '../../utils/ServerError';

export const getPatients = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new ServerError('Doctor not found', 404);
    }

    const { search, page = 1, limit = 10 } = req.query;
    const doctorId = doctor._id;

    // Build query for completed appointments with this doctor
    const appointmentQuery = {
      doctor: doctorId,
      status: 'completed'
    };

    // Get patient IDs with completed appointments
    const patientIds = await Appointment.distinct('patient', appointmentQuery);
    if (!patientIds.length) {
      return res.json({
        success: true,
        data: {
          patients: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: 0
          }
        }
      });
    }

    // Build patient query
    const patientQuery = { _id: { $in: patientIds } };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      patientQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    // Get paginated results
    const totalCount = await Patient.countDocuments(patientQuery);
    const patients = await Patient.aggregate([
      { $match: patientQuery },
      { $lookup: {
          from: 'appointments',
          let: { patientId: '$_id' },
          pipeline: [
            { $match: {
              $expr: {
                $and: [
                  { $eq: ['$patient', '$$patientId'] },
                  { $eq: ['$doctor', doctorId] },
                  { $eq: ['$status', 'completed'] }
                ]
              }
            }},
            { $sort: { 'slot.start': -1 } },
            { $limit: 1 }
          ],
          as: 'lastAppointment'
      }},
      { $addFields: {
          lastAppointmentDate: { $arrayElemAt: ['$lastAppointment.slot.start', 0] },
          totalAppointments: { $size: '$lastAppointment' }
      }},
      { $sort: { lastAppointmentDate: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        patients: patients.map(patient => ({
          _id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          lastAppointmentDate: patient.lastAppointmentDate,
          totalAppointments: patient.totalAppointments,
          profileImage: patient.profileImage
        })),
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error in getPatients:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

export const getPatientDetails = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new ServerError('Doctor not found', 404);
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw new ServerError('Patient not found', 404);
    }

    // Get completed appointments count
    const completedAppointments = await Appointment.countDocuments({
      patient: patient._id,
      doctor: doctor._id,
      status: 'completed'
    });

    // Get last appointment
    const lastAppointment = await Appointment.findOne({
      patient: patient._id,
      doctor: doctor._id,
      status: 'completed'
    }).sort({ 'slot.start': -1 });

    res.json({
      success: true,
      data: {
        patient: {
          _id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          profileImage: patient.profileImage,
          medicalHistory: patient.medicalHistory,
          allergies: patient.allergies,
          medications: patient.medications,
          completedAppointments,
          lastAppointment: lastAppointment ? {
            date: lastAppointment.slot.start,
            reason: lastAppointment.reason,
            type: lastAppointment.type
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Error in getPatientDetails:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

export const getPatientHistory = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new ServerError('Doctor not found', 404);
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw new ServerError('Patient not found', 404);
    }

    // Get medical history
    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
      .populate('patient')
      .populate('conditions.addedBy')
      .populate('currentMedications.addedBy');

    // Get appointments (keeping your existing logic)
    const appointments = await Appointment.find({
      patient: patient._id,
      doctor: doctor._id,
      status: 'completed'
    })
    .sort({ 'slot.start': -1 })
    .select('slot reason type notes');

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          dob: patient.dob,
          // other basic info
        },
        medicalHistory: medicalHistory || null, // Handle case where no history exists
        appointments: appointments.map(appointment => ({
          date: appointment.slot.start,
          reason: appointment.reason,
          type: appointment.type,
          notes: appointment.notes
        }))
      }
    });
  } catch (error) {
    console.error('Error in getPatientHistory:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

export const addPatientNote = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new ServerError('Doctor not found', 404);
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw new ServerError('Patient not found', 404);
    }

    const {
      additionalNotes,
      prescriptions,
      testsOrdered,
      followUpRequired,
      followUpDate, // Fixed field name
      lifeStyleChanges,
      symptoms
    } = req.body;

    // Find the most recent completed appointment between this doctor and patient
    const lastAppointment = await Appointment.findOne({
      patient: patient._id,
      doctor: doctor._id,
      status: 'completed'
    }).sort({ 'slot.start': -1 });

    // Create a new medical record for the note
    const medicalRecordData = {
      patient: patient._id,
      addedBy: doctor._id,
      source: "Doctor",
      clinicalNotes: [{
        date: new Date(),
        note: additionalNotes || ''
      }],
      prescriptions: prescriptions?.map(prescription => ({
        medication: prescription.name,
        dosage: prescription.dosage,
        frequency: prescription.instruction,
        duration: prescription.duration,
        startDate: new Date(),
        notes: ''
      })) || [],
      labResults: testsOrdered?.map(test => ({
        testName: test.testName,
        result: 'Pending',
        date: new Date(test.orderedDate),
        comments: ''
      })) || [],
      vitalSigns: [{
        date: new Date(),
        notes: `Follow-up required: ${followUpRequired ? 'Yes' : 'No'}${followUpDate ? `, Date: ${followUpDate}` : ''}`
      }],
      diagnoses: symptoms?.map(symptom => ({
        name: symptom,
        status: 'Active',
        diagnosisDate: new Date(),
        notes: ''
      })) || [],
      procedures: lifeStyleChanges?.map(change => ({
        name: change,
        date: new Date(),
        notes: 'Lifestyle change recommendation'
      })) || []
    };

    // Add appointment reference if available
    if (lastAppointment) {
      medicalRecordData.appointment = lastAppointment._id;
    }

    // Create and save the medical record
    const medicalRecord = new MedicalRecord(medicalRecordData);
    await medicalRecord.save();

    res.json({
      success: true,
      data: {
        note: medicalRecord
      }
    });
  } catch (error) {
    console.error('Error in addPatientNote:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

export const initiateVideoCall = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new ServerError('Doctor not found', 404);
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw new ServerError('Patient not found', 404);
    }

    // Generate a unique room ID for the video call
    const roomId = `${doctor._id}-${patient._id}-${Date.now()}`;

    // Here you would typically:
    // 1. Create a video call session in your video service
    // 2. Store the session details
    // 3. Send notifications to both doctor and patient

    res.json({
      success: true,
      data: {
        roomId,
        doctorId: doctor._id,
        patientId: patient._id,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error in initiateVideoCall:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound('Doctor not found');
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw ServerError.notFound('Patient not found');
    }

    console.log('Fetching medical history for patient:', patient._id);
    const medicalHistory = await MedicalHistory.findOne({ patient: patient._id })
      .populate("patient", "firstName gender")
      .populate("surgeries.surgeon.doctorId", "name specialty")
      .lean();

    console.log('Found medical history:', medicalHistory);

    if (!medicalHistory) {
      console.log('No medical history found, returning empty structure');
      return res.json({
        success: true,
        data: {
          data: {
            patient: {
              firstName: patient.firstName,
              gender: patient.gender
            },
            conditions: [],
            surgeries: [],
            hospitalizations: [],
            currentMedications: [],
            pastMedications: [],
            allergies: [],
            familyHistory: [],
            lifestyle: {
              smoking: {
                status: false,
                frequency: null,
                years: null
              },
              alcohol: {
                status: false,
                frequency: null
              },
              exerciseFrequency: null,
              diet: null,
              occupation: null
            },
            bloodType: null,
            height: null,
            weight: null,
            lastPhysicalExam: null,
            immunizations: [],
            womenHealth: {
              pregnancies: 0,
              liveBirths: 0,
              lastMenstrualPeriod: null,
              contraceptiveUse: false,
              menstrualCycleRegular: null
            }
          }
        }
      });
    }

    // Calculate additional virtual fields
    const enhancedHistory = {
      ...medicalHistory,
      activeConditions: medicalHistory.conditions?.filter(
        (c) => c.status === "Active"
      ) || [],
      criticalAllergies: medicalHistory.allergies?.filter(
        (a) => a.isCritical || a.severity === "Life-threatening"
      ) || []
    };

    console.log('Sending enhanced history:', enhancedHistory);
    res.json({
      success: true,
      data: {
        data: enhancedHistory
      }
    });
  } catch (error) {
    console.error('Error in getPatientMedicalHistory:', error);
    if (error instanceof ServerError) {
      res.status(error.status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

export const getPatientNotes = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new ServerError('Doctor not found', 404);
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw new ServerError('Patient not found', 404);
    }

    // Get all medical records for the patient that have notes
    const notes = await MedicalRecord.find({
      patient: patient._id,
      additionalNotes: { $exists: true, $ne: '' }
    })
    .populate('doctorId', 'firstName lastName')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        notes: notes.map(note => ({
          note: note.additionalNotes,
          date: note.createdAt,
          doctor: note.doctorId
        }))
      }
    });
  } catch (error) {
    console.error('Error in getPatientNotes:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};