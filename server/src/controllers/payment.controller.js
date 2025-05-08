import axios from 'axios';
import Appointment from '../models/appointment/appointment.model';
import Payment from '../models/OtherModels/Payment.models';
import Patient from '../models/patient/patient.model';

export  const initiatePayment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const patient = await Patient.findById(userId);
    const { appointmentId } = req.params;
    
    // 1. Validate appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'consultationFee');
    if (!appointment || appointment.patient.toString() !== patient) {
      return res.status(404).json({ message: 'Appointment not found or access denied' });
    }
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: 'Appointment not approved yet' });
    }

    // 2. Prepare Telebirr payment request
    const amount = appointment.doctor.consultationFee;    // your unit price
    const callbackUrl = `${process.env.APP_URL}/payment/telebirr/callback`;
    const telebirrPayload = {
      merchantId: process.env.TELEBIRR_MERCHANT_ID,
      orderId:    appointmentId,                          // unique per transaction
      amount:     amount,
      currency:   'ETB',
      callback:   callbackUrl,
      description: `Payment for appointment ${appointmentId}`
    };

    // 3. Call Telebirr API
    const telebirrResponse = await axios.post(
      'https://api.telebirr.et/merchant/v1/pay', 
      telebirrPayload,
      { headers: { 'Authorization': `Bearer ${process.env.TELEBIRR_API_KEY}` } }
    );

    if (telebirrResponse.data.status !== 'OK') {
      throw new Error('Telebirr initiation failed');
    }

    // 4. Create a pending transaction
    const transaction = await Payment.create({
      user:        patient,
      type:        'payment',
      amount,
      status:      'pending',
      reference:   telebirrResponse.data.paymentReference
    });

    // 5. Return the Telebirr payment URL (customer scans or is redirected)
    return res.status(200).json({
      message:      'Telebirr payment initiated',
      paymentUrl:   telebirrResponse.data.paymentUrl,
      transactionId: transaction._id
    });
  } catch (err) {
    console.error('Error initiating Telebirr payment:', err);
    return res.status(500).json({
      message: 'Failed to initiate payment',
      error: err.message
    });
  }
};


export const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.sub;
    const patient = await Patient.findById(userId);  
    const { appointmentId } = req.params;

    // 1. Validate appointment ownership
    const appointment = await Appointment.findById(appointmentId).populate('doctor', 'consultationFee');
    if (!appointment || appointment.patient.toString() !== patient) {
      return res.status(404).json({ message: 'Appointment not found or access denied' });
    }

    // 2. Find the pending or latest transaction for this appointment
    const transaction = await Payment.findOne({
      user: patient,
      type: 'payment',
      reference: appointmentId  // assuming you stored appointmentId in reference or metadata
    }).sort({ createdAt: -1 });

    if (!transaction) {
      return res.status(404).json({ message: 'No payment record found for this appointment' });
    }

    // 3. If still pending, optionally refresh status from provider
    if (transaction.status === 'pending' && process.env.TELEBIRR_API_KEY) {
      // Example Telebirr status check
      const resp = await axios.get(
        `https://api.telebirr.et/merchant/v1/status/${transaction.reference}`,
        { headers: { 'Authorization': `Bearer ${process.env.TELEBIRR_API_KEY}` } }
      );
      const providerStatus = resp.data.status; // e.g. 'PAID' or 'FAILED'

      // Map provider statuses to your internal ones
      const statusMap = {
        PAID:     'success',
        FAILED:   'failed',
        PENDING:  'pending'
      };

      transaction.status = statusMap[providerStatus] || transaction.status;
      await transaction.save();

      // Mark appointment paid if success
      if (transaction.status === 'success') {
        appointment.isPaid = true;
        await appointment.save();
      }
    }

    // 4. Respond with current status
    return res.status(200).json({
      message: 'Payment status retrieved successfully',
      payment: {
        amount:       transaction.amount,
        status:       transaction.status,
        transactionId: transaction._id,
        reference:     transaction.reference,
        createdAt:     transaction.createdAt
      }
    });
  } catch (err) {
    console.error('Error fetching payment status:', err);
    return res.status(500).json({
      message: 'An error occurred while fetching payment status',
      error: err.message
    });
  }
};

export const processRefund = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const adminId = req.user.userId;

    // 1. Fetch appointment & ensure it was paid
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || !appointment.isPaid) {
      return res.status(400).json({ message: 'Appointment is not paid or does not exist' });
    }

    // 2. Find the original payment transaction
    const originalTxn = await Payment.findOne({
      reference: appointmentId,
      type:      'payment',
      status:    'success'
    });
    if (!originalTxn) {
      return res.status(404).json({ message: 'Original payment transaction not found' });
    }

    // 3. Call the provider’s refund API
    //    Example: Telebirr refund endpoint
    const refundResp = await axios.post(
      'https://api.telebirr.et/merchant/v1/refund',
      {
        merchantId: process.env.TELEBIRR_MERCHANT_ID,
        paymentReference: originalTxn.reference,
        amount: originalTxn.amount,
        reason: req.body.reason || 'Admin-initiated refund'
      },
      { headers: { Authorization: `Bearer ${process.env.TELEBIRR_API_KEY}` } }
    );
    if (refundResp.data.status !== 'OK') {
      throw new Error('Provider refund failed');
    }

    // 4. Record the refund transaction
    const refundTxn = await Payment.create({
      user:      appointment.patient,
      type:      'refund',
      amount:    originalTxn.amount,
      status:    'success',
      reference: refundResp.data.refundReference,
      metadata:  { adminId }
    });

    // 5. Update appointment & original txn
    appointment.isPaid     = false;
    appointment.refundStatus = 'processed';
    await appointment.save();

    originalTxn.status = 'refunded';
    await originalTxn.save();

    return res.status(200).json({
      message: 'Refund processed successfully',
      refundTransaction: refundTxn
    });
  } catch (err) {
    console.error('Error processing refund:', err);
    return res.status(500).json({
      message: 'An error occurred while processing the refund',
      error: err.message
    });
  }
};
