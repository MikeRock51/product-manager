import mongoose from "mongoose";
import "dotenv/config";

const isTest = process.env.NODE_ENV === "test";
const DB_URI = isTest ? process.env.DB_TEST_URI : process.env.DB_URI;

export async function initializeDatabase() {
  try {
    await mongoose.connect(DB_URI as string);
    console.log(`Connected to database successfully! ✅✅✅`);
  } catch (err) {
    console.error("❌❌❌ Unable to connect to the database:", err);
    process.exit(1);
  }
}

export async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log("Database connection closed successfully! ✅✅✅");
  } catch (err) {
    console.error("❌❌❌ Error while closing the database connection:", err);
  }
}