import Payment from "../models/appointment/payment.model.js";
import Withdrawal from "../models/doctors/withdrawal.models.js";
import Appointment from "../models/appointment/appointment.model.js";
import { PAYMENT_STATUS } from "../models/appointment/payment.model";
import Doctor from "../models/doctors/doctor.model.js";

// Get payment statistics for dashboard
export const getPaymentStats = async (req, res) => {
  try {
    const { sub: userId } = req.user;

    // console.log("user", req.user)

    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;
// console.log(doctor)
    // console.log("this is the doc id", doctorId);

    // Calculate total earnings (sum of all paid appointments)
    const totalEarnings = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: PAYMENT_STATUS.PAID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Calculate pending balance (paid but not yet cleared for withdrawal)
    // Assuming you have a system to mark payments as cleared for withdrawal
    const pendingBalance = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: PAYMENT_STATUS.PAID,
          clearedForWithdrawal: false, // Assuming this field exists
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Calculate available balance (paid and cleared for withdrawal)
    const availableBalance = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: PAYMENT_STATUS.PAID,
          clearedForWithdrawal: true, // Assuming this field exists
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    console.log(availableBalance)

    // Get last successful withdrawal
    const lastPayment = await Withdrawal.findOne({
      doctor: doctorId,
      status: { $in: ["approved", "processed"] },
    }).sort({ processedAt: -1 });

    res.json({
      success: true,
      data: {
        totalEarnings: totalEarnings[0]?.total || 0,
        pendingBalance: pendingBalance[0]?.total || 0,
        availableBalance: availableBalance[0]?.total || 0,
        lastPaymentDate: lastPayment?.processedAt || null,
      },
    });
  } catch (error) {
    console.error("Error in getPaymentStats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment stats",
    });
  }
};

// Get earnings breakdown
export const getEarnings = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    console.log(doctorId);

    const query = { doctor: doctorId };
    if (status) query.status = status;

    const earnings = await Payment.find(query)
      .populate({
        path: "patient",
        select: "firstName lastName",
      })
      .populate({
        path: "appointment",
        select: "dateTime",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await Payment.countDocuments(query);

    const formattedEarnings = earnings.map((payment) => ({
      id: payment._id,
      appointmentId: payment.appointment?._id || "N/A",
      appointmentDate: payment.appointment?.dateTime || null,
      patientName: payment.patient
        ? `${payment.patient.firstName} ${payment.patient.lastName}`
        : "Unknown",
      amount: payment.amount,
      currency: payment.currency,
      date: payment.createdAt,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      referenceId: payment.referenceId,
    }));

    res.json({
      success: true,
      data: formattedEarnings,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in getEarnings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching earnings",
    });
  }
};

// Get withdrawal history
export const getWithdrawals = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { doctor: doctorId };
    if (status) query.status = status;

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await Withdrawal.countDocuments(query);

    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      id: withdrawal._id,
      reference: withdrawal.reference,
      amount: withdrawal.amount,
      requestedDate: withdrawal.createdAt,
      processedAt: withdrawal.processedAt,
      status: withdrawal.status,
      rejectionReason: withdrawal.rejectionReason,
      bankDetails: {
        bankName: withdrawal.bankDetails.bankName,
        accountNumber: withdrawal.bankDetails.accountNumber
          .slice(-4)
          .padStart(withdrawal.bankDetails.accountNumber.length, "*"),
        accountName: withdrawal.bankDetails.accountName,
      },
    }));

    res.json({
      success: true,
      data: formattedWithdrawals,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in getWithdrawals:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching withdrawal history",
    });
  }
};

// Request a withdrawal
export const requestWithdrawal = async (req, res) => {
  try {
    const { sub: userId } = req.user;
    const doctor = await Doctor.findOne({ userId }).select('_id');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const { amount, accountNumber } = req.body; // Now directly getting accountNumber from body

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal amount must be positive",
      });
    }

    // Validate accountNumber exists
    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Account number is required",
      });
    }

    // Calculate available balance
    const availableBalanceResult = await Payment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          status: PAYMENT_STATUS.PAID,
          clearedForWithdrawal: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const availableBalance = availableBalanceResult[0]?.total || 0;

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal amount exceeds available balance",
        availableBalance,
      });
    }

    // Create withdrawal request with just accountNumber
    const withdrawal = new Withdrawal({
      doctor: doctor._id,
      amount,
      accountNumber, // Storing just the account number directly
      status: "pending",
      initiatedBy: doctor._id,
    });

    await withdrawal.save();

    res.status(201).json({
      success: true,
      data: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        requestedDate: withdrawal.createdAt,
        maskedAccountNumber: `••••${withdrawal.accountNumber.slice(-4)}` // Mask account number in response
      },
      message: "Withdrawal request submitted successfully",
    });
  } catch (error) {
    console.error("Error in requestWithdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing withdrawal request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin-only: Process withdrawal
export const processWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either "approved" or "rejected"',
      });
    }

    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting a withdrawal",
      });
    }

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal request has already been processed",
      });
    }

    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    withdrawal.initiatedBy = adminId;

    if (status === "rejected") {
      withdrawal.rejectionReason = rejectionReason;

      // If you marked payments as being processed, you might want to mark them as available again
      // await Payment.updateMany(
      //   { withdrawalRequest: withdrawal._id },
      //   { $set: { clearedForWithdrawal: true }, $unset: { withdrawalRequest: 1 } }
      // );
    }

    await withdrawal.save();

    res.json({
      success: true,
      data: withdrawal,
      message: `Withdrawal request ${status} successfully`,
    });
  } catch (error) {
    console.error("Error in processWithdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing withdrawal",
    });
  }
};
