import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be positive"],
    },
    // bankDetails: {
    //   accountNumber: {
    //     type: String,
    //     required: true,
    //   }
    // },
    accountNumber: { type: String, required: true },
    reference: {
      type: String,
      unique: true,
      default: function () {
        // Generate a unique reference (e.g., WDR-20230516-12345)
        return `WDR-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed"],
      default: "pending",
    },
    rejectionReason: String,
    processedAt: Date,
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // If admins can initiate withdrawals
    },
  },
  { timestamps: true }
);

// Add index for frequently queried fields
withdrawalSchema.index({ doctor: 1, status: 1 });
withdrawalSchema.index({ createdAt: -1 });

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;
