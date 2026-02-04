import { Router } from "express";
import { authMiddleware } from "@express/middlewares/AuthMiddleware";
import { GameController } from "../controllers/game.controller";

const router = Router();

router.post("/start", authMiddleware(), GameController.start);
router.get('/:id/check-access', authMiddleware(), GameController.checkAccess);

export default router;
