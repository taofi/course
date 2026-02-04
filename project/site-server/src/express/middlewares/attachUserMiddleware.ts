import { Request, Response, NextFunction } from "express";
import { authService } from "../../services";
import UserRepository from "../../db/repositories/user.repository";
import { UnauthorizedError } from "../../utils/CustomErrors";

const userRepository = new UserRepository();

export const attachUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Токен отсутствует или некорректен");
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new UnauthorizedError("Токен отсутствует или некорректен");
        }

        const payload = authService.verifyAccessToken(token);
        const user = await userRepository.findById(payload.id);

        if (!user) {
            throw new UnauthorizedError("Пользователь не найден");
        }

        (req as any).user = user; // Прикрепляем полную информацию о пользователе к запросу
        next();
    } catch (err) {
        next(err); // Передаем ошибку в обработчик ошибок
    }
};
