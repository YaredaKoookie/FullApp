import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import SuperAdmin from "../src/models/admin/SuperAdmin.js";

dotenv.config();

const MONGO_URI = process.env.DB_URL || "mongodb://localhost:27017/your-db";

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const existing = await SuperAdmin.findOne({ username: "superadmin" });

    if (existing) {
      console.log("Super Admin already exists.");
    } else {
      const password = "super_secure_password"; // Change this in production
      const passwordHash = await bcrypt.hash(password, 10);

      const superAdmin = new SuperAdmin({
        username: "superadmin",
        email: "superadmin@example.com",
        passwordHash,
        firstName: "Super",
        lastName: "Admin",
      });

      await superAdmin.save();
      console.log("Super Admin created successfully.");
    }

    process.exit();
  } catch (err) {
    console.error("Error seeding Super Admin:", err);
    process.exit(1);
  }
};

seedSuperAdmin();
