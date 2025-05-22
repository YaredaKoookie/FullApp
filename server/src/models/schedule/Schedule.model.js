import { Schema, model } from "mongoose";

const scheduleSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true
    },
    workingHours: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          required: true
        },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        breaks: [
          {
            startTime: String,
            endTime: String,
            reason: String,
            isRecurring: { type: Boolean, default: false }
          }
        ]
      }
    ],
    appointmentDuration: { 
      type: Number, 
      default: 30,
      enum: [15, 30, 45, 60] 
    },
    availableSlots: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isBooked: { type: Boolean, default: false },
        bookedAt: { type: Date },
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
        appointmentType: { 
          type: String,
          enum: ['regular', 'emergency', 'follow-up', 'consultation']
        }
      }
    ],
    blockedSlots: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        reason: String,
        isRecurring: { type: Boolean, default: false },
        recurringPattern: {
          type: String,
          enum: ['weekly', 'biweekly', 'monthly', 'none'],
          default: 'none'
        }
      }
    ],
    timeSlotSettings: {
      interval: { type: Number, default: 15 },
      bufferTime: { type: Number, default: 5 },
      maxDailyAppointments: { type: Number, default: 20 },
      minNoticePeriod: { type: Number, default: 24 }, // hours
      maxAdvanceBooking: { type: Number, default: 30 }, // days
      allowEmergencyBookings: { type: Boolean, default: true },
      emergencyBufferTime: { type: Number, default: 15 } // minutes
    },
    recurringSchedule: {
      pattern: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly', 'none'],
        default: 'none'
      },
      weeks: [{
        weekNumber: Number,
        workingHours: [{
          day: String,
          startTime: String,
          endTime: String,
          breaks: [{
            startTime: String,
            endTime: String,
            reason: String
          }]
        }]
      }]
    },
    analytics: {
      lastUpdated: { type: Date },
      totalAppointments: { type: Number, default: 0 },
      completedAppointments: { type: Number, default: 0 },
      cancelledAppointments: { type: Number, default: 0 },
      noShowCount: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      peakHours: [{
        hour: String,
        count: Number
      }],
      popularDays: [{
        day: String,
        count: Number
      }]
    }
  },
  { timestamps: true }
);

// Indexes for faster querying
scheduleSchema.index({ doctorId: 1 });
scheduleSchema.index({ "availableSlots.date": 1 });
scheduleSchema.index({ "availableSlots.isBooked": 1 });
scheduleSchema.index({ "availableSlots.patientId": 1 });
scheduleSchema.index({ "blockedSlots.date": 1 });
scheduleSchema.index({ "recurringSchedule.pattern": 1 });

// Pre-save middleware to update analytics
scheduleSchema.pre('save', function(next) {
  if (this.isModified('availableSlots')) {
    this.analytics.lastUpdated = new Date();
    this.analytics.totalAppointments = this.availableSlots.filter(slot => slot.isBooked).length;
  }
  next();
});

export default model("Schedule", scheduleSchema);