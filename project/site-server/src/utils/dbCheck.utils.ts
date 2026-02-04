import redis from "@src/config/redis";
import mongoose from "mongoose";
import { User, UserRole } from "@src/db/models/user.model";
import bcrypt from "bcrypt";
import logger from "./logger";
import { AppConfig } from "@src/config";

export const checkRedis = async () => {
  try {
    await redis.ping();
    logger.info("Redis is ready");
  } catch (err: any) {
    logger.error(`Redis connection failed: ${err.message}`);
    process.exit(1);
  }
};

export const connectMongo = async () => {
  try {
    const mongoUri = AppConfig.MONGO_URI as string;
    await mongoose.connect(mongoUri);
    logger.info("MongoDB подключена");

    const adminLogin = AppConfig.ADMIN_LOGIN;
    const adminPassword = AppConfig.ADMIN_PASSWORD;

    let admin = await User.findOne({ login: adminLogin });
    if (!admin) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      admin = new User({
        name: "Admin",
        login: adminLogin,
        password: hashed,
        registrationDate: new Date().toLocaleDateString("en-GB"),
        avatar: "/public/avatars/admin.png",
        role: UserRole.ADMIN,
        email: "kartochkincourse@gmail.com",
        isEmailVerified: true,
      });
      await admin.save();
      logger.info("Админ создан");
    } else {
      logger.info("Админ уже существует");
    }
  } catch (err: any) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};
