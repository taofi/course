import { Socket, Namespace } from 'socket.io';
import { IPlayerAction, PHASE_PERMISSIONS, IServerEvent, GameStatus, GamePhase } from '@munchkin/shared';
import { gameDispatcher } from './game.dispatcher';
import { ValidationError } from '@src/utils/CustomErrors';
import { SocketEvents } from '@munchkin/shared';
import logger from '@src/utils/logger';
import { GameEventParams, GameEventType } from '@munchkin/shared';
import { Logger } from 'winston';
import { gameEngine } from '../service/game.engine';
import { gameTimerService } from '../service/game.timer.service';
import { GameRuleError } from '@src/utils/GameError';

export class UserDispatcher {
    private isInitialized = false;
    private namespace!: Namespace;

    /**
     * Инициализация шлюза
     */
    public init(namespace: Namespace) {
        if (this.isInitialized) return;
        this.namespace = namespace;

        gameDispatcher.on(GameEventType.UpdateGame, (gameId: string, params: GameEventParams[GameEventType.UpdateGame]) => {
            this.broadcast(gameId, GameEventType.UpdateGame, params);
        });

        gameDispatcher.on(GameEventType.UpdatePlayer, (gameId: string, params: GameEventParams[GameEventType.UpdatePlayer]) => {
            this.broadcast(gameId, GameEventType.UpdatePlayer, params);
        });

        // ТОЛЬКО владелец получает содержимое своей руки
        gameDispatcher.on(GameEventType.InventoryUpdated, (gameId: string, params: GameEventParams[GameEventType.InventoryUpdated]) => {
            this.sendToUser(params.userId, GameEventType.InventoryUpdated, params);
        });

        // Характеристики (уровень/сила) публичны в Манчкине
        gameDispatcher.on(GameEventType.StatsChanged, (gameId: string, params: GameEventParams[GameEventType.StatsChanged]) => {
            this.broadcast(gameId, GameEventType.StatsChanged, params);
        });

        // Лог игры (чат/события)
        gameDispatcher.on(GameEventType.LogMessage, (gameId: string, params: GameEventParams[GameEventType.LogMessage]) => {
            this.broadcast(gameId, GameEventType.LogMessage, params);
        });

        // Состояние игры (фаза/чей ход)
        gameDispatcher.on(GameEventType.StateUpdated, (gameId: string, params: GameEventParams[GameEventType.StateUpdated]) => {
            this.broadcast(gameId, GameEventType.StateUpdated, params);
        });

        gameDispatcher.on(GameEventType.RunResult, (gameId: string, params: GameEventParams[GameEventType.RunResult]) => {
            this.broadcast(gameId, GameEventType.RunResult, params);
        });

        gameDispatcher.on(GameEventType.End, (gameId: string, params: GameEventParams[GameEventType.End]) => {
            this.broadcast(gameId, GameEventType.End, params);
        });


        this.isInitialized = true;
        logger.info("[UserDispatcher] Socket Gateway initialized with Unified Event Stream");
    }



    /**
     * Отправить всем игрокам в конкретной игре
     */

    private broadcast<T extends GameEventType>(gameId: string, type: T, payload: GameEventParams[T]) {
        const event: IServerEvent = {
            type,
            payload
        } as IServerEvent;

        this.namespace.to(`game:${gameId}`).emit('server:event', event);
    }

    private sendToUser<T extends GameEventType>(userId: string, type: T, payload: GameEventParams[T]) {
        const event: IServerEvent = {
            type,
            payload
        } as IServerEvent;
        logger.info(`sended to ${userId}`);
        this.namespace.to(`user:${userId}`).emit('server:event', event);
    }

    /**
     * Обработка действий от игрока
     */
    public async handleAction(socket: Socket, action: IPlayerAction) {
        const { userId, gameId } = socket.data;

        try {
            const gameState = await gameEngine.getGameState(gameId);

            // Валидация прав и фазы (с учетом статуса игры)
            this.validatePhaseAndAuthority(
                gameState.phase,
                gameState.status,
                gameState.currentPlayerId,
                userId,
                action
            );

            await gameDispatcher.dispatch(userId, gameId, action);
        } catch (error: any) {
            let message = "Ошибка при выполнении действия";
            let errorCode = "ACTION_FAILED";
            logger.error(JSON.stringify(error));
            if (error?.name === 'GameRuleError' || error instanceof GameRuleError) {
                message = error.message;
                errorCode = error.code; 
            }
            else if (error instanceof ValidationError) {
                message = error.message;
                errorCode = "VALIDATION_ERROR";
            }

            this.sendToUser(userId, GameEventType.ErrorOccurred, {
                message,
                code: errorCode, 
                userId
            });
            logger.warn(`[UserDispatcher] Action rejected for ${userId}: ${message}`);
        }
    }

    private validatePhaseAndAuthority(
        phase: GamePhase,
        status: GameStatus, // Новый параметр
        currentPlayerId: string,
        userId: string,
        action: IPlayerAction
    ) {
        // 0. Проверка глобального статуса игры
        if (status === GameStatus.PAUSED) {
            throw new ValidationError("Игра на паузе. Дождитесь возвращения всех игроков.");
        }

        if (status !== GameStatus.IN_GAME) {
            throw new ValidationError("Действия доступны только во время активной игры.");
        }

        // 1. Получаем правила для текущей фазы
        const phaseRules = PHASE_PERMISSIONS[phase];
        if (!phaseRules) {
            throw new ValidationError(`Правила для фазы "${phase}" не описаны`);
        }

        // 2. Ищем, разрешено ли действие в этой фазе
        const permission = phaseRules.find(p => p.action === action.name);
        if (!permission) {
            throw new ValidationError(`Действие "${action.name}" недоступно в фазе ${phase}`);
        }

        // 3. Проверяем права доступа
        const isCurrentPlayer = currentPlayerId === userId;

        if (permission.allowedFor === 'nobody') {
            throw new ValidationError("Это действие сейчас заблокировано для всех");
        }

        if (permission.allowedFor === 'current' && !isCurrentPlayer) {
            throw new ValidationError("Это действие может выполнить только активный игрок (сейчас не ваш ход)");
        }
    }
    /**
        * Регистрация пользователя в личной комнате при подключении
        */
    // src/dispatchers/user.dispatcher.ts

    public async onUserConnect(socket: Socket) {
        const { userId, gameId } = socket.data;
        await socket.join(`user:${userId}`);
        // 1. Отменяем таймер смерти
        gameTimerService.cancelCleanupTimer(gameId, userId);

        // 2. Регистрируем вход
        const gameState = await gameDispatcher.playerJoined(gameId, userId);

        // --- ИСПРАВЛЕНИЕ: Проверка на существование данных ---
        if (!gameState) {
            logger.error(`[UserDispatcher] Failed to join game: Game state not found for ${gameId}`);
            socket.emit(GameEventType.ErrorOccurred, { message: "Игра не найдена или сессия истекла" });
            socket.disconnect();
            return;
        }
        logger.debug(`${gameState.status}`);
        // 3. Логика старта или возобновления
        if (gameState.status === GameStatus.WAITING && gameState.onlineCount === gameState.participantsId?.length) {
            await gameEngine.startGame(gameId);
        } else if (gameState.status === GameStatus.PAUSED) {
            await gameEngine.resumeGame(gameId, userId);
        }
    }

    public async handleDisconnect(socket: Socket) {
        const { userId, gameId } = socket.data;
        if (!userId || !gameId) return;

        // 1. Помечаем оффлайн
        await gameDispatcher.playerLeft(gameId, userId);

        // 2. Ставим игру на паузу (визуально для остальных)
        await gameEngine.pauseGame(gameId, userId);

        // 3. Запускаем таймер на 2 минуты
        await gameTimerService.setCleanupTimer(gameId, userId, 120000);
    }

    private allPlayersReady(gameState: any): boolean {
        // Логика: количество подключенных в Redis == количеству участников в IGameData
        return gameState.connectedCount === gameState.participantsId.length;
    }

}

export const userDispatcher = new UserDispatcher();