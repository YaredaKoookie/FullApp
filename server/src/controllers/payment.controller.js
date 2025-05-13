import Appointment, {
  APPOINTMENT_STATUS,
} from "../models/appointment/appointment.model";

import Payment, {
  PAYMENT_STATUS,
} from "../models/appointment/payment.model";

import Patient from "../models/patient/patient.model";
import { ServerError } from "../utils";
import { chapa, env } from "../config";

export const initiatePayment = async (req, res) => {
  const appointmentId = req.params?.appointmentId;
  const currency = req.body?.currency || "ETB";

  if (!["ETB", "USD"].includes(currency))
    throw ServerError.badRequest(
      "Only ETB or USD are allowed as a currency to pay"
    );

  if (!appointmentId)
    throw ServerError.badRequest("appointment id is required");

  const patient = await Patient.findOne({ userId: req.user.sub })
    .select("_id user")
    .populate("user", "email");

  if (patient) throw ServerError.notFound("Patient not found");

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) throw ServerError.notFound("Appointment not found");

  if (!appointment.doctor)
    throw ServerError.notFound("Doctor for this appointment cannot be found");

  if (appointment.patient.toString() !== patient._id.toString())
    throw ServerError.badRequest(
      "Payment is allowed only for the owner of the appointment"
    );

  if (appointment.status !== APPOINTMENT_STATUS.ACCEPTED)
    throw ServerError.badRequest(
      "Payment is allowed only for doctor accepted appointments"
    );

  let payment = await Payment.findOne({ appointment: appointment._id });

  if (payment)
    throw ServerError.badRequest(
      "Payment has already been initiated for this appointment"
    );

  payment = new Payment({
    patient: patient._id,
    appointment: appointment._id,
    doctor: appointment.doctor,
    amount: appointment.fee,
    currency,
    status: PAYMENT_STATUS.PENDING,
  });

  appointment.status = APPOINTMENT_STATUS.PAYMENT_PENDING;

  await appointment.save();
  await payment.save();

  res.json({
    success: true,
    data: {
      payment,
    },
  });
};

export const initializeChapaPayment = async (req, res) => {
  const { paymentId } = req.params;

  const patient = await Patient.findOne({ user: req.user.sub });

  if (patient) throw ServerError.notFound("Patient not found");

  const payment = await Payment.findOne({
    _id: paymentId,
    patient: patient._id,
  });

  if (!payment) throw ServerError.notFound("Payment not found or initiated");

  if (payment.status !== PAYMENT_STATUS.PENDING)
    throw ServerError.badRequest("Payment is not in pending state");

  const tx_ref = chapa.genTxRef({
    prefix: `appointment_${payment._id}_${Date.now()}`,
  });

  const response = await chapa.initialize({
    first_name: patient.firstName,
    last_name: patient.lastName,
    email: patient.user.email,
    currency: payment.currency || "ETB",
    amount: payment.amount,
    tx_ref,
    callback_url: `${env.SERVER_URL}/payment/callback`,
    return_url: `${env.FRONTEND_URL}/patient/payment/callback`,
    customization: {
      title: "Appointment Payment",
      description: "Payment for medical appointment",
    },
  });

  if (response.status !== "success")
    throw ServerError.internal("Failed to initialize payment");

  payment.transactionId = response.data.tx_ref;
  await payment.save();

  res.status(201).json({
    success: true,
    message: "Payment initialized successfully",
    data: {
      payment_url: response.data.checkout_url,
    },
  });
};