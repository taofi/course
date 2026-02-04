import { Router } from "express";
import { AdminUserController } from "@express/controllers/admin.user.controller";
import { AdminGameController } from "@express/controllers/admin.game.controller"; // Новый контроллер
import { authMiddleware } from "@express/middlewares/AuthMiddleware";
import { UserRole } from "@src/db/models/user.model";

import { RedisService } from "@src/services/redis.service";
import { GameRedisService } from "@src/services/game.redis.service";
import { GameStatisticsService } from "@src/services/game.statistics.service";

const router = Router();

const redisService = new RedisService();
const gameRedisService = new GameRedisService(redisService);
const statsService = new GameStatisticsService(redisService, gameRedisService);
const adminGameController = new AdminGameController(statsService);

router.use(authMiddleware(UserRole.ADMIN));

router.get("/users", AdminUserController.getAllUsers);
router.get("/users/:id", AdminUserController.getUserById);
router.put("/users/:id", AdminUserController.updateUser);
router.delete("/users/:id", AdminUserController.deleteUser);

router.get("/games", adminGameController.getAllGames);

router.get("/games/:gameId", adminGameController.getGameSnapshot);

router.get("/games/:gameId/players", adminGameController.getPlayersStats);

router.get("/games/:gameId/decks", adminGameController.getDecks);

export default router;