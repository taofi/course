import { Request, Response, NextFunction } from "express";
import { ValidationError, NotFoundError } from "../../utils/CustomErrors";
import logger from "../../utils/logger";
import { GameResultRepository } from "@src/db/repositories/game.result.repository";

// Инициализируем репозиторий
const gameResultRepository = new GameResultRepository();

export class ResultController {
  /**
   * Получить результат игры по ID
   * Поддерживает как внутренний MongoDB _id, так и строковый UUID
   */
  static async getResultById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("ID игры обязателен для получения результата");
      }

      // 1. Пытаемся найти по UUID (поле id в схеме)
      let gameResult = await gameResultRepository.findByUuid(id);

      // 2. Если не нашли по UUID, пробуем найти по внутреннему ObjectId
      if (!gameResult) {
        gameResult = await gameResultRepository.findById(id);
      }

      if (!gameResult) {
        throw new NotFoundError(`Результат игры с ID ${id} не найден`);
      }

      logger.debug(`Запрошен результат игры: ${id}`);
      
      return res.json(gameResult);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Получить историю игр конкретного пользователя
   */
  static async getResultsByPlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError("ID пользователя обязателен");
      }

      const results = await gameResultRepository.findByPlayer(userId);

      return res.json(results);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Получить все результаты (для админ-панели или общего списка)
   */
  static async getAllResults(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await gameResultRepository.findAll();
      return res.json(results);
    } catch (err) {
      next(err);
    }
  }
}