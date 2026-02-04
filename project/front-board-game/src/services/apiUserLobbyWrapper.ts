// src/services/apiUserLobbyWrapper.ts

import { api } from './apiService'; 
import type { PublicUser } from '../types/userTypes'; 

export interface UserDetails {
    id: string;
    username: string; 
    avatarUrl?:string;
}

const userCache: Record<string, UserDetails> = {};

// Вспомогательная функция для получения деталей одного пользователя
const getById = async (userId: string): Promise<UserDetails> => {
    if (userCache[userId]) {
        return userCache[userId];
    }

    // Начальное значение для случая ошибки
    let userDetails: UserDetails = { 
        id: userId, 
        username: `Ошибка загрузки (${userId.substring(0, 4)})` 
    };
    
    try {
        const response = await api.get<PublicUser>(`/user/${userId}`);

        // 1. Убеждаемся, что ID определен (учитываем id или _id)
        const userFoundId = (response.data as any).id || (response.data as any)._id || userId;

        // 2. Извлекаем имя из поля 'name'. Если оно пустое, используем ID.
        const userName = response.data.name && response.data.name.trim() !== '' 
            ? response.data.name 
            : userFoundId;

        // Успешное обновление userDetails
        userDetails = { 
            id: userFoundId, 
            username: userName
        };

    } catch (error) {
        // Ошибка обрабатывается, но мы не re-throw, чтобы не обрушить Promise.allSettled
        console.error(`Ошибка при получении данных пользователя ${userId}:`, error);
        // handleApiError(error); // Можно оставить, если он не re-throw
    } finally {
        // 3. КЭШИРОВАНИЕ: Сохраняем результат (успешный или ошибочный) в кэше
        userCache[userId] = userDetails;
    }

    return userDetails;
}

export const apiUserLobby = {
    /**
     * Получает детали (ID и имя) для массива пользователей.
     */
    getManyByIds: async (userIds: string[]): Promise<UserDetails[]> => {
        const uniqueIds = Array.from(new Set(userIds));
        
        // Запускаем все запросы асинхронно
        const fetchPromises = uniqueIds.map(getById);
        
        // Дожидаемся всех
        await Promise.allSettled(fetchPromises); 
        
        // Собираем результаты из кэша. userCache[id] теперь всегда определен.
        return uniqueIds.map(id => userCache[id]);
    }
};