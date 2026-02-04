import { Request, Response, NextFunction } from "express";
import { authService } from "@src/services";

/**
 * @param requiredRole - Необязательная роль (например, 'admin')
 */
export const authMiddleware = (requiredRole?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Нет токена" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Неверный формат токена" });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({ error: "Токен отсутствует" });
    }

    try {
      const payload = authService.verifyAccessToken(token);
      (req as any).user = payload;

      // Проверка роли, если она была передана в middleware
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: "Недостаточно прав" });
      }

      next();
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  };
};