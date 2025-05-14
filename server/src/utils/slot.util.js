import Appointment from "../models/appointment/appointment.model";
import Schedule from "../models/schedule/Schedule.model";
import ServerError from "./ServerError";

/**
 *
 * @param {String} slotId
 * @param {String} doctorId
 * @param {String} patientId
 * @returns {{start: Date, end: Date}}
 */

export const handleSlotConflict = async (slotId, doctorId, patientId) => {
  const schedule = await Schedule.findOne({
    doctorId,
    availableSlots: {
      $elemMatch: {
        _id: slotId,
        isBooked: false,
      },
    },
  });

  if (!schedule) {
    throw ServerError.notFound("Schedule not found or already booked slot");
  }

  const bookedSlot = schedule.availableSlots.find(
    (slot) => slot._id.toString() === slotId
  );

  const start = new Date(
    `${bookedSlot.date.toISOString().split("T")[0]}T${bookedSlot.startTime}:00`
  );
  const end = new Date(
    `${bookedSlot.date.toISOString().split("T")[0]}T${bookedSlot.endTime}:00`
  );

  const slotQuery = {
    "slot.start": { $lt: end },
    "slot.end": { $gt: start },
  };

  const existingAppointment = await Appointment.findOne({
    patient: patientId,
    $or: [{ slotQuery }],
  });

  if (existingAppointment)
    throw ServerError.badRequest(
      "Patient already has an appointment during this time"
    );

  return { start, end };
};

export const releaseBlockedSlot = (doctorId, slotId) => {
  return Schedule.updateOne(
    {
      doctorId,
      "availableSlots._id": slotId,
      "availableSlots.isBooked": true, // Ensure the slot is not already booked
    },
    {
      $set: {
        "availableSlots.$.isBooked": false, // The $ operator identifies the matched element
      },
    }
  );
};
