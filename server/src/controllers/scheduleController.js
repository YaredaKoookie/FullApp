import Schedule from "../models/schedule/Schedule.model";

// Generate slots based on workingHours
export const generateSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.body;
    console.log(doctorId);
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Clear existing slots in the date range to avoid duplicates
    schedule.availableSlots = schedule.availableSlots.filter(
      slot => new Date(slot.date) < start || new Date(slot.date) > end
    );

    const generatedSlots = [];
    const { workingHours, appointmentDuration, timeSlotSettings } = schedule;
    const interval = timeSlotSettings?.interval || 15; // minutes
    const bufferTime = timeSlotSettings?.bufferTime || 5; // minutes

    // Helper function to add time to a date
    const addMinutes = (timeString, minutes) => {
      const [hours, mins] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, mins + minutes, 0, 0);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    // Helper function to check if time is within breaks
    const isDuringBreak = (time, breaks) => {
      if (!breaks || breaks.length === 0) return false;
      return breaks.some(breakItem => {
        return time >= breakItem.startTime && time < breakItem.endTime;
      });
    };

    // Helper function to check if slot is blocked
    const isBlocked = (date, time) => {
      if (!schedule.blockedSlots || schedule.blockedSlots.length === 0) return false;
      const slotDateStr = date.toISOString().split('T')[0];
      return schedule.blockedSlots.some(blocked => {
        const blockedDateStr = blocked.date.toISOString().split('T')[0];
        return (
          blockedDateStr === slotDateStr &&
          time >= blocked.startTime &&
          time < blocked.endTime
        );
      });
    };

    // Iterate through each day in the date range
    for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const daySchedule = workingHours.find(day => day.day === dayOfWeek);
      
      if (!daySchedule) continue; // Doctor doesn't work this day

      const { startTime, endTime, breaks } = daySchedule;
      let currentSlotTime = startTime;

      // Generate slots for this day
      while (currentSlotTime < endTime) {
        const slotEndTime = addMinutes(currentSlotTime, appointmentDuration);
        
        // Skip if slot overlaps with break time or is blocked
        if (
          !isDuringBreak(currentSlotTime, breaks) &&
          !isDuringBreak(slotEndTime, breaks) &&
          !isBlocked(currentDate, currentSlotTime)
        ) {
          generatedSlots.push({
            date: new Date(currentDate),
            startTime: currentSlotTime,
            endTime: slotEndTime,
            isBooked: false
          });
        }

        // Move to next slot time with buffer
        currentSlotTime = addMinutes(currentSlotTime, appointmentDuration + bufferTime);
      }
    }

    schedule.availableSlots.push(...generatedSlots);
    await schedule.save();

    res.status(201).json({ 
      message: "Slots generated successfully",
      count: generatedSlots.length,
      slots: generatedSlots 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    const schedule = await Schedule.findOne({ doctorId })
      .populate('doctorId', 'name specialization -_id'); // Optional: include basic doctor info

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found for this doctor" });
    }

    let slots = schedule.availableSlots;

    // Apply filters if provided
    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      slots = slots.filter(slot => 
        new Date(slot.date).toDateString() === targetDate.toDateString()
      );
    }

    if (isBooked !== undefined) {
      const bookedFilter = isBooked === 'true';
      slots = slots.filter(slot => slot.isBooked === bookedFilter);
    }

    if (upcomingOnly === 'true') {
      const now = new Date();
      slots = slots.filter(slot => 
        new Date(slot.date) >= new Date(now.setHours(0, 0, 0, 0))
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
      available: slots.filter(s => !s.isBooked).length,
      booked: slots.filter(s => s.isBooked).length,
      slots,
      generatedAt: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching slots:', error);
    
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid doctorId format" });
    }
    
    res.status(500).json({ 
      message: "Error retrieving slots",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a slot (e.g., mark as booked)
export const updateSlot = async (req, res) => {
  try {
    const { doctorId, slotId } = req.params;
    const { isBooked, startTime, endTime } = req.body;

    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const slot = schedule.availableSlots.id(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (isBooked !== undefined) slot.isBooked = isBooked;
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;

    await schedule.save();
    res.json({ slot });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Delete a slot
export const deleteSlot = async (req, res) => {
  try {
    const { doctorId, slotId } = req.params;
    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    schedule.availableSlots.pull(slotId);
    await schedule.save();
    res.json({ message: "Slot deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create initial schedule
export const createSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { workingHours, appointmentDuration } = req.body;

    // Check if schedule already exists
    const existingSchedule = await Schedule.findOne({ doctorId });
    if (existingSchedule) {
      return res.status(400).json({ message: "Schedule already exists" });
    }

    const schedule = new Schedule({
      doctorId,
      workingHours,
      appointmentDuration: appointmentDuration || 30,
    });
    await schedule.save();
    res.status(201).json({ schedule });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update schedule
export const updateSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const updates = req.body;
    
    console.log('Update request received:', { doctorId, updates });

    // Validate workingHours if present
    if (updates.workingHours) {
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      // Validate each working day entry
      updates.workingHours.forEach(wh => {
        // Day validation
        if (!validDays.includes(wh.day)) {
          throw new Error(`Invalid day: ${wh.day}. Valid days are: ${validDays.join(', ')}`);
        }

        // Time format validation
        if (!timeRegex.test(wh.startTime) || !timeRegex.test(wh.endTime)) {
          throw new Error(`Invalid time format for ${wh.day}. Use HH:MM (24-hour format)`);
        }

        // Time order validation
        if (wh.startTime >= wh.endTime) {
          throw new Error(`Start time (${wh.startTime}) must be before end time (${wh.endTime}) for ${wh.day}`);
        }

        // Break validation
        if (wh.breaks?.length) {
          wh.breaks.forEach(br => {
            if (!timeRegex.test(br.startTime) || !timeRegex.test(br.endTime)) {
              throw new Error(`Invalid break time format for ${wh.day}. Use HH:MM`);
            }
            if (br.startTime >= br.endTime) {
              throw new Error(`Break start must be before end for ${wh.day}`);
            }
            if (br.startTime < wh.startTime || br.endTime > wh.endTime) {
              throw new Error(`Break must be within working hours for ${wh.day}`);
            }
          });
        }
      });
    }

    // Validate appointmentDuration
    if (updates.appointmentDuration && ![15, 30, 45, 60].includes(updates.appointmentDuration)) {
      throw new Error('Appointment duration must be 15, 30, 45, or 60 minutes');
    }

    // Perform the update
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { doctorId },
      { $set: updates },
      { 
        new: true,
        runValidators: true,
        context: 'query'
      }
    ).lean();

    if (!updatedSchedule) {
      console.error(`Schedule not found for doctorId: ${doctorId}`);
      return res.status(404).json({ 
        success: false,
        message: "Schedule not found for this doctor" 
      });
    }

    console.log('Schedule updated successfully:', updatedSchedule);
    
    return res.json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
      requiresSlotUpdate: !!updates.workingHours || !!updates.appointmentDuration
    });

  } catch (error) {
    console.error('Error updating schedule:', error.message);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message,
        details: error.errors
      });
    }
    
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update schedule",
      error: error.toString()
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
      return res.status(400).json({ message: "Valid date parameter (YYYY-MM-DD) is required" });
    }

    // Find doctor's schedule
    const schedule = await Schedule.findOne({ doctorId })
      .select('availableSlots appointmentDuration')
      .lean();

    if (!schedule) {
      return res.status(404).json({ message: "Doctor schedule not found" });
    }

    // Filter available slots for the requested date
    const requestedDate = new Date(date);
    const availableSlots = schedule.availableSlots.filter(slot => {
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
      availableSlots: availableSlots.map(slot => ({
        slotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime
      }))
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const bookAppointmentSlot = async (req, res) => {
  try {
    const { doctorId, slotId } = req.params;
    const patientId = req.user._id; // From auth middleware

    // Find and update the slot
    const updatedSchedule = await Schedule.findOneAndUpdate(
      {
        doctorId,
        "availableSlots._id": slotId,
        "availableSlots.isBooked": false // Ensure slot is available
      },
      {
        $set: {
          "availableSlots.$.isBooked": true,
          "availableSlots.$.patientId": patientId,
          "availableSlots.$.bookedAt": new Date()
        }
      },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ 
        message: "Slot not found or already booked" 
      });
    }

    // Find the booked slot details
    const bookedSlot = updatedSchedule.availableSlots.find(
      slot => slot._id.toString() === slotId
    );

    // Create appointment record (you might want to do this in a separate service)
    const appointment = await Appointment.create({
      doctorId,
      patientId,
      slotId,
      date: bookedSlot.date,
      startTime: bookedSlot.startTime,
      endTime: bookedSlot.endTime,
      status: 'confirmed'
    });

    res.json({
      success: true,
      message: "Appointment booked successfully",
      appointment
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Booking failed", 
      error: error.message 
    });
  }
};