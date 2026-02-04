import { Request, Response, NextFunction } from "express";
import logger from "../../utils/logger";
import { authService } from "../../services";
import { ValidationError, UnauthorizedError } from "../../utils/CustomErrors";
import { Logger } from "winston";

export class AuthController {

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, login, password } = req.body;

      if (!name || !email || !login || !password) {
        throw new ValidationError("Все поля (name, email, login, password) обязательны");
      }

      const result = await authService.register({ name, email, login, password });
      logger.debug(`Пользователь ${login} зарегистрирован, отправлен код подтверждения.`);

      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { login } = req.body;

      if (!login) {
        throw new ValidationError("login пользователя обязательны для повторной отправки.");
      }

      const message = await authService.sendEmailVerificationCode(login);

      logger.debug(`Повторно отправлен код подтверждения для пользователя: ${login}.`);
      return res.json({ message });
    } catch (err) {
      next(err);
    }
  }

  // --- НОВЫЙ МЕТОД КОНТРОЛЛЕРА ДЛЯ ВЕРИФИКАЦИИ ---
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      // Пользователь должен отправить userId и code в теле запроса
      const { login, code } = req.body;

      if (!login || !code) {
        throw new ValidationError("ID пользователя и код подтверждения обязательны");
      }

      // Вызываем новый метод сервиса для проверки кода и генерации токенов
      const tokens = await authService.verifyEmail(login, code);

      logger.debug(`Email пользователя ${login} подтвержден.`);
      return res.json({ message: "Email успешно подтвержден.", ...tokens });
    } catch (err) {
      next(err);
    }
  }


  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        throw new ValidationError("Логин и пароль обязательны");
      }

      const tokens = await authService.login(login, password);
      logger.debug(`Вход пользователя: ${login}`);
      return res.json(tokens);
    } catch (err) {
      next(err);
    }
  }


  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new UnauthorizedError("Отсутствует refresh токен");
      }

      const newTokens = await authService.refreshTokens(refreshToken);
      return res.json(newTokens);
    } catch (err) {
      next(err);
    }
  }


  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
  
      if (!user || !user.id) {
        throw new UnauthorizedError("Не удалось определить пользователя для выхода");
      }
  
      const userId = user.id;
  
      await authService.logout(userId);
  
      logger.info(`Пользователь ${userId} вышел из системы`);
      return res.json({ message: "Успешный выход" });
    } catch (err) {
      next(err);
    }
  }


  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new UnauthorizedError("Неавторизованный пользователь");
      }

      return res.json({ user });
    } catch (err) {
      next(err);
    }
  }


  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new UnauthorizedError("Неавторизованный пользователь");
      }

      return res.json({ user });
    } catch (err) {
      next(err);
    }
  }


  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      if (!user || !user.id) {
        throw new UnauthorizedError("Неавторизованный пользователь");
      }

      return res.json({ userId: user.id });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError("Email обязателен для сброса пароля");
      }

      const result = await authService.resetPassword(email);
      
      logger.info(`Запрос на сброс пароля для email: ${email}`);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Подтверждение сброса и установка нового пароля
   */
  static async confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        throw new ValidationError("Email, код подтверждения и новый пароль обязательны");
      }

      // Валидация длины пароля (рекомендуется)
      if (newPassword.length < 6) {
        throw new ValidationError("Пароль должен содержать минимум 6 символов");
      }

      const result = await authService.confirmReset(email, code, newPassword);

      logger.info(`Пароль успешно изменен для пользователя: ${email}`);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}