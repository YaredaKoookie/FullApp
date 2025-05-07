import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
    token: {
        type: String, 
        required: true,
    },
    email: {
        type: String, 
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    used: {
        type: Boolean, 
        default: false
    },
    type: {
        type: String,
        enum: ["email-verification", "magic-link", "password-reset"],
        required: true,
    },
    payload: {
        type: mongoose.Schema.Types.Mixed
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    }
});

// Create a TTL index on the `expiresAt` field
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Token", tokenSchema);