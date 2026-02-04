import { Request, Response, NextFunction } from "express";
import { userService } from "../../services"; // Предполагаем, что сервис импортируется здесь
import logger from "../../utils/logger";
import { UnauthorizedError, ValidationError } from "../../utils/CustomErrors";

// Интерфейс для данных, которые можно обновлять (для ясности)
interface UserUpdateData {
    name?: string;
    login?: string;
    email?: string;
}

interface AuthMulterRequest extends Request {
    file?: Express.Multer.File;
    user: { id: string }; 
}

interface UserUpdateData {
    name?: string;
    login?: string;
    email?: string;
}

export class UserController {

    /**
     * Получение списка всех пользователей.
     * GET /api/users
     */
    static async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await userService.getAllUsers();
            logger.debug("Получен список всех пользователей");
            // Возвращаем список (без паролей, так как они исключены в репозитории)
            return res.json(users);
        } catch (err) {
            next(err);
        }
    }

    // ----------------------------------------------------

    /**
     * Получение пользователя по ID.
     * GET /api/users/:id
     */
    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!id) {
                throw new ValidationError("ID пользователя обязателен");
            }

            const user = await userService.getUserById(id);
            logger.debug(`Получен пользователь с ID: ${id}`);
            return res.json(user);
        } catch (err) {
            next(err);
        }
    }

    // ----------------------------------------------------

    /**
     * Обновление информации о пользователе (name, login, email).
     * PUT /api/users/:id
     */
    static async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user || !user.id) {
                throw new UnauthorizedError("Неавторизованный пользователь");
            }
            const userId = user.id; 
            const updateData: UserUpdateData = req.body; 

            
            if (Object.keys(updateData).length === 0) {
                 throw new ValidationError("Необходимо предоставить хотя бы одно поле для обновления.");
            }

            const updatedUser = await userService.updateUser(userId, updateData);
            logger.debug(`Обновлена информация для пользователя ID: ${userId} (из токена)`);
            return res.json(updatedUser);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Смена аватара для текущего пользователя.
     * POST /api/users/avatar (маршрут больше не требует ID)
     */
    static async changeAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user || !user.id) {
                throw new UnauthorizedError("Неавторизованный пользователь");
            }
            const userId = user.id;
            const uploadedFile = req.file; 

            if (!uploadedFile) {
                throw new ValidationError("Файл аватара не был предоставлен. Убедитесь, что поле называется 'avatar'.");
            }
            
            const newFilePath = uploadedFile.path; 

            // Вызываем сервис с ID из токена
            const updatedUser = await userService.changeAvatar(userId, newFilePath);
            
            logger.debug(`Изменен аватар для пользователя ID: ${userId} (из токена)`);
            return res.json({ 
                message: "Аватар успешно обновлен",
                avatarPath: updatedUser.avatar, 
                user: updatedUser 
            });
        } catch (err) {
            next(err);
        }
    }


    /**
     * Получение списка доступных аватаров (только имена файлов) из public/avatars.
     * GET /api/users/avatars/list (Пример маршрута)
     */
    static async getAvatarList(req: Request, res: Response, next: NextFunction) {
        try {
            // Вызываем метод сервиса для получения списка имен файлов
            const avatarFilenames = await userService.getAvailableAvatars();
            logger.debug("Получен список доступных аватаров");
            
            // Возвращаем массив строк (имена файлов)
            return res.json({ 
                files: avatarFilenames 
            });
        } catch (err) {
            next(err);
        }
    }

    static async selectDefaultAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user || !user.id) {
                throw new UnauthorizedError("Неавторизованный пользователь");
            }
            const userId = user.id;

            // Ожидаем относительный путь в теле запроса
            const { avatarPath } = req.body; 

            if (!avatarPath) {
                throw new ValidationError("Необходимо предоставить avatarPath.");
            }
            
            // Вызываем сервис для обновления пути в БД
            const updatedUser = await userService.selectDefaultAvatar(userId, avatarPath);
            
            logger.debug(`Пользователь ID ${userId} выбрал стандартный аватар.`);
            
            return res.json({ 
                message: "Аватар успешно установлен.",
                avatarPath: updatedUser.avatar, 
                user: updatedUser 
            });
            
        } catch (err) {
            next(err);
        }
    }
}