import mongoose from "mongoose";
import dotenv from "dotenv";
import {AppConfig} from "./index";

dotenv.config();

const uri = AppConfig.MONGO_URI as string;

export async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB подключена");
  } catch (err) {
    console.error("Ошибка подключения:", err);
    process.exit(1);
  }
}
