import Patient  from '../models/patient/patient.model'
import Appointment  from '../models/appointment/appointment.model'
import Doctor  from '../models/doctors/doctor.model'

// @desc    Get filtered list of patients
// @route   GET /api/patients
// @access  Private (Doctor)
export const getPatients = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    console.log("user",userId)
    const doctor = await Doctor.findOne({userId})
    console.log("doc",doctor)
    const { search, type, lastAppointment, activeWithin, page = 1, limit = 10 } = req.query;
    const doctorId = doctor.id;

    // Build query for confirmed appointments with this doctor
    const appointmentQuery = {
      doctor: doctorId,
      status: 'confirmed'
    };

    // Apply filters
    if (type && type !== 'all') appointmentQuery.type = type;
    if (lastAppointment && lastAppointment !== 'any') {
      appointmentQuery['slot.start'] = { $gte: getDateFilter(lastAppointment) };
    }

    // Get patient IDs with matching appointments
    const patientIds = await Appointment.distinct('patient', appointmentQuery);
    if (!patientIds.length) {
      return res.json({ success: true, count: 0, totalCount: 0, patients: [] });
    }

    // Build patient query
    const patientQuery = { _id: { $in: patientIds } };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      patientQuery.$or = [
        { name: searchRegex },
        // { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    if (activeWithin && activeWithin !== 'any') {
      const days = parseInt(activeWithin.replace('days', ''));
      patientQuery.lastAppointmentDate = { 
        $gte: new Date(new Date().setDate(new Date().getDate() - days))
      };
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
                  { $eq: ['$status', 'confirmed'] }
                ]
              }
            }},
            { $count: 'count' }
          ],
          as: 'appointments'
      }},
      { $addFields: { appointmentCount: { $arrayElemAt: ['$appointments.count', 0] } } },
      { $sort: { lastAppointmentDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      count: patients.length,
      totalCount,
      patients: patients.map(formatPatientResponse)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get patient appointment history
// @route   GET /api/patients/:id/history
// @access  Private (Doctor)
export const getPatientHistory = async (req, res) => {
  try {
    const {sub : userId} = req.user;
    const doctor = await Doctor.findOne({userId});
    const patient = await Patient.findOne({userId});
    const history = await Appointment.find({
      patient: params.id,
      doctor: doctor.id,
      status: { $in: ['confirmed', 'completed', 'cancelled'] }
    })
    .sort({ 'slot.start': -1 })
    .lean();

    res.json({ 
      success: true,
      history: history.map(a => ({
        id: a._id,
        type: a.type,
        reason: a.reason,
        status: a.status,
        slot: { start: a.slot.start, end: a.slot.end }
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add note to patient
// @route   POST /api/patients/:id/notes
// @access  Private (Doctor)
export const addPatientNote = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    patient.notes = patient.notes || [];
    patient.notes.push({
      doctor: req.doctor.id,
      note: req.body.note,
      date: new Date()
    });

    await patient.save();
    res.json({ success: true, data: patient.notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Helper functions
function getDateFilter(range) {
  const now = new Date();
  switch (range) {
    case 'lastWeek': return new Date(now.setDate(now.getDate() - 7));
    case 'lastMonth': return new Date(now.setMonth(now.getMonth() - 1));
    case 'last3Months': return new Date(now.setMonth(now.getMonth() - 3));
    default: return new Date(0);
  }
}

function formatPatientResponse(p) {
  return {
    id: p._id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    age: calculateAge(p.dob),
    avatar: p.avatar,
    appointmentCount: p.appointmentCount || 0,
    lastAppointmentDate: p.lastAppointmentDate,
    lastAppointmentType: p.lastAppointmentType
  };
}

function calculateAge(dob) {
  return dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null;
}