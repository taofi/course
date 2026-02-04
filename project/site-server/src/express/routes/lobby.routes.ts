import { Router } from "express";
import { LobbyController } from "../controllers/lobby.controller";
import { authMiddleware } from "@express/middlewares/AuthMiddleware";


const router = Router();

// POST /api/lobbies - Создать новое лобби
router.post("/", authMiddleware(),  LobbyController.createLobby);

// GET /api/lobbies - Получить список всех активных лобби
router.get("/", LobbyController.getAllLobbies);

// GET /api/lobbies/:id - Получить детали конкретного лобби
router.get("/:id", authMiddleware(), LobbyController.getLobbyDetails);

// POST /api/lobbies/:id/join - Присоединиться к лобби
router.post("/:id/join", authMiddleware(), LobbyController.joinLobby);

// PUT /api/lobbies/:id/ready - Изменить статус готовности
router.put("/:id/ready", authMiddleware(), LobbyController.setReadyStatus);

// DELETE /api/lobbies/:id - Удалить лобби
router.delete("/:id", authMiddleware(), LobbyController.deleteLobby);

router.delete('/:id/participants/:userId', authMiddleware(), LobbyController.kickPlayer);

export default router;