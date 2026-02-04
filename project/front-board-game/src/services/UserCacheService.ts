// src/services/UserCacheService.ts

import { ApiUser } from './apiUser';
// Импортируем UserDetails для типа данных в кэше
import type { UserDetails } from './apiUserLobbyWrapper'; 

/**
 * Сервис для кэширования данных пользователей в памяти (In-Memory Cache).
 * Это Singleton, чтобы обеспечить единый кэш на всё приложение.
 */
export class UserCacheService {
    // Кэш: Map<userId, UserDetails>
    private usersCache: Map<string, UserDetails> = new Map();
    
    // Опционально: Кэш для промисов, чтобы избежать повторных запросов
    // пока первый запрос находится в процессе выполнения (Throttling/Deduplication)
    private pendingFetches: Map<string, Promise<UserDetails>> = new Map();

    private static instance: UserCacheService;

    // Приватный конструктор для реализации паттерна Singleton
    private constructor() {}

    /**
     * Получает единственный экземпляр UserCacheService.
     */
    public static getInstance(): UserCacheService {
        if (!UserCacheService.instance) {
            UserCacheService.instance = new UserCacheService();
        }
        return UserCacheService.instance;
    }

    /**
     * Получает детали пользователя по ID. Сначала проверяет кэш.
     * @param userId ID пользователя.
     * @returns Детали пользователя.
     */
    public async getById(userId: string): Promise<UserDetails> {
        // 1. ПРОВЕРКА КЭША
        if (this.usersCache.has(userId)) {
            console.debug(`[Cache] Cache Hit: Пользователь ${userId} найден в памяти.`);
            return this.usersCache.get(userId)!;
        }

        // 2. ПРОВЕРКА ОЖИДАЮЩЕГО ЗАПРОСА (Deduplication)
        if (this.pendingFetches.has(userId)) {
            console.debug(`[Cache] Deduplication: Запрос для ${userId} уже выполняется.`);
            return this.pendingFetches.get(userId)!;
        }

        console.debug(`[Cache] Cache Miss: Загрузка пользователя ${userId} через API.`);

        // 3. КЭШ-ПРОМАХ: Выполнение запроса
        const fetchPromise = ApiUser.getById(userId);
        
        // Сохраняем промис, чтобы другие одновременные запросы использовали его
        this.pendingFetches.set(userId, fetchPromise);

        try {
            const userDetails = await fetchPromise;

            // 4. СОХРАНЕНИЕ В КЭШ
            this.usersCache.set(userId, userDetails);
            
            return userDetails;
        } finally {
            // Удаляем промис из Map, независимо от результата
            this.pendingFetches.delete(userId);
        }
    }

    /**
     * Добавляет или обновляет пользователя в кэше вручную.
     * @param userDetails Детали пользователя.
     */
    public set(userDetails: UserDetails): void {
        this.usersCache.set(userDetails.id, userDetails);
        console.debug(`[Cache] Пользователь ${userDetails.id} (${userDetails.username}) обновлен в кэше.`);
    }

    /**
     * Очищает весь кэш.
     */
    public clear(): void {
        this.usersCache.clear();
        this.pendingFetches.clear();
        console.warn('[Cache] Весь кэш пользователей очищен.');
    }
}

export const userCacheService = UserCacheService.getInstance();