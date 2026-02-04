// src/services/apiUser.ts

import { api, handleApiError } from './apiService'; // Импортируем настроенный Axios инстанс
import type { User } from '../types/authTypes'; // Предполагаем, что тип User определен здесь
import type { AvatarListResponse, AvatarUpdateResponse, PublicUser, UserUpdateData } from '@/types/userTypes';
import type { UserDetails } from './apiUserLobbyWrapper';

// --- Сервис ApiUser ---

export const ApiUser = {

    /**
     * [GET] Получает данные текущего аутентифицированного пользователя.
     * Соответствует: GET /api/user/
     */
    async getCurrentUser(): Promise<User> {
        try {
            const response = await api.get<User>('/user');
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * [PUT] Обновляет информацию о текущем пользователе.
     * Соответствует: PUT /api/user/
     * @param data Обновляемые данные
     */
    async updateUser(data: UserUpdateData): Promise<User> {
        try {
            const response = await api.put<User>('/user', data);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * [POST] Меняет аватар текущего пользователя.
     * Соответствует: POST /api/user/avatar
     * @param file Объект File (файл аватара)
     */
    async changeAvatar(file: File): Promise<AvatarUpdateResponse> {
        // Axios и сервер ожидают данные в формате FormData для загрузки файлов
        const formData = new FormData();
        // Название поля 'avatar' должно совпадать с тем, что ожидает multer на сервере
        // (см. uploadAvatar.single('avatar') в user.routes)
        formData.append('avatar', file);

        try {
            const response = await api.post<AvatarUpdateResponse>('/user/avatar', formData, {
                
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * [GET] Получает список доступных имен файлов аватаров.
     * Соответствует: GET /api/user/avatars/list
     */
    async getAvailableAvatars(): Promise<string[]> {
        try {
            const response = await api.get<AvatarListResponse>('/user/avatars/list');
            return response.data.files;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * [POST] Устанавливает стандартный аватар по пути.
     * Соответствует: POST /api/user/avatar/select
     * @param avatarPath Относительный путь аватара (например, 'uploads/avatars/default.png')
     */
    async selectDefaultAvatar(avatarPath: string): Promise<AvatarUpdateResponse> {
        try {
            const response = await api.post<AvatarUpdateResponse>('/user/avatar/select', {
                avatarPath: avatarPath,
            });
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },


    async getById(userId: string): Promise<UserDetails> {
       
        let userDetails: UserDetails;
        try {
            const response = await api.get<PublicUser>(`/user/${userId}`);
    
            const userFoundId = (response.data).id || userId; 
    
            // 2. Извлекаем имя из поля 'name'. Если оно пустое, используем ID.
            const userName = response.data.name && response.data.name.trim() !== '' 
                ? response.data.name 
                : userFoundId;
    
            // Успешное обновление userDetails
            userDetails = { 
                id: userFoundId, 
                username: userName,
                avatarUrl: response.data.avatar || "",
            };
            return userDetails;
        } catch (error) {
            console.error(`Ошибка при получении данных пользователя ${userId}:`, error);
            // Возвращаем данные-заглушку в случае ошибки
             return { 
                id: userId, 
                username: `Ошибка загрузки (${userId.substring(0, 4)})` 
            };
        }
    }

    
};


