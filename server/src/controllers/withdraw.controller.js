import Withdrawal from "../models/doctors/withdrawal.models.js";
import Payment from "../models/appointment/payment.model.js";
import Appointment from "../models/appointment/appointment.model.js";
import { calculateRevenueSummary } from "../utils/paymentUtils.js";
import Doctor from "../models/doctors/doctor.model.js";


export const getAllPayments = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      method = "all",
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { "patient.name": { $regex: search, $options: "i" } },
        { "doctor.name": { $regex: search, $options: "i" } },
        { appointmentId: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status !== "all") {
      query.status = status;
    }

    // Payment method filter
    if (method !== "all") {
      query.paymentMethod = method;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get payments with pagination
    const payments = await Payment.find(query)
      .populate("doctor")
      .populate("patient")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPayments = await Payment.countDocuments(query);

    // Calculate revenue summary
    const summary = await calculateRevenueSummary(query);

    res.json({
      success: true,
      count: payments.length,
      totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: Number(page),
      payments,
      summary,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payments",
    });
  }
};

export const getPaymentDetails = async (req, res) => {
  try {
    const {sub : userId} = req.user
    const payment = await Payment.findOne({userId})
    //   .populate("patient", "name email phone")
    //   .populate("doctor", "name email")
      .populate("appointment");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment details",
    });
  }
};

export const getAllWithdrawals = async (req, res) => {
  try {
    const { search = "", status = "all", page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { "doctor.name": { $regex: search, $options: "i" } },
        { reference: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status !== "all") {
      query.status = status;
    }

    // Get withdrawals with pagination
    const withdrawals = await Withdrawal.find(query)
      .populate("doctor", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalWithdrawals = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      count: withdrawals.length,
      totalWithdrawals,
      totalPages: Math.ceil(totalWithdrawals / limit),
      currentPage: Number(page),
      withdrawals,
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching withdrawals",
    });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const {sub : userId} =req.user
    const withdrawal = await Withdrawal.findById({userId}).populate(
      "doctor"
    );

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal is not pending approval",
      });
    }

    // Check if doctor has sufficient balance
    if (withdrawal.doctor.balance < withdrawal.amount) {
      return res.status(400).json({
        success: false,
        message: "Doctor has insufficient balance",
      });
    }

    // Update withdrawal status
    withdrawal.status = "approved";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Deduct from doctor's balance
    await Doctor.findByIdAndUpdate(withdrawal.doctor._id, {
      $inc: { balance: -withdrawal.amount },
    });

    res.json({
      success: true,
      message: "Withdrawal approved successfully",
      withdrawal,
    });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Server error while approving withdrawal",
    });
  }
};

export const rejectWithdrawal = async (req, res) => {
  try {
    const {sub : userId} =req.user
    const { rejectionReason } = req.body;
    const withdrawal = await Withdrawal.findById({userId});

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal is not pending approval",
      });
    }

    // Update withdrawal status
    withdrawal.status = "rejected";
    withdrawal.rejectionReason = reason;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({
      success: true,
      message: "Withdrawal rejected successfully",
      withdrawal,
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Server error while rejecting withdrawal",
    });
  }
};

export const calculateRevenueSummaryGetter = async (query) => {
  try {
    const result = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          totalCommission: { $sum: "$commission" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalTransactions: 1,
          totalCommission: 1,
          netRevenue: { $subtract: ["$totalRevenue", "$totalCommission"] },
          averageRevenue: { $divide: ["$totalRevenue", "$totalTransactions"] },
        },
      },
    ]);

    return (
      result[0] || {
        totalRevenue: 0,
        averageRevenue: 0,
        totalTransactions: 0,
        totalCommission: 0,
        netRevenue: 0,
      }
    );
  } catch (error) {
    console.error("Error calculating revenue summary:", error);
    throw error;
  }
};
