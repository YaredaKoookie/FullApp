import {Chapa} from "chapa-nodejs";
import env from "./env.config";
import axios from "axios";

const CHAPA_BASE_URL = 'https://api.chapa.co/v1'

const chapa = new Chapa({
    secretKey: env.CHAPA_SECRET_KEY,
})
export const refundChapaPayment = async (tx_ref, amount, reason, meta) => {
  try {
    const response = await axios.post(
      `${CHAPA_BASE_URL}/refund/${tx_ref}`,
      {
        reason, 
        amount,
        meta
      },
      {
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json' 
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Chapa refund error:", error.message);
    console.error("Chapa refund error message:", error?.response?.data?.message);
    throw new Error("Chapa refund request failed.");
  }
};

export const initializeChapaPaymentApi = async (data) => {
  try {
    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      data,
      {
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json' 
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Chapa error:", error?.response?.data?.message || "unknown message");
    throw new Error("Chapa request failed.");
  }
};

export default chapa;