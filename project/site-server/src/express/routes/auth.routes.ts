import { Router } from "express";
import { AuthController } from "@express/controllers/auth.controller";
import { authMiddleware } from "@express/middlewares/AuthMiddleware";

const router = Router();

router.post("/verify", AuthController.verifyEmail);
router.post("/resend", AuthController.resendVerification);
router.post("/register", AuthController.register);

router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", authMiddleware(), AuthController.logout);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/confirm-reset', AuthController.confirmPasswordReset);

router.get("/me", authMiddleware(), AuthController.me);

export default router;
