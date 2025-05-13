const Appointment = require('../models/appointment/appointment.model');
const Doctor = require('../models/doctors/doctor.model');

/**
 * Utility functions for managing time slots and availability
 */
class SlotUtils {
  /**
   * Get available slots for a doctor
   * @param {ObjectId} doctorId - Doctor's ID
   * @param {Date} date - Date to check availability for
   * @param {Number} duration - Appointment duration in minutes
   * @returns {Promise<Array>} Array of available time slots
   */
  static async getAvailableSlots(doctorId, date, duration = 30) {
    try {
      // Get doctor's working hours for the specific day
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) throw new Error('Doctor not found');

      const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
      const workingDay = doctor.workingHours.find(day => day.day === dayOfWeek);
      if (!workingDay) return []; // Doctor doesn't work this day

      // Get existing appointments for the date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointments = await Appointment.find({
        doctor: doctorId,
        'slot.start': { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled', 'declined'] }
      });

      // Generate all possible slots based on working hours
      const allSlots = this.generateTimeSlots(
        workingDay.startTime,
        workingDay.endTime,
        duration,
        workingDay.breaks || []
      );

      // Filter out booked slots
      return this.filterBookedSlots(allSlots, existingAppointments);
    } catch (error) {
      console.error('Error in getAvailableSlots:', error);
      throw error;
    }
  }

  // utils/slotGenerator.js
static async generateDaySlots(schedule, duration = 30) {
   const slots = [];
  const { hours: startH, minutes: startM } = this.parseTime(schedule.startTime);
  const { hours: endH, minutes: endM } = this.parseTime(schedule.endTime);

  let currentMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  while (currentMin + duration <= endMin) {
    const slotStartMin = currentMin;
    const slotEndMin = currentMin + duration;

    // Check break overlaps
    const isDuringBreak = schedule.breaks?.some(breakTime => {
      const breakStart = this.parseTime(breakTime.startTime);
      const breakEnd = this.parseTime(breakTime.endTime);
      const breakStartMin = breakStart.hours * 60 + breakStart.minutes;
      const breakEndMin = breakEnd.hours * 60 + breakEnd.minutes;

      return slotStartMin < breakEndMin && slotEndMin > breakStartMin;
    });

    if (!isDuringBreak) {
      slots.push({
        startTime: `${Math.floor(slotStartMin / 60)}:${String(slotStartMin % 60).padStart(2, '0')}`,
        endTime: `${Math.floor(slotEndMin / 60)}:${String(slotEndMin % 60).padStart(2, '0')}`
      });
    }

    currentMin += duration;
  }

  return slots;
}

// Helper: Format Date to "HH:MM"
static parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours)) throw new Error(`Invalid time format: ${timeStr}`);
  return { hours, minutes };
}

  /**
   * Generate time slots based on working hours and breaks
   * @param {String} startTime - Format "HH:MM"
   * @param {String} endTime - Format "HH:MM"
   * @param {Number} duration - Slot duration in minutes
   * @param {Array} breaks - Array of break objects
   * @returns {Array} Array of time slot objects
   */
  static generateTimeSlots(startTime, endTime, duration, breaks = []) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startHour, startMinute, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + duration * 60000);
      
      // Check if slot overlaps with any break
      const isDuringBreak = breaks.some(breakTime => {
        const breakStart = this.parseTimeString(breakTime.startTime);
        const breakEnd = this.parseTimeString(breakTime.endTime);
        return (current < breakEnd && slotEnd > breakStart);
      });

      if (!isDuringBreak && slotEnd <= end) {
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd)
        });
      }

      current = new Date(current.getTime() + duration * 60000);
    }

    return slots;
  }

  /**
   * Filter out booked slots from available slots
   * @param {Array} allSlots - All possible slots
   * @param {Array} appointments - Existing appointments
   * @returns {Array} Available slots
   */
  static filterBookedSlots(allSlots, appointments) {
    return allSlots.filter(slot => {
      return !appointments.some(appt => {
        return (
          (slot.start >= appt.slot.start && slot.start < appt.slot.end) ||
          (slot.end > appt.slot.start && slot.end <= appt.slot.end) ||
          (slot.start <= appt.slot.start && slot.end >= appt.slot.end)
        );
      });
    });
  }

  /**
   * Parse time string "HH:MM" into Date object
   * @param {String} timeString - Time in "HH:MM" format
   * @returns {Date} Date object with today's date and specified time
   */
  static parseTimeString(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Check if a specific slot is available
   * @param {ObjectId} doctorId - Doctor's ID
   * @param {Date} start - Start time of slot
   * @param {Date} end - End time of slot
   * @returns {Promise<Boolean>} True if slot is available
   */
  static async isSlotAvailable(doctorId, start, end) {
    const overlappingAppointments = await Appointment.countDocuments({
      doctor: doctorId,
      'slot.start': { $lt: end },
      'slot.end': { $gt: start },
      status: { $nin: ['cancelled', 'declined'] }
    });

    return overlappingAppointments === 0;
  }
}

module.exports = SlotUtils;