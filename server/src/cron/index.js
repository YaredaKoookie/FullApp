import cron from "node-cron"
import {CRON_SCHEDULES} from "./cron.config"
import { appointmentJobs } from "./jobs";
import { logger } from "../utils";

export function initCronJobs(){
  cron.schedule(CRON_SCHEDULES.APPOINTMENT_COMPLETION, appointmentJobs.markCompletedAppointments);

  logger.info("Cron jobs initialized");
}