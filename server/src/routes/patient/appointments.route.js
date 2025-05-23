import { Router } from "express";
import { appointmentChains, validate } from "../../validations";
import {appointmentController} from "../../controllers";

const router = Router();

router.post(
    "/:doctorId/book",
    validate(appointmentChains.validateAppointmentCreation),
    appointmentController.requestAppointment
);

router.get("/search", appointmentController.searchAppointments)

router.get(
    "/",
    validate(appointmentChains.validateGetAppointments),
    appointmentController.getPatientAppointments
);

router.get(
    "/:appointmentId",
    appointmentController.getAppointmentById
);

router.put(
    "/:appointmentId/cancel",
    validate(appointmentChains.validateCancelAppointment),
    appointmentController.patientCancelAppointment
);

router.post(
    "/:appointmentId/reschedule",
    validate(appointmentChains.validateRequestSchedule),
    appointmentController.requestAppointmentReschedule
)

router.put(
    "/:appointmentId/reschedule/:action",
    validate(appointmentChains.validateRespondToReschedule),
    appointmentController.respondToReschedule
)


export default router;