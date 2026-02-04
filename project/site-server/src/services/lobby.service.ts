// src/services/LobbyService.ts

import { RedisService } from './redis.service';
import { Lobby, LobbyDetails, LobbyHashData, UserParticipant } from '../game/models/LobbyModels';
import { v4 as uuidv4 } from 'uuid'; 
import logger from '@src/utils/logger'; 
import { WebSocketService, wsService } from './ws.service';
import { ForbiddenError, LobbyNotFoundError, ValidationError } from '@src/utils/CustomErrors';
import {  LobbyStatus, LobbyType } from '@munchkin/shared';

// Создаем экземпляр RedisService для использования в LobbyService
const redisServiceInstance = new RedisService();

export class LobbyService {
    private redisService: RedisService;

    private readonly KEY = {
        LOBBY_DATA: (id: string) => `lobby:${id}:data`, // Hash для метаданных лобби
        LOBBY_MEMBERS: (id: string) => `lobby:${id}:members`, // Set для ID участников
        LOBBY_READY: (id: string) => `lobby:${id}:ready`, // Hash для статусов готовности {userId: 'true'/'false'}
        USER_LOBBY: (userId: string) => `user:${userId}:lobby`, // String для обратной ссылки на лобби
        ACTIVE_LOBBIES_SET: 'active:lobbies',  // Set для всех активных ID лобби
    };

    // TTL для лобби (например, 2 часа)
    private readonly LOBBY_TTL_SECONDS = 7200;

    constructor(redisService: RedisService) {
        this.redisService = redisService;
    }

    // --- Вспомогательные методы ---

    // Десериализация данных лобби из Redis Hash в объект Lobby
    private parseLobbyData(data: Record<string, string | undefined>): Lobby {
        // Добавление проверки на обязательные поля
        if (!data.id || !data.creatorId || !data.type || !data.maxPlayers || !data.status || !data.name) {
            logger.error("Incomplete lobby data received from Redis", data);
            throw new Error("Lobby data is missing critical fields.");
        }

        return {
            id: data.id,
            name: data.name,
            creatorId: data.creatorId,
            type: data.type as LobbyType,
            isPrivate: data.isPrivate === 'true',
            password: data.password || undefined,
            maxPlayers: parseInt(data.maxPlayers, 10),
            status: data.status as LobbyStatus,
        };
    }

    // --- Основные методы управления лобби ---

    /**
     * Создает новое лобби в Redis.
     * @param initialData Основные данные лобби.
     * @param creatorId ID пользователя-создателя.
     */
    async createLobby(initialData: Omit<Lobby, 'id' | 'status'>, creatorId: string): Promise<Lobby> {
        const lobbyId = uuidv4();
        const lobbyKey = this.KEY.LOBBY_DATA(lobbyId);

        // Подготовка данных для Redis Hash (без изменений)
        const lobbyHashData: LobbyHashData = {
            id: lobbyId,
            creatorId,
            name:initialData.name,
            type: initialData.type,
            isPrivate: initialData.isPrivate.toString(),
            password: initialData.password,
            maxPlayers: initialData.maxPlayers.toString(),
            status: LobbyStatus.WAITING,
        };

        try {
            await Promise.all(
                Object.entries(lobbyHashData as Record<string, any>).map(([field, value]) =>
                    this.redisService.hSet(lobbyKey, field, value ?? '')
                )
            );

            await this.addPlayerToLobby(lobbyId, creatorId, true);

            await this.redisService.sAdd(this.KEY.ACTIVE_LOBBIES_SET, lobbyId);

            logger.info(`Lobby created: ${lobbyId} by ${creatorId}`);
            return this.parseLobbyData(lobbyHashData);

        } catch (error) {
            logger.error(`Failed to create lobby ${lobbyId}:`, error);
            await this.deleteLobby(lobbyId);
            throw new Error("Lobby creation failed");
        }
    }

    /**
     * Добавляет игрока в лобби (и обновляет обратную ссылку пользователя).
     * @param lobbyId ID лобби.
     * @param userId ID пользователя.
     * @param setTTL Установить TTL для лобби (только при создании).
     */
    private async addPlayerToLobby(lobbyId: string, userId: string, setTTL: boolean): Promise<void> {
        const memberKey = this.KEY.LOBBY_MEMBERS(lobbyId);
        const readyKey = this.KEY.LOBBY_READY(lobbyId);
        const userLobbyKey = this.KEY.USER_LOBBY(userId);
        const lobbyDataKey = this.KEY.LOBBY_DATA(lobbyId);

        // Для простоты, используем последовательные вызовы через RedisService:

        // 1. Добавить ID игрока в Set участников
        await this.redisService.sAdd(memberKey, userId);

        // 2. Установить статус готовности по умолчанию (false)
        await this.redisService.hSet(readyKey, userId, 'false');

        // 3. Установить обратную ссылку игрока на лобби
        await this.redisService.set(userLobbyKey, lobbyId);

        // 4. Установить TTL для всех ключей, связанных с лобби
        if (setTTL) {
            await this.redisService.expire(lobbyDataKey, this.LOBBY_TTL_SECONDS);
            await this.redisService.expire(memberKey, this.LOBBY_TTL_SECONDS);
            await this.redisService.expire(readyKey, this.LOBBY_TTL_SECONDS);
        }
    }

    /**
     * Присоединение игрока к существующему лобби.
     */
    async joinLobby(lobbyId: string, userId: string, password?: string): Promise<LobbyDetails> {
        const lobbyData = await this.redisService.hGetAll(this.KEY.LOBBY_DATA(lobbyId)); 
        if (!lobbyData || !lobbyData.id) { 
            throw new LobbyNotFoundError('Lobby not found');
        }

        const lobby = this.parseLobbyData(lobbyData); 

        // 1. Проверки бизнес-логики (оставлены без изменений)
        if (lobby.isPrivate && lobby.password !== password) { 
            throw new ForbiddenError('Не правильный пароль');
        }

        const currentMembers = await this.getLobbyMembers(lobbyId); 
        if (currentMembers.length >= lobby.maxPlayers) { 
            throw new ForbiddenError('Лобби заполнено');
        }
        if (lobby.status !== LobbyStatus.WAITING) { 
            throw new ForbiddenError('Лобби не принимает игроков');
        }
        if (currentMembers.some(p => p.id === userId)) { 
            logger.info(`User ${userId} allredy in lobby ${lobbyId}`);
        }
        else
            await this.addPlayerToLobby(lobbyId, userId, false); 

        logger.info(`User ${userId} joined lobby ${lobbyId}`);
        const details = await this.getLobbyDetails(lobbyId);
        
        wsService.sendLobbyUpdate(lobbyId, details);

        return details; 
    }

    /**
     * НОВЫЙ МЕТОД: Удаляет игрока из лобби и транслирует обновление.
     */
    async removePlayerFromLobby(lobbyId: string, userId: string): Promise<LobbyDetails | null> {
        const memberKey = this.KEY.LOBBY_MEMBERS(lobbyId);
        const readyKey = this.KEY.LOBBY_READY(lobbyId);
        const userLobbyKey = this.KEY.USER_LOBBY(userId);

        try {
            // 1. Удалить ID игрока из Set участников
            await this.redisService.sRem(memberKey, userId);
            // 2. Удалить статус готовности
            await this.redisService.hDel(readyKey, userId);
            // 3. Удалить обратную ссылку
            await this.redisService.del(userLobbyKey);

            logger.info(`User ${userId} removed from lobby ${lobbyId}.`);

            // 4. Проверить, остались ли участники. Если нет, удалить лобби.
            const remainingMembers = await this.redisService.sMembers(memberKey);
            if (remainingMembers.length === 0) {
                logger.info(`Lobby ${lobbyId} is empty. Deleting lobby.`);
                await this.deleteLobby(lobbyId);
                return null; // Лобби удалено
            }

            // 5. Получить и транслировать обновленное состояние лобби
            const details = await this.getLobbyDetails(lobbyId);
            wsService.sendLobbyUpdate(lobbyId, details); 
            
            return details;

        } catch (error) {
            logger.error(`Failed to remove player ${userId} from lobby ${lobbyId}:`, error);
            throw new Error("Lobby removal failed");
        }
    }


    /**
     * Получает полную информацию о лобби, включая участников.
     */
    async getLobbyDetails(lobbyId: string): Promise<LobbyDetails> {
        const lobbyData = await this.redisService.hGetAll(this.KEY.LOBBY_DATA(lobbyId));
        if (!lobbyData || !lobbyData.id) {
            throw new Error('Lobby not found');
        }

        const lobby = this.parseLobbyData(lobbyData);
        const participants = await this.getLobbyMembers(lobbyId);

        return {
            ...lobby,
            participants,
        };
    }

    /**
     * Получает список участников лобби со статусом готовности.
     */
    async getLobbyMembers(lobbyId: string): Promise<UserParticipant[]> {
        const memberIds = await this.redisService.sMembers(this.KEY.LOBBY_MEMBERS(lobbyId));
        const readyStatuses = await this.redisService.hGetAll(this.KEY.LOBBY_READY(lobbyId));

        // Маппинг ID участников и их статусов
        return memberIds.map(id => ({
            id,
            isReady: readyStatuses[id] === 'true',
        }));
    }

    /**
     * Обновляет статус готовности игрока.
     */
    async setReadyStatus(lobbyId: string, userId: string, isReady: boolean): Promise<void> {
        const readyKey = this.KEY.LOBBY_READY(lobbyId); 
        await this.redisService.hSet(readyKey, userId, isReady ? 'true' : 'false'); 
        logger.debug(`User ${userId} set ready status to ${isReady} in lobby ${lobbyId}`); 
        
        const details = await this.getLobbyDetails(lobbyId);

        // !!! ДОБАВЛЕНО: Трансляция обновления лобби через WebSocket !!!
        wsService.sendLobbyUpdate(lobbyId, details);
    }

    /**
     * Удаляет все данные лобби из Redis.
     */
    async deleteLobby(lobbyId: string): Promise<void> {
        // 1. Получаем всех участников, чтобы удалить их обратные ссылки
        const memberIds = await this.redisService.sMembers(this.KEY.LOBBY_MEMBERS(lobbyId)); 
        
        // !!! ДОБАВЛЕНО: Уведомление клиентов о закрытии лобби ПЕРЕД удалением ключей !!!
        // Отправляем специальный статус или сообщение
        wsService.sendLobbyUpdate(lobbyId, { 
            id: lobbyId, 
            name: '',
            creatorId: '', 
            type: '' as LobbyType, 
            isPrivate: false, 
            maxPlayers: 0, 
            status: LobbyStatus.CLOSED, // Используйте статус CLOSED для уведомления клиента
            participants: [] 
        } as LobbyDetails);
        
        // ... (остальной код удаления ключей) ...
        const keysToDelete = [
            this.KEY.LOBBY_DATA(lobbyId),
            this.KEY.LOBBY_MEMBERS(lobbyId),
            this.KEY.LOBBY_READY(lobbyId),
            
            // Ключи обратных ссылок пользователей
            ...memberIds.map(userId => this.KEY.USER_LOBBY(userId)), 
        ];

        // Используем Promise.all для параллельного удаления всех прямых ключей
        await Promise.all(keysToDelete.map(async (key) => {
             try {
                 await this.redisService.del(key); 
             } catch (error) {
                 logger.warn(`Failed to delete key: ${key}. Error: ${error}`);
             }
        }));

        try {
            await this.redisService.sRem(this.KEY.ACTIVE_LOBBIES_SET, lobbyId); 
        } catch (error) {
            logger.error(`CRITICAL: Failed to remove ${lobbyId} from ${this.KEY.ACTIVE_LOBBIES_SET}. Error: ${error}`);
        }
        
        logger.info(`Lobby ${lobbyId} and associated keys deleted.`); 
    }
    /**
     * Проверяет, готов ли каждый участник в лобби.
     */
    async areAllReady(lobbyId: string): Promise<boolean> {
        const lobbyData = await this.redisService.hGetAll(this.KEY.LOBBY_DATA(lobbyId));
        if (!lobbyData || !lobbyData.id) return false;

        const lobby = this.parseLobbyData(lobbyData);
        const readyStatuses = await this.redisService.hGetAll(this.KEY.LOBBY_READY(lobbyId));
        const currentMembersCount = Object.keys(readyStatuses).length;

        // Проверка 1: Достаточно ли игроков для начала?
        if (currentMembersCount < 3) return false;

        // Проверка 2: Все ли игроки установили статус 'true'?
        for (const status of Object.values(readyStatuses)) {
            if (status !== 'true') {
                return false;
            }
        }

        return true;
    }


    async getAllLobbyIds(): Promise<string[]> {
        try {
            // Используем sMembers для получения всех элементов набора
            const lobbyIds = await this.redisService.sMembers(this.KEY.ACTIVE_LOBBIES_SET);
            return lobbyIds;
        } catch (err: any) {
            logger.error(`Failed to get all lobby IDs: ${err.message}`);
            return [];
        }
    }

    /**
     * Получает полную информацию обо всех активных лобби.
     */
    async getAllLobbies(): Promise<LobbyDetails[]> {
        const lobbyIds = await this.getAllLobbyIds();
        
        if (lobbyIds.length === 0) {
            return [];
        }
    
        const lobbyDetailsPromises = lobbyIds.map(async (lobbyId) => {
            try {
                // Используем getLobbyDetails для получения полной информации о каждом лобби
                const details = await this.getLobbyDetails(lobbyId);
                return details;
            } catch (error) {
                // Лобби может быть устаревшим, если TTL сработал, а cleanup еще не прошел.
                // В этом случае, мы просто логируем ошибку и пропускаем это лобби.
                logger.warn(`Skipping lobby ${lobbyId} due to error: ${error}. Triggering cleanup.`);
                
                try {
                    await this.redisService.sRem(this.KEY.ACTIVE_LOBBIES_SET, lobbyId);
                    logger.debug(`Cleaned up stale lobby ID: ${lobbyId} from ACTIVE_LOBBIES_SET.`);
                } catch (cleanupError) {
                    logger.error(`Failed to cleanup stale lobby ID ${lobbyId}: ${cleanupError}`);
                }
                
                return null;
            }
        });
        const results = await Promise.all(lobbyDetailsPromises);
        return results.filter((lobby): lobby is LobbyDetails => lobby !== null);
    }

    async kickPlayer(lobbyId: string, requesterId: string, targetUserId: string): Promise<void> {
        // 1. Получаем данные лобби
        const lobby = await this.getLobbyDetails(lobbyId);

        // 2. Проверка прав (бизнес-логика в сервисе)
        if (lobby.creatorId !== requesterId) {
            throw new ForbiddenError("Только создатель лобби может удалять игроков");
        }

        if (targetUserId === requesterId) {
            throw new ValidationError("Вы не можете выгнать самого себя");
        }

        // 3. Удаляем игрока из Redis (используем существующий метод)
        await this.removePlayerFromLobby(lobbyId, targetUserId);

        // 4. РАБОТА С WS ВНУТРИ СЕРВИСА
        wsService.sendToUser(targetUserId, 'kicked_from_lobby', {
            message: "Вы были исключены из лобби создателем",
            lobbyId: lobbyId
        });

        // Отправляем обновленный список игроков всем остальным
        const updatedLobby = await this.getLobbyDetails(lobbyId);
        wsService.sendLobbyUpdate(lobbyId, updatedLobby);

        logger.info(`Player ${targetUserId} kicked from lobby ${lobbyId} by ${requesterId}`);
    }
}

// Экспортируем экземпляр сервиса
export const lobbyService = new LobbyService(redisServiceInstance);