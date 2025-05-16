import mongoose from "mongoose";


export const PAYMENT_STATUS = {
    PENDING: "pending",
    PAID: "paid",
    FAILED: "failed",
    CANCELLED: 'cancelled',
    REFUND_INITIATED: "refund_initiated",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded"
}

export const REFUND_STATUS = {
    PENDING: "pending",
    PROCESSED: "processed",
    FAILED: "failed"
}

const refundSchema = new mongoose.Schema({
    refundId: {type: String, required: true},
    amount: {type: Number, required: true},
    reason: {type: String, required: true},
    status: {type: String, enum: Object.values(REFUND_STATUS), default: REFUND_STATUS.PENDING},
    processedAt: {type: Date},
    totalRefunded: {type: Number, required: true}
})

const paymentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    amount: {
        type: Number, 
        required: true,
    },
    currency: {
        type: String, 
        default: 'ETB'
    },
    status: {
        type: String, 
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING
    },
    paymentMethod: {
        type: String,
    },
    referenceId: {
        type: String, 
        default: null,
        index: true
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentDate: {
        type: Date
    },
    refunds: {
        type: [refundSchema],
        required: false
    },
    failureReason: {type: String}
}, {timestamps: true})


export default mongoose.model("Payment", paymentSchema);