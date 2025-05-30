import Doctor from "../../models/doctors/doctor.model.js";
import Patient from "../../models/patient/patient.model.js";
import Appointment from "../../models/appointment/appointment.model.js";
import Payment from "../../models/appointment/payment.model.js";
import ServerError from "../../utils/ServerError.js";

// Cache for analytics data
let analyticsCache = {
  data: null,
  lastUpdated: null,
  ttl: 5 * 60 * 1000 // 5 minutes TTL
};

// Helper function to check if cache is valid
const isCacheValid = () => {
  return analyticsCache.data && 
         analyticsCache.lastUpdated && 
         (Date.now() - analyticsCache.lastUpdated) < analyticsCache.ttl;
};

// Get dashboard analytics with caching
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid()) {
      return res.json(analyticsCache.data);
    }

    // Get basic stats with optimized queries
    const [basicStats, recentActivity] = await Promise.all([
      Promise.all([
        Appointment.countDocuments().lean(),
        Patient.countDocuments().lean(),
        Doctor.countDocuments().lean(),
        Payment.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).allowDiskUse(true)
      ]),
      Promise.all([
        // Get recent appointments with selective population
        Appointment.find()
          .select('patient doctor date status type duration payment')
          .sort({ date: -1 })
          .limit(5)
          .populate('patient', 'firstName lastName profileImage')
          .populate('doctor', 'firstName lastName profilePhoto specialization')
          .lean(),
        // Get recent payments with selective population
        Payment.find()
          .select('patient amount status createdAt paymentMethod transactionId')
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('patient', 'firstName lastName profileImage')
          .lean()
      ])
    ]);

    const [totalAppointments, totalPatients, totalDoctors, totalPayments] = basicStats;
    const [recentAppointments, recentPayments] = recentActivity;

    // Get chart data with optimized aggregations
    const [appointmentsChart, patientsChart, doctorsChart, revenueChart] = await Promise.all([
      // Appointments trend (last 7 days)
      Appointment.aggregate([
        {
          $match: {
            'slot.start': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { 
                format: "%Y-%m-%d", 
                date: "$slot.start"
              } 
            },
            count: { $sum: 1 },
            completed: { 
              $sum: { 
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0] 
              }
            },
            cancelled: { 
              $sum: { 
                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] 
              }
            },
            pending: { 
              $sum: { 
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0] 
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).allowDiskUse(true),

      // Patients growth (last 6 months)
      Patient.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 6 }
      ]).allowDiskUse(true),

      // Doctors growth (last 6 months)
      Doctor.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
            }
          }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 6 }
      ]).allowDiskUse(true),

      // Revenue chart (last 6 months)
      Payment.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            revenue: { $sum: "$amount" }
          }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 6 }
      ]).allowDiskUse(true)
    ]);

    // Format response data
    const response = {
      success: true,
      data: {
        stats: {
          appointments: totalAppointments,
          patients: totalPatients,
          doctors: totalDoctors,
          revenue: totalPayments[0]?.total || 0
        },
        recent: {
          appointments: recentAppointments.map(apt => ({
            id: apt._id,
            patientName: `${apt.patient?.firstName} ${apt.patient?.lastName}`,
            patientImage: apt.patient?.profileImage,
            doctorName: `${apt.doctor?.firstName} ${apt.doctor?.lastName}`,
            doctorImage: apt.doctor?.profilePhoto,
            doctorSpecialization: apt.doctor?.specialization,
            date: apt.date,
            status: apt.status,
            type: apt.type,
            duration: apt.duration,
            payment: apt.payment
          })),
          payments: recentPayments.map(payment => ({
            id: payment._id,
            patientName: `${payment.patient?.firstName} ${payment.patient?.lastName}`,
            patientImage: payment.patient?.profileImage,
            amount: payment.amount,
            status: payment.status,
            date: payment.createdAt,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId
          }))
        },
        charts: {
          appointments: appointmentsChart.map(item => ({
            date: item._id,
            count: item.count,
            completed: item.completed || 0,
            cancelled: item.cancelled || 0,
            pending: item.pending || 0
          })),
          patients: patientsChart.map(item => ({
            month: new Date(Date.UTC(item._id.year, item._id.month - 1)).toLocaleString('default', { month: 'short', year: 'numeric' }),
            count: item.count
          })),
          doctors: doctorsChart.map(item => ({
            month: new Date(Date.UTC(item._id.year, item._id.month - 1)).toLocaleString('default', { month: 'short', year: 'numeric' }),
            count: item.count,
            activeCount: item.activeCount
          })),
          revenue: revenueChart.map(item => ({
            month: new Date(Date.UTC(item._id.year, item._id.month - 1)).toLocaleString('default', { month: 'short', year: 'numeric' }),
            revenue: item.revenue
          }))
        }
      }
    };

    // Update cache
    analyticsCache.data = response;
    analyticsCache.lastUpdated = Date.now();

    res.json(response);
  } catch (error) {
    console.error('Analytics Error:', error);
    throw ServerError.internal("Failed to fetch analytics data", error);
  }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const [recentAppointments, recentPayments] = await Promise.all([
      Appointment.find()
        .sort({ date: -1 })
        .limit(10)
        .populate('patient', 'firstName lastName profileImage')
        .populate('doctor', 'firstName lastName profilePhoto specialization')
        .lean(),
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('patient', 'firstName lastName profileImage')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        appointments: recentAppointments.map(apt => ({
          id: apt._id,
          patientName: `${apt.patient?.firstName} ${apt.patient?.lastName}`,
          patientImage: apt.patient?.profileImage,
          doctorName: `${apt.doctor?.firstName} ${apt.doctor?.lastName}`,
          doctorImage: apt.doctor?.profilePhoto,
          doctorSpecialization: apt.doctor?.specialization,
          date: apt.date,
          status: apt.status,
          type: apt.type
        })),
        payments: recentPayments.map(payment => ({
          id: payment._id,
          patientName: `${payment.patient?.firstName} ${payment.patient?.lastName}`,
          patientImage: payment.patient?.profileImage,
          amount: payment.amount,
          status: payment.status,
          date: payment.createdAt,
          paymentMethod: payment.paymentMethod
        }))
      }
    });
  } catch (error) {
    throw ServerError.internal("Failed to fetch recent activity", error);
  }
};

// Get today's stats (no caching needed as it's real-time data)
export const getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Optimized query with selective field projection
    const [appointments, payments] = await Promise.all([
      Appointment.find({
        date: { $gte: today, $lt: tomorrow }
      })
      .select('patient doctor date status type')
      .populate('patient', 'firstName lastName profileImage')
      .populate('doctor', 'firstName lastName profilePhoto specialization')
      .lean(),

      Payment.find({
        createdAt: { $gte: today, $lt: tomorrow }
      })
      .select('patient amount status createdAt paymentMethod')
      .populate('patient', 'firstName lastName profileImage')
      .lean()
    ]);

    // Efficient calculations using reduce
    const { totalRevenue, appointmentsByStatus } = appointments.reduce((acc, apt) => {
      acc.appointmentsByStatus[apt.status] = (acc.appointmentsByStatus[apt.status] || 0) + 1;
      return acc;
    }, { 
      totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      appointmentsByStatus: {}
    });

    res.json({
      success: true,
      data: {
        appointments: {
          total: appointments.length,
          byStatus: {
            pending: appointmentsByStatus.pending || 0,
            confirmed: appointmentsByStatus.confirmed || 0,
            completed: appointmentsByStatus.completed || 0,
            cancelled: appointmentsByStatus.cancelled || 0
          },
          list: appointments.map(apt => ({
            id: apt._id,
            patientName: `${apt.patient?.firstName} ${apt.patient?.lastName}`,
            patientImage: apt.patient?.profileImage,
            doctorName: `${apt.doctor?.firstName} ${apt.doctor?.lastName}`,
            doctorImage: apt.doctor?.profilePhoto,
            doctorSpecialization: apt.doctor?.specialization,
            time: apt.date,
            status: apt.status,
            type: apt.type
          }))
        },
        payments: {
          total: payments.length,
          revenue: totalRevenue,
          list: payments.map(payment => ({
            id: payment._id,
            patientName: `${payment.patient?.firstName} ${payment.patient?.lastName}`,
            patientImage: payment.patient?.profileImage,
            amount: payment.amount,
            status: payment.status,
            time: payment.createdAt,
            paymentMethod: payment.paymentMethod
          }))
        }
      }
    });
  } catch (error) {
    throw ServerError.internal("Failed to fetch today's stats", error);
  }
};