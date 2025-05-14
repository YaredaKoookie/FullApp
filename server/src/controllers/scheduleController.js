import Schedule from "../models/schedule/Schedule.model";
import mongoose from "mongoose";
import Appointment, {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
} from "../models/appointment/appointment.model";
// Generate slots based on workingHours
export const generateSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.body;


    console.log(doctorId)
    // 1. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_DOCTOR_ID",
        message: "Invalid doctor ID format",
        received: doctorId,
        schemaRequirement: "MongoDB ObjectId",
      });
    }

    // 2. Validate date inputs
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        errorType: "MISSING_DATES",
        message: "Both startDate and endDate are required",
        schemaRequirement: {
          startDate: "ISO date string (required)",
          endDate: "ISO date string (required)",
        },
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_DATE_FORMAT",
        message: "Dates must be valid ISO format strings",
        invalidDates: {
          startDate: isNaN(start.getTime()) ? startDate : "valid",
          endDate: isNaN(end.getTime()) ? endDate : "valid",
        },
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_DATE_RANGE",
        message: "startDate must be before endDate",
        dateRange: {
          startDate,
          endDate,
          differenceInDays: Math.round((end - start) / (1000 * 60 * 60 * 24)),
        },
      });
    }

    // 3. Validate date range isn't too large (performance protection)
    const maxDays = 90; // 3 months max
    const daysDifference = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (daysDifference > maxDays) {
      return res.status(400).json({
        success: false,
        errorType: "DATE_RANGE_TOO_LARGE",
        message: `Date range exceeds maximum of ${maxDays} days`,
        receivedDays: daysDifference,
        maxAllowedDays: maxDays,
      });
    }

    // 4. Fetch schedule with required fields only
    const schedule = await Schedule.findOne({ doctorId })
      .select(
        "workingHours appointmentDuration timeSlotSettings blockedSlots availableSlots"
      )
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        errorType: "SCHEDULE_NOT_FOUND",
        message: "No schedule exists for this doctor",
        doctorId,
        solution: "Create a schedule first with working hours",
      });
    }

    // 5. Validate schedule has working hours
    if (!schedule.workingHours || schedule.workingHours.length === 0) {
      return res.status(400).json({
        success: false,
        errorType: "NO_WORKING_HOURS",
        message: "Cannot generate slots - no working hours configured",
        schemaRequirement: {
          workingHours:
            "[{ day: 'Monday'...'Sunday', startTime: 'HH:MM', endTime: 'HH:MM' }]",
        },
      });
    }

    // 6. Prepare time calculation utilities
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    };

    // 7. Generate slots
    const generatedSlots = [];
    const {
      workingHours,
      appointmentDuration = 30,
      timeSlotSettings = {},
    } = schedule;
    const { interval = 15, bufferTime = 5 } = timeSlotSettings;

    for (
      let currentDate = new Date(start);
      currentDate <= end;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dayConfig = workingHours.find((day) => day.day === dayName);

      if (!dayConfig) continue;

      const dayStr = currentDate.toISOString().split("T")[0];
      const dayBlockedSlots = (schedule.blockedSlots || []).filter(
        (blocked) => {
          const blockedDay = blocked.date.toISOString().split("T")[0];
          return blockedDay === dayStr;
        }
      );

      let currentTime = timeToMinutes(dayConfig.startTime);
      const endTime = timeToMinutes(dayConfig.endTime);

      while (currentTime + appointmentDuration <= endTime) {
        const slotStart = minutesToTime(currentTime);
        const slotEnd = minutesToTime(currentTime + appointmentDuration);

        // Check against breaks
        const isBreak = (dayConfig.breaks || []).some((breakItem) => {
          const breakStart = timeToMinutes(breakItem.startTime);
          const breakEnd = timeToMinutes(breakItem.endTime);
          return (
            (currentTime >= breakStart && currentTime < breakEnd) ||
            (currentTime + appointmentDuration > breakStart &&
              currentTime + appointmentDuration <= breakEnd)
          );
        });

        // Check against blocked slots
        const isBlocked = dayBlockedSlots.some((blocked) => {
          const blockedStart = timeToMinutes(blocked.startTime);
          const blockedEnd = timeToMinutes(blocked.endTime);
          return (
            (currentTime >= blockedStart && currentTime < blockedEnd) ||
            (currentTime + appointmentDuration > blockedStart &&
              currentTime + appointmentDuration <= blockedEnd)
          );
        });

        if (!isBreak && !isBlocked) {
          generatedSlots.push({
            date: new Date(currentDate),
            startTime: slotStart,
            endTime: slotEnd,
            isBooked: false,
          });
        }

        currentTime += appointmentDuration + bufferTime;
      }
    }

    // 8. Update schedule with new slots (atomic operation)
    const result = await Schedule.updateOne(
      { doctorId },
      {
        $push: { availableSlots: { $each: generatedSlots } },
        $set: { lastGenerated: new Date() },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        errorType: "SLOT_GENERATION_FAILED",
        message: "Failed to save generated slots to database",
      });
    }

    // 9. Success response
    return res.status(201).json({
      success: true,
      data: {
        generatedCount: generatedSlots.length,
        dateRange: { startDate, endDate },
        firstSlot: generatedSlots[0],
        lastSlot: generatedSlots[generatedSlots.length - 1],
        appointmentDuration,
        timeSlotSettings: {
          interval,
          bufferTime,
        },
      },
    });
  } catch (error) {
    console.error(`[Slot Generation Error] Doctor`, error);

    return res.status(500).json({
      success: false,
      errorType: "INTERNAL_ERROR",
      message: "Failed to generate time slots",
      systemError:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      schemaRequirements: {
        workingHours: {
          day: "enum: ['Monday'...'Sunday']",
          startTime: "String (HH:MM)",
          endTime: "String (HH:MM)",
          breaks: "[{ startTime: String, endTime: String }]",
        },
        appointmentDuration: "enum: [15, 30, 45, 60]",
        timeSlotSettings: {
          interval: "Number",
          bufferTime: "Number",
        },
      },
    });
  }
};

// Get all available slots with filtering options
export const getSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, isBooked, upcomingOnly } = req.query;

    // Validate doctorId
    if (!doctorId) {
      return res.status(400).json({ message: "Valid doctorId is required" });
    }

    // Find schedule with optional population of doctor details
    const schedule = await Schedule.findOne({ doctorId }).populate(
      "doctorId",
      "name specialization -_id"
    ); // Optional: include basic doctor info

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found for this doctor" });
    }

    let slots = schedule.availableSlots;

    // Apply filters if provided
    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      slots = slots.filter(
        (slot) =>
          new Date(slot.date).toDateString() === targetDate.toDateString()
      );
    }

    if (isBooked !== undefined) {
      const bookedFilter = isBooked === "true";
      slots = slots.filter((slot) => slot.isBooked === bookedFilter);
    }

    if (upcomingOnly === "true") {
      const now = new Date();
      slots = slots.filter(
        (slot) => new Date(slot.date) >= new Date(now.setHours(0, 0, 0, 0))
      );
    }

    // Sort slots by date and time
    slots.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    // Format response with metadata
    const response = {
      doctor: schedule.doctorId, // Will be populated if using .populate()
      totalSlots: slots.length,
      available: slots.filter((s) => !s.isBooked).length,
      booked: slots.filter((s) => s.isBooked).length,
      slots,
      generatedAt: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching slots:", error);

    // Handle specific errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid doctorId format" });
    }

    res.status(500).json({
      message: "Error retrieving slots",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update a slot (e.g., mark as booked)
export const updateSlot = async (req, res) => {
  try {
    const { doctorId, slotId } = req.params;
    const { isBooked, startTime, endTime, date } = req.body;

    // 1. Validate ObjectId formats (schema requires ObjectId for doctorId)
    if (
      !mongoose.Types.ObjectId.isValid(doctorId) ||
      !mongoose.Types.ObjectId.isValid(slotId)
    ) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_ID_FORMAT",
        message: "Invalid ID format - must be MongoDB ObjectId",
        invalidFields: [
          ...(!mongoose.Types.ObjectId.isValid(doctorId) ? ["doctorId"] : []),
          ...(!mongoose.Types.ObjectId.isValid(slotId) ? ["slotId"] : []),
        ],
      });
    }

    // 2. Find schedule with only necessary fields (performance optimization)
    const schedule = await Schedule.findOne({ doctorId })
      .select("availableSlots")
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        errorType: "SCHEDULE_NOT_FOUND",
        message: "No schedule exists for this doctor",
        doctorId,
      });
    }

    // 3. Find the specific slot
    const slot = schedule.availableSlots.find(
      (s) => s._id.toString() === slotId
    );
    if (!slot) {
      return res.status(404).json({
        success: false,
        errorType: "SLOT_NOT_FOUND",
        message: "The specified time slot doesn't exist",
        slotId,
        availableSlotsCount: schedule.availableSlots.length,
      });
    }

    // 4. Validate update fields against schema requirements
    const updates = {};
    const validationErrors = [];

    if (isBooked !== undefined) {
      if (typeof isBooked !== "boolean") {
        validationErrors.push({
          field: "isBooked",
          message: "Must be a boolean",
          received: typeof isBooked,
        });
      } else {
        updates["availableSlots.$[elem].isBooked"] = isBooked;
      }
    }

    if (startTime) {
      if (
        typeof startTime !== "string" ||
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)
      ) {
        validationErrors.push({
          field: "startTime",
          message: "Must be in HH:MM format",
          received: startTime,
        });
      } else {
        updates["availableSlots.$[elem].startTime"] = startTime;
      }
    }

    if (endTime) {
      if (
        typeof endTime !== "string" ||
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)
      ) {
        validationErrors.push({
          field: "endTime",
          message: "Must be in HH:MM format",
          received: endTime,
        });
      } else {
        updates["availableSlots.$[elem].endTime"] = endTime;
      }
    }

    if (date) {
      if (isNaN(Date.parse(date))) {
        validationErrors.push({
          field: "date",
          message: "Must be a valid date string",
          received: date,
        });
      } else {
        updates["availableSlots.$[elem].date"] = new Date(date);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errorType: "VALIDATION_ERROR",
        message: "Invalid slot update data",
        errors: validationErrors,
        schemaRequirements: {
          isBooked: "Boolean",
          startTime: "String (HH:MM)",
          endTime: "String (HH:MM)",
          date: "Date",
        },
      });
    }

    // 5. Apply updates using atomic operation
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { doctorId },
      { $set: updates },
      {
        arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(slotId) }],
        new: true,
        runValidators: true, // Ensure schema validation
      }
    );

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        errorType: "UPDATE_FAILED",
        message: "Failed to update slot - schedule not found",
      });
    }

    // 6. Find the updated slot to return
    const updatedSlot = updatedSchedule.availableSlots.find(
      (s) => s._id.toString() === slotId
    );

    return res.status(200).json({
      success: true,
      data: {
        slot: {
          _id: updatedSlot._id,
          date: updatedSlot.date,
          startTime: updatedSlot.startTime,
          endTime: updatedSlot.endTime,
          isBooked: updatedSlot.isBooked,
        },
        changesApplied: Object.keys(updates).map((k) => k.split(".")[2]),
      },
    });
  } catch (error) {
    // 7. Handle specific Mongoose errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        type: err.kind,
      }));

      return res.status(422).json({
        success: false,
        errorType: "SCHEMA_VALIDATION_FAILED",
        message: "Slot update failed schema validation",
        validationErrors: errors,
      });
    }

    // 8. Handle other errors
    console.error(
      `[Slot Update Error] Doctor: ${doctorId} Slot: ${slotId}`,
      error
    );
    return res.status(500).json({
      success: false,
      errorType: "INTERNAL_ERROR",
      message: "Failed to update time slot",
      systemError:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a slot
export const deleteSlot = async (req, res) => {
  try {
    const { doctorId, slotId } = req.params;

    // 1. Validate ObjectId formats (schema requires ObjectId)
    if (
      !mongoose.Types.ObjectId.isValid(doctorId) ||
      !mongoose.Types.ObjectId.isValid(slotId)
    ) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_ID_FORMAT",
        message: "Invalid ID format - must be MongoDB ObjectId",
        invalidFields: [
          ...(!mongoose.Types.ObjectId.isValid(doctorId) ? ["doctorId"] : []),
          ...(!mongoose.Types.ObjectId.isValid(slotId) ? ["slotId"] : []),
        ],
        schemaRequirement: "MongoDB ObjectId",
      });
    }

    // 2. Find schedule with projection for performance
    const schedule = await Schedule.findOne({ doctorId }).select(
      "availableSlots"
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        errorType: "SCHEDULE_NOT_FOUND",
        message: "No schedule exists for this doctor",
        doctorId,
        expectedStructure: {
          doctorId: "ObjectId",
          availableSlots: "[{ _id: ObjectId, date: Date, ... }]",
        },
      });
    }

    // 3. Check if slot exists before attempting removal
    const slotExists = schedule.availableSlots.some((s) =>
      s._id.equals(slotId)
    );
    if (!slotExists) {
      return res.status(404).json({
        success: false,
        errorType: "SLOT_NOT_FOUND",
        message: "The specified time slot doesn't exist in this schedule",
        slotId,
        availableSlotsCount: schedule.availableSlots.length,
        existingSlotIds: schedule.availableSlots.map((s) => s._id),
      });
    }

    // 4. Perform atomic delete operation
    const result = await Schedule.updateOne(
      { doctorId },
      { $pull: { availableSlots: { _id: slotId } } }
    );

    // 5. Verify deletion was successful
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        errorType: "DELETE_FAILED",
        message: "Slot deletion failed - no modifications made",
        slotId,
        doctorId,
      });
    }

    // 6. Successful response
    return res.status(200).json({
      success: true,
      data: {
        deletedCount: 1,
        slotId,
        remainingSlots:
          result.modifiedCount === 1
            ? await Schedule.findOne({ doctorId }).select("availableSlots._id")
            : undefined,
      },
    });
  } catch (error) {
    // 7. Handle specific Mongoose errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        errorType: "CAST_ERROR",
        message: "Invalid ID format for slot deletion",
        path: error.path,
        value: error.value,
      });
    }

    // 8. Handle other errors
    console.error(
      `[Slot Deletion Error] Doctor: ${doctorId} Slot: ${slotId}`,
      error
    );
    return res.status(500).json({
      success: false,
      errorType: "INTERNAL_ERROR",
      message: "Failed to delete time slot",
      systemError:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      schemaRequirements: {
        availableSlots: {
          _id: "ObjectId",
          date: "Date",
          startTime: "String",
          endTime: "String",
          isBooked: "Boolean",
        },
      },
    });
  }
};
// Add blocked slot
export const addBlockedSlot = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, startTime, endTime, reason } = req.body;

    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const newBlockedSlot = { date, startTime, endTime, reason };
    schedule.blockedSlots.push(newBlockedSlot);
    await schedule.save();

    res.status(201).json({ blockedSlot: newBlockedSlot });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all blocked slots
export const getBlockedSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.json({ blockedSlots: schedule.blockedSlots });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove blocked slot
export const removeBlockedSlot = async (req, res) => {
  try {
    const { doctorId, blockId } = req.params;
    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    schedule.blockedSlots.pull(blockId);
    await schedule.save();
    res.json({ message: "Blocked slot removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // 1. Strict validation based on schema
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        errorType: "VALIDATION_ERROR",
        message: "Invalid doctorId format - must be MongoDB ObjectId",
        details: {
          expected: "ObjectId string",
          received: doctorId,
        },
      });
    }

    // 2. Query with schema-specific projections
    const schedule = await Schedule.findOne({ doctorId })
      .populate("doctorId", "name specialty") // Reference Doctor model as per schema
      .select({
        __v: 0, // Exclude version key
        createdAt: 0, // Exclude timestamps if not needed
        updatedAt: 0,
      })
      .lean();

    // 3. Schema-based not found handling
    if (!schedule) {
      return res.status(404).json({
        success: false,
        errorType: "NOT_FOUND",
        message: "No schedule document found for this doctor",
        expectedStructure: {
          doctorId: "ObjectId",
          workingHours: [
            {
              day: "enum: ['Monday'...'Sunday']",
              startTime: "String",
              endTime: "String",
              breaks: "[{ startTime: String, endTime: String }]",
            },
          ],
          appointmentDuration: "enum: [15, 30, 45, 60]",
          availableSlots:
            "[{ date: Date, startTime: String, endTime: String, isBooked: Boolean }]",
          blockedSlots:
            "[{ date: Date, startTime: String, endTime: String, reason: String }]",
          timeSlotSettings: {
            interval: "Number",
            bufferTime: "Number",
            maxDailyAppointments: "Number",
          },
        },
      });
    }

    // 4. Schema-compliant response
    return res.status(200).json({
      success: true,
      data: {
        ...schedule,
        // Ensure arrays exist even if empty (schema compliance)
        workingHours: schedule.workingHours || [],
        availableSlots: schedule.availableSlots || [],
        blockedSlots: schedule.blockedSlots || [],
        timeSlotSettings: schedule.timeSlotSettings || {
          interval: 15,
          bufferTime: 5,
          maxDailyAppointments: 20,
        },
        appointmentDuration: schedule.appointmentDuration || 30,
      },
    });
  } catch (error) {
    // 5. Schema-aware error handling
    // console.error(`[Schedule Error] Doctor: ${doctorId}`, error);

    return res.status(500).json({
      success: false,
      errorType: "SCHEMA_VALIDATION",
      message: "Error validating schedule data structure",
      schemaRequirements: {
        requiredFields: [
          "doctorId",
          "workingHours.day",
          "workingHours.startTime",
          "workingHours.endTime",
        ],
        enums: {
          days: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          durations: [15, 30, 45, 60],
        },
      },
      systemError:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Create initial schedule
export const createSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      workingHours,
      appointmentDuration,
      timeSlotSettings,
      availableSlots,
      blockedSlots,
    } = req.body;

    // 1. Validate doctorId matches schema requirements
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_ID",
        message: "Invalid doctorId format - must be MongoDB ObjectId",
        received: doctorId,
      });
    }

    // 2. Check for existing schedule (unique constraint in schema)
    const existingSchedule = await Schedule.findOne({ doctorId });
    if (existingSchedule) {
      return res.status(409).json({
        success: false,
        errorType: "DUPLICATE_RESOURCE",
        message: "Schedule already exists for this doctor",
        existingScheduleId: existingSchedule._id,
      });
    }

    // 3. Validate workingHours structure
    if (!workingHours || !Array.isArray(workingHours)) {
      return res.status(400).json({
        success: false,
        errorType: "VALIDATION_ERROR",
        message: "workingHours must be an array",
        schemaRequirement: {
          type: "Array",
          structure: {
            day: "enum: ['Monday',...,'Sunday']",
            startTime: "String (required)",
            endTime: "String (required)",
            breaks: "[{ startTime: String, endTime: String }]",
          },
        },
      });
    }

    // 4. Validate each working hour entry
    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    for (const wh of workingHours) {
      if (!validDays.includes(wh.day)) {
        return res.status(400).json({
          success: false,
          errorType: "INVALID_ENUM",
          message: `Invalid day '${wh.day}' in workingHours`,
          validDays,
          received: wh.day,
        });
      }

      if (!wh.startTime || !wh.endTime) {
        return res.status(400).json({
          success: false,
          errorType: "MISSING_FIELDS",
          message: "Each workingHours entry requires startTime and endTime",
          missingFields: [
            ...(!wh.startTime ? ["startTime"] : []),
            ...(!wh.endTime ? ["endTime"] : []),
          ],
        });
      }
    }

    // 5. Validate appointmentDuration against schema enum
    const validDurations = [15, 30, 45, 60];
    const duration = appointmentDuration || 30;
    if (!validDurations.includes(duration)) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_DURATION",
        message: "appointmentDuration must be one of 15, 30, 45, or 60 minutes",
        validDurations,
        received: duration,
      });
    }

    // 6. Validate timeSlotSettings structure
    const defaultTimeSettings = {
      interval: 15,
      bufferTime: 5,
      maxDailyAppointments: 20,
    };

    const finalTimeSettings = {
      ...defaultTimeSettings,
      ...(timeSlotSettings || {}),
    };

    // 7. Create the schedule with schema-compliant structure
    const schedule = new Schedule({
      doctorId,
      workingHours,
      appointmentDuration: duration,
      timeSlotSettings: finalTimeSettings,
      availableSlots: availableSlots || [],
      blockedSlots: blockedSlots || [],
    });

    // 8. Save with schema validation
    await schedule.save();

    // 9. Return success response with all schema fields
    return res.status(201).json({
      success: true,
      data: {
        ...schedule.toObject(),
        // Ensure all arrays are present in response
        workingHours: schedule.workingHours || [],
        availableSlots: schedule.availableSlots || [],
        blockedSlots: schedule.blockedSlots || [],
        timeSlotSettings: schedule.timeSlotSettings || defaultTimeSettings,
      },
    });
  } catch (error) {
    // 10. Handle Mongoose validation errors specifically
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
        type: err.kind,
      }));

      return res.status(422).json({
        success: false,
        errorType: "SCHEMA_VALIDATION_FAILED",
        message: "Data validation failed against schedule schema",
        validationErrors: errors,
        schemaRequirements: {
          requiredFields: [
            "doctorId",
            "workingHours.day",
            "workingHours.startTime",
            "workingHours.endTime",
          ],
          enums: {
            days: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
            durations: [15, 30, 45, 60],
          },
        },
      });
    }

    // 11. Handle other errors
    console.error(`[Schedule Creation Error]`, error);
    return res.status(500).json({
      success: false,
      errorType: "INTERNAL_ERROR",
      message: "Failed to create schedule",
      systemError:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update schedule
export const updateSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const updates = req.body;

    console.log("Update request received:", { doctorId, updates });

    // Validate workingHours if present
    if (updates.workingHours) {
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

      // Validate each working day entry
      updates.workingHours.forEach((wh) => {
        // Day validation
        if (!validDays.includes(wh.day)) {
          throw new Error(
            `Invalid day: ${wh.day}. Valid days are: ${validDays.join(", ")}`
          );
        }

        // Time format validation
        if (!timeRegex.test(wh.startTime) || !timeRegex.test(wh.endTime)) {
          throw new Error(
            `Invalid time format for ${wh.day}. Use HH:MM (24-hour format)`
          );
        }

        // Time order validation
        if (wh.startTime >= wh.endTime) {
          throw new Error(
            `Start time (${wh.startTime}) must be before end time (${wh.endTime}) for ${wh.day}`
          );
        }

        // Break validation
        if (wh.breaks?.length) {
          wh.breaks.forEach((br) => {
            if (!timeRegex.test(br.startTime) || !timeRegex.test(br.endTime)) {
              throw new Error(
                `Invalid break time format for ${wh.day}. Use HH:MM`
              );
            }
            if (br.startTime >= br.endTime) {
              throw new Error(`Break start must be before end for ${wh.day}`);
            }
            if (br.startTime < wh.startTime || br.endTime > wh.endTime) {
              throw new Error(
                `Break must be within working hours for ${wh.day}`
              );
            }
          });
        }
      });
    }

    // Validate appointmentDuration
    if (
      updates.appointmentDuration &&
      ![15, 30, 45, 60].includes(updates.appointmentDuration)
    ) {
      throw new Error("Appointment duration must be 15, 30, 45, or 60 minutes");
    }

    // Perform the update
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { doctorId },
      { $set: updates },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).lean();

    if (!updatedSchedule) {
      console.error(`Schedule not found for doctorId: ${doctorId}`);
      return res.status(404).json({
        success: false,
        message: "Schedule not found for this doctor",
      });
    }

    console.log("Schedule updated successfully:", updatedSchedule);

    return res.json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
      requiresSlotUpdate:
        !!updates.workingHours || !!updates.appointmentDuration,
    });
  } catch (error) {
    console.error("Error updating schedule:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message,
        details: error.errors,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update schedule",
      error: error.toString(),
    });
  }
};

// this is for the patient
// controllers/scheduleController.js
export const getAvailableSlotsForPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Expected format: YYYY-MM-DD

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "Valid date parameter (YYYY-MM-DD) is required" });
    }

    // Find doctor's schedule
    const schedule = await Schedule.findOne({ doctorId })
      .select("availableSlots appointmentDuration")
      .lean();

    if (!schedule) {
      return res.status(404).json({ message: "Doctor schedule not found" });
    }

    // Filter available slots for the requested date
    const requestedDate = new Date(date);
    const availableSlots = schedule.availableSlots.filter((slot) => {
      const slotDate = new Date(slot.date);
      return (
        slotDate.getFullYear() === requestedDate.getFullYear() &&
        slotDate.getMonth() === requestedDate.getMonth() &&
        slotDate.getDate() === requestedDate.getDate() &&
        !slot.isBooked
      );
    });

    // Format response
    const response = {
      doctorId,
      date,
      appointmentDuration: schedule.appointmentDuration,
      availableSlots: availableSlots.map((slot) => ({
        slotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const bookAppointmentSlot = async (req, res) => {
  try {
    const { sub: userId } = req.user;

    // 1. Verify authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Patient identification missing",
      });
    }
    console.log(userId);

    const { doctorId, slotId } = req.params;
    const patientId = userId;
    const {
      appointmentType = APPOINTMENT_TYPES.IN_PERSON,
      reason = "",
      fee = 0, // Default to 0 if not provided
    } = req.body;

    // 2. Validate appointment type
    if (!Object.values(APPOINTMENT_TYPES).includes(appointmentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid appointment type. Valid types are: ${Object.values(
          APPOINTMENT_TYPES
        ).join(", ")}`,
      });
    }

    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    const slot = schedule.availableSlots.find(
      (s) => s._id.toString() === slotId && !s.isBooked
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found or already booked",
      });
    }

    // Construct full DateTime objects
    const getDateTime = (date, timeStr) =>
      new Date(`${date.toISOString().split("T")[0]}T${timeStr}:00.000Z`);

    const targetStart = getDateTime(slot.date, slot.startTime);
    const targetEnd = getDateTime(slot.date, slot.endTime);

    // Check for overlapping booked slots
    const overlapping = schedule.availableSlots.find((s) => {
      if (!s.isBooked || s._id.toString() === slotId) return false;

      const sStart = getDateTime(s.date, s.startTime);
      const sEnd = getDateTime(s.date, s.endTime);

      return (
        (targetStart >= sStart && targetStart < sEnd) ||
        (targetEnd > sStart && targetEnd <= sEnd) ||
        (targetStart <= sStart && targetEnd >= sEnd)
      );
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: "Selected slot overlaps with another booked slot",
      });
    }

    // Book the slot
    const updatedSchedule = await Schedule.findOneAndUpdate(
      {
        doctorId,
        "availableSlots._id": slotId,
        "availableSlots.isBooked": false,
      },
      {
        $set: {
          "availableSlots.$.isBooked": true,
          "availableSlots.$.bookedAt": new Date(),
        },
      },
      { new: true }
    );

    console.log("updated schedule", updatedSchedule);

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Failed to book the slot",
      });
    }
    // 4. Find the booked slot details
    const bookedSlot = schedule.availableSlots.find(
      (slot) => slot._id.toString() === slotId
    );
    // 5. Create appointment record
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentType,
      reason,
      fee,
      slot: {
        start: new Date(
          `${bookedSlot.date.toISOString().split("T")[0]}T${
            bookedSlot.startTime
          }:00`
        ),
        end: new Date(
          `${bookedSlot.date.toISOString().split("T")[0]}T${
            bookedSlot.endTime
          }:00`
        ),
      },
      status: APPOINTMENT_STATUS.PENDING, // Starts as pending
      ...(appointmentType === APPOINTMENT_TYPES.VIRTUAL && {
        virtualDetails: {
          videoCallToken: generateVideoToken(), // Implement this function
          chatToken: generateChatToken(), // Implement this function
        },
      }),
    });

    // 6. Update status based on payment requirements
    let statusUpdate = {};
    if (fee > 0) {
      statusUpdate.status = APPOINTMENT_STATUS.PAYMENT_PENDING;
      // Here you would typically integrate with a payment gateway
    } else {
      statusUpdate.status = APPOINTMENT_STATUS.CONFIRMED;
      statusUpdate.acceptedAt = new Date();
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointment._id,
      statusUpdate,
      { new: true }
    ).populate("patient doctor", "name email phone");

    // 7. Send confirmation (implement this separately)
    sendAppointmentConfirmation(updatedAppointment);

    res.json({
      success: true,
      message: "Appointment booked successfully",
      appointment: updatedAppointment,
      requiresPayment: fee > 0,
      nextSteps:
        fee > 0
          ? "Please complete payment to confirm your appointment"
          : "Your appointment is confirmed",
    });
  } catch (error) {
    console.error("Booking error:", error);

    // If we created an appointment but something failed after
    if (error.appointmentId) {
      await Appointment.findByIdAndUpdate(error.appointmentId, {
        status: APPOINTMENT_STATUS.CANCELLED,
        cancellation: {
          reason: CANCELLATION_REASONS.SYSTEM_ISSUE,
          cancelledAt: new Date(),
        },
      });
    }

    res.status(500).json({
      success: false,
      message: "Booking failed",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

// Helper functions (implement these)
function generateVideoToken() {
  return `vid-${Math.random().toString(36).substr(2, 9)}`;
}

function generateChatToken() {
  return `chat-${Math.random().toString(36).substr(2, 9)}`;
}

async function sendAppointmentConfirmation(appointment) {
  // Implement your email/SMS notification logic here
}
