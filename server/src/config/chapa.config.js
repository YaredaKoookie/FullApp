import {Chapa} from "chapa-nodejs";
import env from "./env.config";

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
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Chapa refund error:", error.message);
    throw new Error("Chapa refund request failed.");
  }
};

export default chapa;