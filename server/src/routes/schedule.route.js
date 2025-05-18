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
const router = express.Router();

router.post(
  "/:doctorId/slots/generate",
  generateSlots
);

router.get("/:doctorId/slots",  getSlots);

router.put(
  "/:doctorId/slots/:slotId",
  updateSlot
);

router.delete(
  "/:doctorId/slots/:slotId",
  deleteSlot
);

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
router.post("/:doctorId", createSchedule);   // done

// Update schedule (working hours, breaks, etc.)
router.put("/:doctorId", updateSchedule);   // done





// 

router.get(
  '/doctors/:doctorId/available-slots', 
  getAvailableSlotsForPatients
);


router.put(
  '/doctors/:doctorId/slots/:slotId/book',
  // isPatient,
  bookAppointmentSlot
);

// 
export default router;