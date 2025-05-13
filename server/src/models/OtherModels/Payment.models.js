import { Schema, model } from "mongoose";
const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"];
const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    method: {
      type: String,
      enum: ["cash", "card", "insurance", "online"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      required: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending",
    },
    transactionId: {
      type: String,
      default: null,
    },
    refundStats: {
      type: String,
      enum: ["none", "requested", "processed"],
      default: "none",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// module.exports = model("Payment", paymentSchema);
