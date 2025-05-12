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
            endTime: String
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
        isBooked: { type: Boolean, default: false }
      }
    ],
    blockedSlots: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        reason: String
      }
    ],
    timeSlotSettings: {
      interval: { type: Number, default: 15 },
      bufferTime: { type: Number, default: 5 },
      maxDailyAppointments: { type: Number, default: 20 }
    }
  },
  { timestamps: true }
);

// Indexes for faster querying
scheduleSchema.index({ doctorId: 1 });
scheduleSchema.index({ "availableSlots.date": 1 });
scheduleSchema.index({ "availableSlots.isBooked": 1 });

export default model("Schedule", scheduleSchema);