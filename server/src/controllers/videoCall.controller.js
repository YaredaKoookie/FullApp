import { isValidObjectId } from "mongoose";
import { env } from "../config";
import Appointment from "../models/appointment/appointment.model";
import Doctor from "../models/doctors/doctor.model";
import Patient from "../models/patient/patient.model";
import { ServerError } from "../utils";
import { RtcRole, RtcTokenBuilder } from "agora-token"

export const getVideoToken = async (req, res) => {
    const { channel } = req.query;
    const isPatient = req.user.role === "patient";
    const isDoctor = req.user.role === "doctor";

    if (!channel)
        throw ServerError.badRequest("Channel or appointment id is required");

    if (!isValidObjectId(channel))
        throw ServerError.badRequest("Invalid channel");

    if (!isPatient && !isDoctor)
        throw ServerError.badRequest("You are not authorized to join this appointment");

    // 35 minutes grace period before appointment
    const gracePeriodMs = 35 * 60 * 1000;

    const user = isPatient 
        ? await Patient.findOne({ user: req.user.sub })
        : await Doctor.findOne({ userId: req.user.sub });

    if (!user)
        throw ServerError.notFound("User not found");

    const appointment = await Appointment.findById(channel);

    if (!appointment)
        throw ServerError.notFound("Appointment not found");

    const uid = user._id.toString();
    
    // Check if user is either the patient or doctor of this appointment
    if (appointment.patient.toString() !== uid && appointment.doctor.toString() !== uid)
        throw ServerError.forbidden("You are not authorized to join this appointment");

    if (appointment.status !== "confirmed")
        throw ServerError.badRequest("Appointment is not confirmed yet");

    const now = Date.now();
    const start = new Date(appointment.slot.start).getTime() - gracePeriodMs;
    const end = new Date(appointment.slot.end).getTime();

    if (now < start) {
        const minutesUntilStart = Math.ceil((start - now) / (60 * 1000));
        throw ServerError.forbidden(`Video call will be available in ${minutesUntilStart} minutes`);
    }
    
    if (now > end) {
        throw ServerError.forbidden("This appointment has ended");
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
        env.AGORA_APP_ID,
        env.AGORA_APP_CERTIFICATE,
        channel,
        uid,
        role,
        privilegeExpiredTs
    );

    res.json({
        success: true,
        data: {
            token,
            uid,
        }
    });
};