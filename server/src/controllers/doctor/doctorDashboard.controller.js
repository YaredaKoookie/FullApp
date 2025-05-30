import Doctor from "../../models/doctors/doctor.model.js";
import Appointment from "../../models/appointment/appointment.model.js";
import MedicalRecord from "../../models/patient/medicalRecord.model.js";
import Payment from "../../models/appointment/payment.model.js";
import Review from "../../models/review.model.js";
import ServerError from "../../utils/ServerError.js";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Get doctor's dashboard statistics
export const getDoctorStats = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { timeRange = 'month' } = req.query;

    // Find the doctor first
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound('Doctor not found');
    }

    const doctorId = doctor._id;

    // Validate timeRange
    if (!['week', 'month', 'year'].includes(timeRange)) {
      throw ServerError.badRequest('Invalid time range. Must be week, month, or year');
    }

    // Calculate date ranges for current and previous periods
    let startDate, endDate, prevStartDate, prevEndDate;
    const now = new Date();

    switch (timeRange) {
      case 'week':
        endDate = now;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEndDate = startDate;
        break;
      case 'month':
        endDate = now;
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'year':
        endDate = now;
        startDate = new Date(now.getFullYear(), 0, 1);
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear(), 0, 0);
        break;
    }

    // Get current period appointment stats
    const currentAppointmentStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
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
          confirmed: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] 
            } 
          }
        }
      }
    ]);

    // Get all-time appointment stats
    const allTimeAppointmentStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
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
          confirmed: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] 
            } 
          }
        }
      }
    ]);

    // Get previous period appointment stats
    const prevAppointmentStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ]);

    // Get current period revenue stats
    const currentRevenueStats = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: "paid",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          doctorShare: { $sum: "$splitDetails.doctorShare" }
        }
      }
    ]);

    // Get all-time revenue stats
    const allTimeRevenueStats = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: "paid"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          doctorShare: { $sum: "$splitDetails.doctorShare" }
        }
      }
    ]);

    // Get previous period revenue stats
    const prevRevenueStats = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: "paid",
          createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Get unique patients count for current period
    const currentPatientStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$patient"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ]);

    // Get all-time unique patients count
    const allTimePatientStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId
        }
      },
      {
        $group: {
          _id: "$patient"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ]);

    // Get previous period unique patients count
    const prevPatientStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        }
      },
      {
        $group: {
          _id: "$patient"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ]);

    // Get doctor's rating
    const ratings = await Review.aggregate([
      {
        $match: {
          doctor: doctorId
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          total: { $sum: 1 }
        }
      }
    ]);

    // Calculate trends
    const calculateTrend = (current, previous) => {
      const currentValue = current?.[0]?.total || 0;
      const previousValue = previous?.[0]?.total || 0;
      if (previousValue === 0) return currentValue > 0 ? 100 : 0;
      return Number(((currentValue - previousValue) / previousValue * 100).toFixed(1));
    };

    // Get current stats or default to 0
    const currentAppStats = currentAppointmentStats[0] || { total: 0, completed: 0, cancelled: 0, confirmed: 0 };
    const allTimeAppStats = allTimeAppointmentStats[0] || { total: 0, completed: 0, cancelled: 0, confirmed: 0 };
    const currentRevStats = currentRevenueStats[0] || { total: 0, doctorShare: 0 };
    const allTimeRevStats = allTimeRevenueStats[0] || { total: 0, doctorShare: 0 };
    const currentPatStats = currentPatientStats[0] || { total: 0 };
    const allTimePatStats = allTimePatientStats[0] || { total: 0 };

    // Calculate performance metrics using all-time stats
    const completionRate = allTimeAppStats.total ? 
      ((allTimeAppStats.completed / allTimeAppStats.total) * 100).toFixed(1) : 0;
    const cancellationRate = allTimeAppStats.total ? 
      ((allTimeAppStats.cancelled / allTimeAppStats.total) * 100).toFixed(1) : 0;

    const response = {
      appointments: {
        total: allTimeAppStats.total,
        completed: allTimeAppStats.completed,
        cancelled: allTimeAppStats.cancelled,
        confirmed: allTimeAppStats.confirmed,
        trend: calculateTrend(currentAppointmentStats, prevAppointmentStats)
      },
      revenue: {
        total: Number(allTimeRevStats.total).toFixed(2),
        doctorShare: Number(allTimeRevStats.doctorShare).toFixed(2),
        trend: calculateTrend(currentRevenueStats, prevRevenueStats)
      },
      patients: {
        total: allTimePatStats.total,
        trend: calculateTrend(currentPatientStats, prevPatientStats)
      },
      rating: {
        average: Number((ratings[0]?.average || 0).toFixed(1)),
        total: ratings[0]?.total || 0
      },
      metrics: {
        completionRate: Number(completionRate),
        cancellationRate: Number(cancellationRate)
      },
      timeRange,
      doctor: {
        firstName: doctor.firstName,
        lastName: doctor.lastName
      }
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error in getDoctorStats:', error);
    if (error instanceof ServerError) throw error;
    throw ServerError.internal('Failed to get doctor statistics', error);
  }
};

// Get doctor's recent activities
export const getDoctorActivities = async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Find the doctor and handle potential errors
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw ServerError.notFound('Doctor not found');
    }

    // Set up today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's appointments with error handling
    const appointments = await Appointment.find({ 
      doctor: doctor._id,
      'slot.start': {
        $gte: today,
        $lt: tomorrow
      }
    })
      .sort({ 'slot.start': 1 })
      .populate('patient', 'firstName lastName profilePhoto')
      .lean();

    console.log('Found today\'s appointments:', appointments.length);

    // Get today's medical records
    const records = await MedicalRecord.find({ 
      addedBy: doctor._id,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .sort({ createdAt: -1 })
      .populate('patient', 'firstName lastName')
      .lean();

    console.log('Found today\'s medical records:', records.length);

    // Get today's payments
    const payments = await Payment.find({ 
      doctor: doctor._id, 
      status: 'paid',
      'splitDetails.doctorShare': { $exists: true },
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found today\'s payments:', payments.length);

    // Combine and sort today's activities
    const activities = [
      ...appointments.map(apt => ({
        _id: apt._id,
        type: 'appointment',
        title: `Appointment with ${apt.patient?.firstName || 'Unknown'} ${apt.patient?.lastName || ''}`,
        description: `${apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1) || 'Unknown'} appointment${apt.reason ? ` for ${apt.reason}` : ''}`,
        timestamp: apt.slot.start,
        patientPhoto: apt.patient?.profilePhoto,
        startTime: apt.slot.start,
        endTime: apt.slot.end,
        status: apt.status
      })),
      ...records.map(rec => ({
        _id: rec._id,
        type: 'record',
        title: `Medical Record Added`,
        description: `Added medical record for ${rec.patient?.firstName || 'Unknown'} ${rec.patient?.lastName || ''}`,
        timestamp: rec.createdAt
      })),
      ...payments.map(pay => ({
        _id: pay._id,
        type: 'payment',
        title: 'Payment Received',
        description: `Received payment of ETB ${pay.splitDetails?.doctorShare?.toLocaleString() || '0'}`,
        timestamp: pay.createdAt
      })),
    ].sort((a, b) => a.timestamp - b.timestamp); // Sort by time ascending for today's activities

    console.log('Combined today\'s activities:', activities.length);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error in getDoctorActivities:', error);
    if (error instanceof ServerError) throw error;
    throw ServerError.internal('Failed to get doctor activities', error);
  }
}; 