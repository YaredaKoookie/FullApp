import mongoose from 'mongoose';
import Doctor from '../models/doctors/doctor.model.js';
import Schedule from '../models/schedule/Schedule.model.js';
import env from '../config/env.config.js';

// 1. Configure MongoDB connection
const MONGODB_URI = env.DB_URL;

async function migrateSchedules() {
  try {
    // 2. Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // 3. Get all doctors
    const doctors = await Doctor.find({});
    console.log(`Found ${doctors.length} doctors to migrate`);

    // 4. Process each doctor
    for (const [index, doctor] of doctors.entries()) {
      console.log(`Migrating doctor ${index + 1}/${doctors.length}: ${doctor._id}`);
      
      // Skip if no scheduling data exists
      if (!doctor.workingHours || doctor.workingHours.length === 0) {
        console.log('No scheduling data to migrate');
        continue;
      }

      // 5. Create/update schedule
      await Schedule.findOneAndUpdate(
        { doctorId: doctor._id },
        {
          workingHours: doctor.workingHours,
          appointmentDuration: doctor.appointmentDuration
        },
        { upsert: true, new: true }
      );

      // 6. Remove fields from doctor (optional)
      await Doctor.updateOne(
        { _id: doctor._id },
        { $unset: { workingHours: "", appointmentDuration: "" } }
      );
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // 7. Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  }
}

// 8. Run the migration
migrateSchedules();