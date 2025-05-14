import express from "express";
import {
  generateSlots,
  getSlots,
  updateSlot,
  deleteSlot,
  addBlockedSlot,
  getBlockedSlots,
  removeBlockedSlot,
  getSchedule,
  createSchedule,
  updateSchedule,
  getAvailableSlotsForPatients,
  bookAppointmentSlot
} from "../controllers/scheduleController.js";
import { validate } from "../validations";
import {
  generateSlotsValidation,
  slotIdValidation,
  updateSlotValidation,
  blockedSlotValidation,
  blockIdValidation,
  doctorIdValidation,
  createScheduleValidation,
  updateScheduleValidation,
} from "../validations/chains/scheduleValidation.js";
import { param, validationResult } from "express-validator";
import {isDoctor ,isPatient } from '../middlewares/auth.middleware';

const router = express.Router();


// Generate slots for a doctor (automated based on workingHours)
router.post(
  "/:doctorId/slots/generate",
  generateSlots
);

// Get all available slots for a doctor
router.get("/:doctorId/slots",  getSlots);

// Update a slot (e.g., mark as booked)
router.put(
  "/:doctorId/slots/:slotId",
  updateSlot
);

// Delete a slot
router.delete(
  "/:doctorId/slots/:slotId",
  deleteSlot
);

// Add these routes after the existing ones
router.post(
  "/:doctorId/blocked",
  addBlockedSlot
);

router.get(
  "/:doctorId/blocked",
  getBlockedSlots
);

router.delete(
  "/:doctorId/blocked/:blockId",
  removeBlockedSlot
);




// Get doctor's schedule
router.get("/:doctorId" , getSchedule);  // done

// Create initial schedule (first-time setup)
router.post("/:doctorId", createSchedule);   //done

// Update schedule (working hours, breaks, etc.)
router.put("/:doctorId", updateSchedule);   // con





// 

router.get(
  '/doctors/:doctorId/available-slots', 
  getAvailableSlotsForPatients
);


router.put(
  '/doctors/:doctorId/slots/:slotId/book',
  isPatient,
  bookAppointmentSlot
);

// 
export default router;