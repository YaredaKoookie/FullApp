import { refundChapaPayment } from "../config/chapa.config";
import { APPOINTMENT_STATUS } from "../models/appointment/appointment.model";
import { REFUND_STATUS } from "../models/appointment/payment.model";
import ServerError from "./ServerError";
import { generateUniqueToken } from "./token.util";

/**
 * @param {import("mongoose").Document} payment
 * @return
 */

export const handleRefund = async (payment) => {
  const now = new Date();
  const appointmentTime = new Date(appointment.slot.start);
  const hoursBeforeAppointment = (appointmentTime - now) / (1000 * 60 * 60);

  if (
    hoursBeforeAppointment > 24 ||
    appointment.status === APPOINTMENT_STATUS.PAYMENT_PENDING
  ) {
    refundAmount = payment.amount; // Full refund
  } else if (hoursBeforeAppointment > 6) {
    refundAmount = Math.ceil(payment.amount * 0.5); // 50% refund
  }

  if (refundAmount > 0) {
    const hasPendingRefund = payment.refunds.some(
      (refund) => refund.status === REFUND_STATUS.PENDING
    );

    const totalRefunded = payment.refunds.reduce(
      (sum, refund) =>
        refund.status !== REFUND_STATUS.FAILED ? sum + refund.amount : sum,
      0
    );

    if (!hasPendingRefund && totalRefunded + refundAmount <= payment.amount) {
      const refundId = generateUniqueToken();

      const payload = {
        tx_ref: payment.referenceId,
        amount: refundAmount,
        reason: "Patient cancelled appointment",
        meta: { refundId },
      };

      console.log("payload", payload);

      const refundResponse = await refundChapaPayment(
        payment.referenceId,
        refundAmount,
        "Patient cancelled appointment",
        { refundId }
      );

      if (refundResponse.status !== "success")
        throw ServerError.internal("Refund failed");

      payment.refunds.push({
        refundId,
        amount: refundAmount,
        reason: "appointment_cancelled_by_patient",
        status: REFUND_STATUS.PENDING,
      });
    }
  }
};



/**
 * 
 * @param {string} referenceId the unique reference saved in payment model
 * @param {number} refundAmount the amount of money to refund 
 * @param {string} reason the reason of the refund
 * @returns {Promise<any>}
 */

export const initiateRefund = async (referenceId, refundAmount, reason) => {
  const refundId = generateUniqueToken();
  try {
    const refundResponse = await refundChapaPayment(
      referenceId,
      refundAmount,
      reason,
      { refundId }
    );
    return refundResponse;
  } catch (error) {
    throw error;
  }
};


