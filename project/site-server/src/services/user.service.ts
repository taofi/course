import UserRepository from "@src/db/repositories/user.repository";
import { IUser } from "@src/db/models/user.model";
import { AuthError, ValidationError } from "@src/utils/CustomErrors";
import { Types } from "mongoose";
import * as fs from 'fs/promises'; 
import * as path from 'path';
import logger from '@src/utils/logger';

const AVATAR_DIR_NAME = '/public/avatars';

interface UserUpdateData {
    name?: string;
    login?: string;
    email?: string;
}

export class UserService {
    constructor(private userRepo: UserRepository) {}

    /**
     * Возвращает список всех пользователей.
     * Пароли исключены в UserRepository.getAll().
     * @returns {Promise<IUser[]>} Список пользователей
     */
    async getAllUsers(): Promise<IUser[]> {
        return this.userRepo.getAll();
    }

    /**
     * Находит пользователя по ID.
     * @param {string | Types.ObjectId} id ID пользователя
     * @returns {Promise<IUser | null>} Объект пользователя или null
     */
    async getUserById(id: string | Types.ObjectId): Promise<IUser> {
        const user = await this.userRepo.findById(id);
        if (!user) {
            throw new AuthError("Пользователь не найден.");
        }
        return user;
    }

    /**
     * Обновляет общую информацию о пользователе (имя, логин, email).
     * @param {string} userId ID пользователя
     * @param {UserUpdateData} data Обновляемые данные
     * @returns {Promise<IUser>} Обновленный объект пользователя
     */
    async updateUser(userId: string, data: UserUpdateData): Promise<IUser> {
        // 1. Проверяем существование пользователя
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new AuthError("Пользователь не найден.");
        }

        // 2. Проверяем, не заняты ли обновляемые логин или email
        if (data.login && data.login !== user.login) {
            const existingByLogin = await this.userRepo.findByLogin(data.login);
            if (existingByLogin) {
                throw new AuthError("Пользователь с таким логином уже существует.");
            }
        }

        if (data.email && data.email !== user.email) {
            const existingByEmail = await this.userRepo.findByEmail(data.email);
            if (existingByEmail) {
                throw new AuthError("Пользователь с таким email уже существует.");
            }
        }

        // 3. Обновляем и возвращаем результат
        const updatedUser = await this.userRepo.update(userId, data);
        if (!updatedUser) {
            // Теоретически не должно произойти после первой проверки, но для безопасности
            throw new Error("Не удалось обновить пользователя.");
        }

        return updatedUser;
    }

    
    async changeAvatar(userId: string, newFilePath: string): Promise<IUser> {
        
        const user = await this.userRepo.findById(userId);
        if (!user) {
            try { await fs.unlink(newFilePath); } catch (e) { }
            throw new AuthError("Пользователь не найден.");
        }
        
        const oldAvatarDbPath = user.avatar;
        
        const normalizedFilePath = newFilePath.replace(/\\/g, '/'); 

        const publicRootSegment = '/src/public';
        const index = normalizedFilePath.indexOf(publicRootSegment);
        
        if (index === -1) {
            logger.error(`Не удалось найти сегмент пути '${publicRootSegment}' в ${newFilePath}.`);
            try { await fs.unlink(newFilePath); } catch (e) { }
            throw new Error("Не удалось определить относительный путь для аватара. Проверьте структуру проекта.");
        }
        
        const newAvatarDbPath =  normalizedFilePath.substring(index + 4); 
        
        const updatedUser = await this.userRepo.update(userId, { avatar: newAvatarDbPath });

        if (!updatedUser) {
            try { await fs.unlink(newFilePath); } catch (e) { /* Игнорируем */ }
            throw new Error("Не удалось обновить путь аватара в базе данных.");
        }

        if (oldAvatarDbPath && oldAvatarDbPath !== newAvatarDbPath) {
            
            if (oldAvatarDbPath.startsWith('/public')) {
                 const relativePathFromCwd = path.join('src', oldAvatarDbPath.substring(1)); 
                 const oldAbsoluteFilePath = path.join(process.cwd(), relativePathFromCwd);
                 
                 try {
                     await fs.unlink(oldAbsoluteFilePath);
                     logger.debug(`Старый файл аватара удален: ${oldAbsoluteFilePath}`);
                 } catch (err) {
                     logger.warn(`Не удалось удалить старый файл аватара ${oldAbsoluteFilePath}. ${err}`);
                 }
            } else {
                 logger.warn(`Неизвестный формат старого пути аватара: ${oldAvatarDbPath}. Пропускаем удаление.`);
            }
        }

        return updatedUser;
    }


    /**
     * Получает список доступных имен файлов аватаров из public/avatars.
     * @returns {Promise<string[]>} Список имен файлов.
     */
    async getAvailableAvatars(): Promise<string[]> {
        // Определяем путь к папке public/avatars
        const PUBLIC_AVATAR_PATH = path.join(process.cwd(), 'src', 'public', 'avatars'); 
        try {
            // Читаем содержимое директории
            const filenames = await fs.readdir(PUBLIC_AVATAR_PATH);
            
            const avatarFiles: string[] = [];

            // Проверяем, что каждый элемент является файлом
            for (const filename of filenames) {
                 const fullPath = path.join(PUBLIC_AVATAR_PATH, filename);
                 const stats = await fs.stat(fullPath); 

                 if (stats.isFile()) {
                      // Возвращаем только имя файла. Клиент сам сформирует полный URL.
                      avatarFiles.push(filename);
                 }
            }

            return avatarFiles;
        } catch (error) {
            logger.error(`Ошибка при чтении папки public/avatars: ${error}`);
            // Если директория не найдена, возвращаем пустой массив
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return []; 
            }
            throw error;
        }
    }

    async selectDefaultAvatar(userId: string, newAvatarPath: string): Promise<IUser> {
        if (!newAvatarPath || !newAvatarPath.startsWith(AVATAR_DIR_NAME)) {
            throw new ValidationError("Некорректный путь аватара.");
        }

        const updatedUser = await this.userRepo.update(userId, { avatar: newAvatarPath });

        if (!updatedUser) {
            throw new Error("Не удалось обновить путь аватара в базе данных.");
        }
        

        logger.debug(`Пользователь ID ${userId} выбрал стандартный аватар: ${newAvatarPath}`);
        return updatedUser;
    }
}