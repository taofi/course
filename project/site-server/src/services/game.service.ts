// src/services/game.service.ts
import { v4 as uuidv4 } from 'uuid';
import { GameRedisService } from './game.redis.service';
import { LobbyService } from './lobby.service';
import { DeckInitializationService } from './deck.initialization.service';
import { ForbiddenError, LobbyNotFoundError, ValidationError } from '@src/utils/CustomErrors';
import { GamePhase, LobbyStatus, PlayerActivity } from "@munchkin/shared";
import logger from '@src/utils/logger';
import { GameStatus, IPlayerStats } from '@munchkin/shared';
import { IServerGame } from '@src/game/models/GameModel';
import { wsService } from './ws.service';
import { DeckService } from './deck.service';
import { gameResultRepository } from '@src/db/repositories';
import { IGameResult } from '@src/db/models/gameResult.model';

export class GameService {
    constructor(
        private gameRedisService: GameRedisService,
        private lobbyService: LobbyService,
        private deckService: DeckService,
    ) { }


    async startGame(lobbyId: string, creatorId: string) {
        // 1. Проверки лобби 
        const lobby = await this.lobbyService.getLobbyDetails(lobbyId);
        if (lobby.creatorId !== creatorId) {
            throw new ForbiddenError("Только создатель может запустить игру");
        }
        if (lobby.status !== LobbyStatus.WAITING) {
            throw new ValidationError("Игра уже запущена или закрыта");
        }
    
        const canStart = await this.lobbyService.areAllReady(lobbyId);
        if (!canStart) {
            throw new ValidationError("Не все игроки готовы или недостаточно участников.");
        }
    
        // 2. Инициализируем колоды в Redis через DeckService
        const { doorsCount, treasuresCount } = await this.deckService.initGameDecks(lobbyId);
    
        // 3. Генерируем данные сессии
        const gamePassword = this.generateAlphaPassword(6);
        const participants = lobby.participants.map(p => p.id);
    
        const newGame: IServerGame = {
            id: lobbyId,
            type: lobby.type,
            password: gamePassword,
            status: GameStatus.WAITING,
            phase: GamePhase.IDLE,
            turn: 0,
            participantsId: participants,
            currentPlayerId: '',
            round: 1,
            time: new Date(),
            watchers: [],
            doorsLeftCount: 0,
            treasureLeftCount: 0,
            doorsCount: doorsCount,
            treasureCount: treasuresCount,
            monsterCards: [],
            battleCards: [],
            activeDoor: null,
            phaseQueue: [],
            monsterPower: 0,
            playerPower: 0,
        };
    
        // 4. Сохраняем начальную статистику игроков
        await Promise.all(participants.map(pid => {
            const defaultStats: IPlayerStats = {
                id: pid,
                level: 1,
                agility: 3,
                boots: undefined,
                armor: undefined,
                headGear: undefined,
                oneHand: undefined,
                secondHand: undefined,
                race: undefined,
                tempraryBonus: [],
                permanentBonus: [],
                cards: [],
                cardsCount: 0,
                activity: PlayerActivity.OFFLINE,
            };
            return this.gameRedisService.savePlayerStats(lobbyId, pid, defaultStats as any);
        }));
    
        // 5. Сохраняем объект игры в Redis
        await this.gameRedisService.saveGame(newGame as any);
    
        // 6. Обновляем статус лобби и уведомляем через WebSocket
        await this.lobbyService['redisService'].hSet(`lobby:${lobbyId}:data`, 'status', LobbyStatus.IN_GAME);
        wsService.sendGameStarted(lobbyId, gamePassword);
    
        logger.info(`Game ${lobbyId} started successfully with ${doorsCount} doors and ${treasuresCount} treasures.`);
    
        return {
            gameId: lobbyId,
            password: gamePassword,
            participants: participants
        };
    }

    private generateAlphaPassword(length: number): string {
        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Без путающих символов (0, O, I, 1)
        let result = "";
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    async checkGameAccess(gameId: string, userId: string) {
        // Получаем игру из Redis (используем ранее созданный GameRedisService)
        const game = await this.gameRedisService.getGame(gameId);

        if (!game) {
            // Если игры нет в Redis, значит она либо не создана, либо завершена
            throw new LobbyNotFoundError("Игровая сессия не найдена или уже завершена");
        }

        // Проверяем, есть ли пользователь в участниках или наблюдателях
        const isParticipant = game.participantsId.includes(userId);
        const isWatcher = game.watchers.includes(userId);

        if (!isParticipant && !isWatcher) {
            throw new ForbiddenError("У вас нет доступа к этой игре");
        }

        // Возвращаем пароль и статус (наблюдатель или игрок)
        return {
            password: game.password,
            isWatcher: !!isWatcher
        };
    }


    /**
 * Получает текущую фазу игры
 * @param gameId ID игры
 * @returns Текущая фаза (из enum GamePhase)
 */
    async getGamePhase(gameId: string): Promise<GamePhase> {
        const game = await this.gameRedisService.getGame(gameId);

        if (!game) {
            throw new LobbyNotFoundError("Игровая сессия не найдена");
        }

        return game.phase as GamePhase;
    }

    /**
     * Обновляет текущую фазу игры (полезно для внутренних переходов)
     */
    async updateGamePhase(gameId: string, newPhase: GamePhase): Promise<void> {
        const game = await this.gameRedisService.getGame(gameId);

        if (!game) {
            throw new LobbyNotFoundError("Игровая сессия не найдена");
        }

        game.phase = newPhase;
        await this.gameRedisService.saveGame(game as any);

        logger.debug(`[GameService] Phase updated: ${gameId} -> ${newPhase}`);
    }

    async getPlayer(gameId: string, userId: string) {
        // 1. Проверяем существование игры
        const game = await this.gameRedisService.getGame(gameId);
        if (!game) {
            throw new LobbyNotFoundError("Игровая сессия не найдена");
        }

        // 2. Проверяем, участвует ли пользователь в этой игре
        const isParticipant = game.participantsId.includes(userId);
        if (!isParticipant) {
            throw new ForbiddenError("Пользователь не является участником этой игры");
        }

        // 3. Получаем статистику игрока из Redis
        const stats = await this.gameRedisService.getPlayerStats(gameId, userId);

        if (!stats) {
            // Если игра есть, а статов нет — это критическая ошибка данных
            logger.error(`Stats not found for player ${userId} in game ${gameId}`);
            throw new ValidationError("Данные игрока не найдены");
        }

        return stats;
    }

    public calculatePlayerStrength(stats: IPlayerStats): number {
        let strength = stats.level;

        strength += stats.boots?.bonus ?? 0;
        strength += stats.armor?.bonus ?? 0;
        strength += stats.headGear?.bonus ?? 0;
        strength += stats.oneHand?.bonus ?? 0;
        strength += stats.secondHand?.bonus ?? 0;


        const tempSum = stats.tempraryBonus.reduce((sum, card) => sum + (card.bonus ?? 0), 0);
        strength += tempSum;

        const permSum = stats.permanentBonus.reduce((sum, card) => sum + (card.bonus ?? 0), 0);
        strength += permSum;

        return strength;
    }

    async createResult(gameId: string, winnerId: string): Promise<IGameResult> {
        // 1. Получаем полные данные игры из Redis
        const game = await this.gameRedisService.getGame(gameId);
        
        if (!game) {
            throw new LobbyNotFoundError("Игровая сессия для создания результата не найдена");
        }

        const resultData: Partial<IGameResult> = {
            id: game.id,               
            players: game.participantsId,
            start: new Date(game.time),   
            end: new Date(),              
            logFile: "log file",                  
            result: winnerId              
        };

        const savedResult = await gameResultRepository.create(resultData);

        logger.info(`[GameService] Game result saved for game ${gameId}. Winner: ${winnerId}`);

        return savedResult;
    }
}