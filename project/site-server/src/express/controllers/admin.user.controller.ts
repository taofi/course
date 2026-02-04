import { Request, Response, NextFunction } from "express";
import { ValidationError, NotFoundError } from "../../utils/CustomErrors";
import logger from "../../utils/logger";
import { userRepository } from "@src/db/repositories";


export class AdminUserController {
  /**
   * Получить список всех пользователей
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userRepository.getAll();
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Получить детальную информацию о пользователе
   */
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if(!id)
      {
        throw new ValidationError("Id не указано");
      }
      const user = await userRepository.findById(id);

      if (!user) {
        throw new NotFoundError("Пользователь не найден");
      }

      return res.json(user);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Обновить данные пользователя администратором
   */
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.password) {
        delete updateData.password;
      }

      const updatedUser = await userRepository.update(id, updateData);

      if (!updatedUser) {
        throw new NotFoundError("Пользователь не найден для обновления");
      }

      logger.info(`Администратор обновил профиль пользователя: ${id}`);
      return res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Удалить пользователя
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if(!id)
        {
          throw new ValidationError("Id не указано");
        }
      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundError("Пользователь не найден");
      }

      await user.deleteOne();
      
      logger.warn(`Администратор удалил пользователя: ${id}`);
      return res.json({ message: "Пользователь успешно удален" });
    } catch (err) {
      next(err);
    }
  }
}