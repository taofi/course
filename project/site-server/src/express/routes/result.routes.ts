import { Router } from "express";
import { ResultController } from "@express/controllers/result.controller";
import { authMiddleware } from "@express/middlewares/AuthMiddleware";

const router = Router();

/**
 * Маршруты для работы с результатами игр
 * Все маршруты защищены authMiddleware для предотвращения несанкционированного доступа
 */

// Получить общую историю всех игр (например, для глобального списка лидеров)
router.get("/",  ResultController.getAllResults);

// Получить историю игр конкретного пользователя
router.get("/player/:userId", ResultController.getResultsByPlayer);

// Получить детальный результат конкретной игры по её ID (UUID или MongoDB ID)
router.get("/:id", ResultController.getResultById);

export default router;