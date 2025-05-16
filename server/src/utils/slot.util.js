import { Types } from "mongoose";
import Appointment from "../models/appointment/appointment.model";
import Schedule from "../models/schedule/Schedule.model";
import ServerError from "./ServerError";

/**
 *
 * @param {String} slotId
 * @param {String} doctorId
 * @param {String} patientId
 * @returns {Promise<{start: Date, end: Date}>}
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
      "Appointment has been allocated during this time"
    );

  return { start, end };
};

const checkSlots = async () => {
  const doctorId = "682496798292577847925a0f";
  const slotsToCheck = [
    {
      date: new Date("2024-05-20"), // Monday
      startTime: "09:00",
      endTime: "09:30", // 30-min slot
    },
    {
      date: new Date("2024-05-20"),
      startTime: "13:00",
      endTime: "13:30",
    },
    {
      date: new Date("2024-05-21"), // Tuesday
      startTime: "17:00",
      endTime: "17:30",
    },
  ];

  try {
    const { availableSlots, conflictingSlots } = await checkSlotAvailability(
      doctorId,
      slotsToCheck
    );

    console.log("Available Slots:", availableSlots);
    console.log("Conflicting Slots:", conflictingSlots);

    return availableSlots;
  } catch (error) {
    console.error("Error:", error.message);
  }
};

/**
 * Checks availability of multiple slots for a doctor
 * @param {ObjectId} doctorId - The doctor's ID
 * @param {Array} requestedSlots - Array of slots to check [{ date, startTime, endTime }]
 * @returns {Object} - { availableSlots: Array, conflictingSlots: Array }
 */

export const checkSlotAvailability = async (doctorId, requestedSlots) => {
  try {
    // Validate input
    if (!doctorId || !requestedSlots?.length) {
      throw new Error("Doctor ID and slots array are required");
    }

    // Get doctor's schedule with only relevant dates
    const uniqueDates = [
      ...new Set(requestedSlots.map((s) => s.date.toISOString().split("T")[0])),
    ];

    const schedule = await Schedule.findOne(
      { doctorId },
      {
        workingHours: 1,
        availableSlots: {
          $elemMatch: {
            date: { $in: uniqueDates.map((d) => new Date(d)) },
            isBooked: false,
          },
        },
        blockedSlots: {
          $elemMatch: {
            date: { $in: uniqueDates.map((d) => new Date(d)) },
          },
        },
        appointmentDuration: 1,
        timeSlotSettings: 1,
      }
    ).lean();

    if (!schedule) {
      throw new Error("Doctor schedule not found");
    }

    // Convert working hours to time format for comparison
    const workingHoursMap = schedule.workingHours.reduce((acc, day) => {
      acc[day.day] = {
        start: convertTimeToMinutes(day.startTime),
        end: convertTimeToMinutes(day.endTime),
        breaks:
          day.breaks?.map((b) => ({
            start: convertTimeToMinutes(b.startTime),
            end: convertTimeToMinutes(b.endTime),
          })) || [],
      };
      return acc;
    }, {});

    // Check each requested slot
    const results = requestedSlots.map((slot) => {
      const slotDate = new Date(slot.date);
      const dayName = slotDate.toLocaleDateString("en-US", { weekday: "long" });
      const slotStart = convertTimeToMinutes(slot.startTime);
      const slotEnd = convertTimeToMinutes(slot.endTime);

      // 1. Check if within working hours
      const workingDay = workingHoursMap[dayName];
      if (
        !workingDay ||
        slotStart < workingDay.start ||
        slotEnd > workingDay.end
      ) {
        return { ...slot, available: false, reason: "Outside working hours" };
      }

      // 2. Check if during break time
      const duringBreak = workingDay.breaks.some(
        (b) => slotStart < b.end && slotEnd > b.start
      );
      if (duringBreak) {
        return { ...slot, available: false, reason: "During break time" };
      }

      // 3. Check if blocked
      const isBlocked = schedule.blockedSlots?.some((blocked) => {
        const blockedStart = convertTimeToMinutes(blocked.startTime);
        const blockedEnd = convertTimeToMinutes(blocked.endTime);
        return (
          isSameDate(blocked.date, slotDate) &&
          slotStart < blockedEnd &&
          slotEnd > blockedStart
        );
      });
      if (isBlocked) {
        return { ...slot, available: false, reason: "Blocked by doctor" };
      }

      // 4. Check if already booked
      const isBooked = schedule.availableSlots?.some(
        (avail) =>
          isSameDate(avail.date, slotDate) &&
          avail.startTime === slot.startTime &&
          avail.endTime === slot.endTime &&
          avail.isBooked
      );
      if (isBooked) {
        return { ...slot, available: false, reason: "Already booked" };
      }

      // 5. Check if matches appointment duration
      const slotDuration = slotEnd - slotStart;
      if (slotDuration !== schedule.appointmentDuration) {
        return {
          ...slot,
          available: false,
          reason: `Duration mismatch (needs ${schedule.appointmentDuration} mins)`,
        };
      }

      // 6. Check buffer time between appointments
      const hasBufferConflict = schedule.availableSlots?.some((avail) => {
        const availStart = convertTimeToMinutes(avail.startTime);
        const availEnd = convertTimeToMinutes(avail.endTime);
        return (
          isSameDate(avail.date, slotDate) &&
          (Math.abs(availStart - slotStart) <
            schedule.timeSlotSettings.bufferTime ||
            Math.abs(availEnd - slotEnd) < schedule.timeSlotSettings.bufferTime)
        );
      });
      if (hasBufferConflict) {
        return { ...slot, available: false, reason: "Buffer time violation" };
      }

      // If all checks passed
      return { ...slot, available: true };
    });

    return {
      availableSlots: results.filter((s) => s.available),
      conflictingSlots: results.filter((s) => !s.available),
    };
  } catch (error) {
    console.error("Slot availability check failed:", error);
    throw error;
  }
};

function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

function isSameDate(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

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

export const blockAvailableSlot = (doctorId, slotId) => {
  const slotObjectId = new Types.ObjectId(slotId);
  return Schedule.updateOne(
    {
      doctorId,
      "availableSlots._id": slotObjectId,
      "availableSlots.isBooked": false, // Ensure the slot is not already booked
    },
    {
      $set: {
        "availableSlots.$.isBooked": true, // The $ operator identifies the matched element
      },
    }
  );
};