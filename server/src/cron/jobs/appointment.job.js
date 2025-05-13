import Appointment, {
  APPOINTMENT_STATUS,
} from "../../models/appointment/appointment.model";
import { logger } from "../../utils";

export async function markCompletedAppointments() {
  try {
    const now = new Date();
    const updated = await Appointment.updateMany(
      {
        "slot.end": { $lt: now },
        status: {
          $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.RESCHEDULED],
        },
      },
      {
        $set: { status: APPOINTMENT_STATUS.COMPLETED },
      }
    );
    logger.info(
      `Cron: Marked ${updated.modifiedCount} appointments as completed`
    );
  } catch (error) {
    logger.error(`Cron: Failed to update appointments`, error);
  }
}
