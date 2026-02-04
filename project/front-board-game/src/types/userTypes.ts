import type { User } from "./authTypes";

export interface UserUpdateData {
    name?: string;
    login?: string;
    email?: string;
}

export interface AvatarUpdateResponse {
    message: string;
    avatarPath: string; // Новый относительный путь аватара
    user: User;        // Обновленный объект пользователя
}

export interface AvatarListResponse {
    files: string[]; // Массив имен файлов
}

export interface PublicUser {
    id: string;      // ID пользователя
    name: string;    // Имя пользователя (будет отображаться в лобби)
    avatar: string;  // Путь к аватару
}

export interface UserUpdateData {
    name?: string;
    login?: string;
    email?: string;
}

export interface AvatarUpdateResponse {
    message: string;
    avatarPath: string; // Новый относительный путь аватара
    user: User;        // Обновленный объект пользователя
}

export interface AvatarListResponse {
    files: string[]; // Массив имен файлов
}