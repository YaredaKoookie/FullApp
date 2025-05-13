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