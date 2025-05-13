import { body, param } from "express-validator";


const CURRENCY_OPTIONS = ['ETB', 'USB'];

export const validateInitiatePayment = [
    param("appointmentId")
    .notEmpty()
    .withMessage("Appointment is required")
    .isMongoId()
    .withMessage("Invalid appointment id format"),
    body("currency")
    .optional()
    .isIn(CURRENCY_OPTIONS)
    .withMessage(`Allowed currencies are ${CURRENCY_OPTIONS.join(", ")}`)
]

export const validateInitializePayment = [
    param("paymentId")
    .notEmpty()
    .withMessage("Payment id is required")
    .isMongoId()
    .withMessage("Invalid payment id format is provided")
]

export const validateChapaCallback = [
    body("tx_ref").notEmpty().withMessage("Transaction reference is required"),
    body("status").notEmpty().withMessage("Payment status is required"),
    body("ref_id").notEmpty().withMessage("Reference is is required")
]

export const validateRefundRequest = [
  body("tx_ref").notEmpty().withMessage("Transaction reference is required."),
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than 0."),
  body("reason").notEmpty().withMessage("Refund reason is required."),
];