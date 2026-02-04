import UserRepository from "@src/db/repositories/user.repository";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { IUser } from "@src/db/models/user.model";
import { v4 as uuidv4 } from "uuid";
import { RedisService } from "./redis.service";
import { AuthError, TokenError, ValidationError } from "@src/utils/CustomErrors";
import logger from "@src/utils/logger";
import { EmailService } from "./email.service";


export async function hashPassword(password: string): Promise<string> {
    const saltRounds: number = 10;

    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    return hashedPassword;
}

const VERIFICATION_CODE_TTL = 10 * 60;
const VERIFICATION_CODE_PREFIX = "verify:";
const JWT_SECRET: Secret = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES: string = process.env.JWT_EXPIRES || "1h";
const JWT_REFRESH_EXPIRES: string = process.env.JWT_REFRESH_EXPIRES || "7d";

const RESET_PASSWORD_TTL = 15 * 60; // 15 минут
const RESET_PASSWORD_PREFIX = "reset_password:";

export class AuthService {
    constructor(
        private userRepo: UserRepository,
        private redisService: RedisService,
        private emailService: EmailService
    ) { }

    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async sendEmailVerificationCode(login: string): Promise<string> {
        const verificationCode = this.generateVerificationCode();
        const redisKey = `verification:${login}`;

        const user = await this.userRepo.findByLogin(login);

        if (!user)
            throw new AuthError("Пользователь не найден");

        await this.redisService.set(
            redisKey,
            verificationCode,
            VERIFICATION_CODE_TTL
        );

        await this.emailService.sendVerificationEmail(user.email, verificationCode);
        return ("Требуется подтверждение email");
    }

    // Регистрация нового пользователя
    async register(data: Partial<IUser>) {
        // 1. Проверка на обязательные поля для поиска
        if (!data.login || !data.email || !data.password) {
            throw new AuthError("Логин, почта и пароль обязательны");
        }

        // 2. Параллельная проверка уникальности (оптимизация производительности)
        const [existingByLogin, existingByEmail] = await Promise.all([
            this.userRepo.findByLogin(data.login),
            this.userRepo.findByEmail(data.email)
        ]);
        if (existingByLogin) {
            throw new AuthError("Пользователь с таким логином уже существует");
        }

        if (existingByEmail) {
            throw new AuthError("Пользователь с такой почтой уже существует");
        }

        // 3. Хеширование пароля
        const hashedPassword = await hashPassword(data.password);

        // 4. Подготовка данных
        const userData: Partial<IUser> = {
            id: uuidv4(),
            name: data.name,
            login: data.login,
            email: data.email,
            password: hashedPassword,
            registrationDate: new Date().toLocaleDateString("en-GB"),
            avatar: "/public/avatars/default.png"
        };

        // 5. Создание пользователя
        const user = await this.userRepo.create(userData);

        // 6. Отправка кода подтверждения
        await this.sendEmailVerificationCode(user.login);

        return {
            user: {
                id: user._id,
                name: user.name,
                login: user.login,
                email: user.email,
            },
            message: "Требуется подтверждение email"
        };
    }

    async verifyEmail(login: string, code: string) {
        const user = await this.userRepo.findByLogin(login);
        if (!user) {
            throw new AuthError("Пользователь не найден");
        }

        const redisKey = `verification:${login}`;
        const storedCode = await this.redisService.get(redisKey);

        if (!storedCode) {
            throw new AuthError("Код подтверждения не найден или истек.");
        }

        if (storedCode !== code) {
            throw new ValidationError("Неверный код подтверждения.");
        }
        await this.redisService.del(redisKey);

        await this.userRepo.update(user._id, { isEmailVerified: true });

        return await this.generateTokens(user);
    }
    // Логин
    async login(identifier: string, password: string) {
        let user;
        if (identifier.includes('@')) {
            user = await this.userRepo.findByEmail(identifier);
        } else {
            user = await this.userRepo.findByLogin(identifier);
        }

        if (!user) {
            throw new AuthError("Неверный логин или пароль");
        }

        logger.debug(`Попытка входа пользователя: ${user.login}`);

        // 2. Проверка пароля
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw new AuthError("Неверный логин или пароль");
        }

        // 3. Проверка подтверждения Email
        if (!user.isEmailVerified) {
            throw new AuthError("Требуется подтверждение Email. Проверьте ваш почтовый ящик.");
        }

        // 4. Генерируем токены и возвращаем результат
        const tokens = await this.generateTokens(user);

        return {
            user: {
                id: user._id,
                login: user.login,
                email: user.email,
                name: user.name
            },
            ...tokens
        };
    }

    // Генерация токенов

    private async generateTokens(user: IUser) {
        try {
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    login: user.login,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES } as SignOptions
            );

            const refreshToken = jwt.sign(
                { id: user._id },
                JWT_SECRET,
                { expiresIn: JWT_REFRESH_EXPIRES } as SignOptions
            );

            const ttlSeconds = this.parseExpiresIn(JWT_REFRESH_EXPIRES);
            await this.redisService.set(`refresh:${user._id}`, refreshToken, ttlSeconds);

            return { accessToken, refreshToken };
        } catch (err) {
            throw new TokenError("Не удалось сгенерировать токены.");
        }
    }

    // Обновление токенов через refresh
    async refreshTokens(refreshToken: string) {
        let payload: any;
        try {
            payload = jwt.verify(refreshToken, JWT_SECRET);
        } catch (err) {
            throw new TokenError("Недействительный или истекший refresh токен.");
        }

        const userId = payload.id;
        const storedToken = await this.redisService.get(`refresh:${userId}`);

        if (!storedToken || storedToken !== refreshToken) {
            throw new TokenError("Refresh токен не найден или был отозван.");
        }

        const user = await this.userRepo.findById(userId);
        if (!user) {
            // Хотя токен валиден, пользователь не существует в DB
            throw new AuthError("Пользователь не найден");
        }

        return await this.generateTokens(user);
    }

    // Logout
    async logout(userId: string) {
        await this.redisService.del(`refresh:${userId}`);
    }

    private parseExpiresIn(exp: string): number {
        const num = parseInt(exp.slice(0, -1));
        const unit = exp.slice(-1);
        switch (unit) {
            case "s": return num;
            case "m": return num * 60;
            case "h": return num * 60 * 60;
            case "d": return num * 24 * 60 * 60;
            default: return num;
        }
    }

    // Получение пользователя по accessToken
    async getUserByAccessToken(accessToken: string) {
        try {
            const payload = jwt.verify(accessToken, JWT_SECRET) as { id: string };
            const user = await this.userRepo.findById(payload.id);

            if (!user) {
                throw new AuthError("Пользователь не найден");
            }

            return user;
        } catch (err) {
            throw new TokenError("Недействительный или истекший access токен");
        }
    }

    // Проверка правильности токена
    verifyAccessToken(token: string): { id: string; role: string } {
        try {
            const payload = jwt.verify(token, JWT_SECRET);

            if (typeof payload === "string" || !("id" in payload) || !("role" in payload)) {
                throw new TokenError("Некорректный токен: отсутствуют необходимые данные");
            }

            return payload as { id: string; role: string };
        } catch (err) {
            throw new TokenError("Недействительный или истекший access токен.");
        }
    }

    // 1. Запрос на сброс пароля
    async resetPassword(email: string) {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new AuthError("Пользователь с такой почтой не найден");
        }

        const resetCode = this.generateVerificationCode();
        const redisKey = `${RESET_PASSWORD_PREFIX}${email}`;

        await this.redisService.set(
            redisKey,
            resetCode,
            RESET_PASSWORD_TTL
        );

        // Отправляем письмо (убедитесь, что в EmailService есть соответствующий метод)
        await this.emailService.sendResetPasswordEmail(user.email, resetCode);

        return { message: "Код для сброса пароля отправлен на вашу почту" };
    }

    // 2. Подтверждение сброса и установка нового пароля
    async confirmReset(email: string, code: string, newPassword: string) {
        const redisKey = `${RESET_PASSWORD_PREFIX}${email}`;

        // 1. Проверяем код в Redis
        const storedCode = await this.redisService.get(redisKey);
        if (!storedCode) {
            throw new AuthError("Код просрочен или не запрашивался");
        }

        if (storedCode !== code) {
            throw new ValidationError("Неверный код сброса пароля");
        }

        // 2. Находим пользователя
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new AuthError("Пользователь не найден");
        }

        // 3. Хешируем новый пароль и обновляем БД
        const hashedPassword = await hashPassword(newPassword);
        await this.userRepo.update(user._id, { password: hashedPassword });

        // 4. Удаляем код из Redis и (опционально) аннулируем текущие сессии
        await this.redisService.del(redisKey);
        await this.redisService.del(`refresh:${user._id}`);

        return { message: "Пароль успешно изменен" };
    }
}