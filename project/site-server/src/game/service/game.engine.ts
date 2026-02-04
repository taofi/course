import { GameStatus, GamePhase, GameEventType, IDoorData, IQueuedPhase } from '@munchkin/shared';
import { battleService, deckService, gameRedisService, gameService } from '@src/services';
import { gameSyncService } from './game.sync.service';
import logger from '@src/utils/logger';
import { gameDispatcher } from '../dispatchers/game.dispatcher';
import { gameActionService } from './game.action.service';

export class GameEngine {
    private redis = gameRedisService;
    private battleService = battleService;
    constructor() {
        gameActionService.on('REQUIRE_PHASE_CHANGE', async (data) => {
            const { gameId, userId, newPhase, card, extraCardsCount } = data;
            const game = await this.redis.getGame(gameId);
            if (!game) return;
            if (game.phase === GamePhase.VICTORY) {
                logger.warn(`[GameEngine] Phase change denied: Game ${gameId} is already in VICTORY phase.`);
                return;
            }
            // 1. ЛОГИКА ВОЗВРАТА (Завершение сброса карт)
            if (newPhase == null && game.phase == GamePhase.DROP_CARDS) {
                await this.processNextQueuedPhase(gameId);
                return;
            }

            // 2. ЛОГИКА ПОСТАНОВКИ В ОЧЕРЕДЬ
            if (game.phase === GamePhase.DROP_CARDS && newPhase !== GamePhase.DROP_CARDS) {
                await this.addToPhaseQueue(gameId, {
                    newPhase,
                    userId,
                    card: card as IDoorData,
                    timestamp: Date.now()
                });

                return;
            }

            // 3. НЕМЕДЛЕННОЕ ВЫПОЛНЕНИЕ
            await this.executePhaseChange(gameId, newPhase, userId, { card, extraCardsCount });
        });
    }

    private async executePhaseChange(gameId: string, phase: GamePhase, userId: string, extra: any = {}) {
        switch (phase) {
            case GamePhase.DROP_CARDS:
                await this.handleRequireDropCards(gameId, userId, extra.extraCardsCount);
                break;
            case GamePhase.BATTLE:
                await this.enterBattlePhase(gameId, extra.card as IDoorData);
                break;
            case GamePhase.LOOT:
                await this.enterLootPhase(gameId);
                break;
            case GamePhase.TURN:
                await this.redis.updateGame(gameId, { phase: GamePhase.TURN });
                await gameSyncService.broadcastGameState(gameId);
                break;
            case GamePhase.NEXT_TURN:
                this.nextTurn(gameId);
                break;
            case GamePhase.VICTORY:
                this.endGame(gameId);
                break;
            default:
                logger.warn(`[GameEngine] Unknown phase requested: ${phase}`);
        }
    }

    private async addToPhaseQueue(gameId: string, queuedPhase: IQueuedPhase) {
        const game = await this.redis.getGame(gameId);
        if (!game) return;

        const queue = game.phaseQueue || [];
        queue.push(queuedPhase);

        await this.redis.updateGame(gameId, { phaseQueue: queue });

        gameSyncService.sendNotification(
            gameId,
            `Действие "${queuedPhase.newPhase}" отложено до завершения сброса карт`,
            'info'
        );

        logger.info(`[GameEngine] Phase ${queuedPhase.newPhase} added to queue for game ${gameId}`);
    }

    private async processNextQueuedPhase(gameId: string) {
        const game = await this.redis.getGame(gameId);
        if (!game) return;

        const queue = game.phaseQueue || [];

        if (queue.length > 0) {
            // Извлекаем первую задачу из очереди
            const nextPhaseData = queue.shift()!;

            // Обновляем очередь в Redis (уже без первой задачи)
            await this.redis.updateGame(gameId, { phaseQueue: queue });

            logger.info(`[GameEngine] Resuming queued phase: ${nextPhaseData.newPhase}`);

            // Выполняем отложенную фазу
            await this.executePhaseChange(
                gameId,
                nextPhaseData.newPhase,
                nextPhaseData.userId,
                {
                    card: nextPhaseData.card,
                }
            );
        } else {
            await this.nextTurn(gameId);
        }
    }

    private async handleRequireDropCards(gameId: string, userId: string, count: number) {
        try {
            await this.redis.updateGame(gameId, {
                phase: GamePhase.DROP_CARDS,
            });

            await gameSyncService.notifyDropCards(gameId, userId, count);

            await gameSyncService.broadcastGameState(gameId);

            logger.info(`[GameEngine] Phase changed to DROP_CARD for user ${userId}.`);
        } catch (error) {
            logger.error(`[GameEngine] Error in handleRequireDropCards: ${error}`);
        }
    }


    public async startGame(gameId: string) {
        // 1. Переход в START
        const game = await this.redis.getGame(gameId);
        if (!game) return;

        await this.redis.updateGame(gameId, { status: GameStatus.IN_GAME });
        gameDispatcher.emitValidated(GameEventType.StateUpdated, gameId, {
            phase: 'START',
            currentPlayerId: '',
            turnNumber: 0
        });
        await gameSyncService.broadcastGameState(gameId);
        const syncPromises = game.participantsId.map(async (userId) => {
            await gameSyncService.syncPlayer(gameId, userId);
        });
        gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, { message: "Все игроки в сборе! Игра начинается...", type: 'success' });

        await Promise.all(syncPromises);
        gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, {
            message: "Раздача начальных сокровищ...",
            type: 'success'
        });

        await this.distributeInitialCards(gameId, game.participantsId);
        // 2. Через 3 секунды переходим к первому ходу
        setTimeout(async () => {
            try {
                await this.nextTurn(gameId);
            } catch (err) {
                logger.error(`[GameDispatcher] Error starting first turn: ${err}`);
            }
        }, 3000);
    }

    private async distributeInitialCards(gameId: string, participants: string[]) {
        const CARDS_PER_PLAYER = 4;
        const DELAY_MS = 200;

        for (let i = 0; i < CARDS_PER_PLAYER; i++) {
            for (const userId of participants) {
                const treasureCard = await deckService.drawTreasure(gameId);

                if (treasureCard) {
                    // Используем actionService для выдачи 
                    await gameActionService.giveCard(gameId, userId, treasureCard);
                    // Пауза 0.2 секунды для визуального эффекта
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }
        }

        logger.info(`[GameEngine] Initial treasures distributed for game ${gameId}`);
    }

    public async nextTurn(gameId: string) {
        logger.info(`[GameEngine] Next Turn`);

        const game = await this.redis.getGame(gameId);
        if (!game || !game.participantsId || game.participantsId.length === 0) {
            throw new Error("Невозможно передать ход: игроки не найдены");
        }

        const participants = game.participantsId;
        let nextPlayerId: string;
        let newTurnNumber = (game.turn || 0);

        if (!game.currentPlayerId) {
            nextPlayerId = participants[0] as string;
            newTurnNumber = 1;
        } else {
            const currentIndex = participants.indexOf(game.currentPlayerId);
            const nextIndex = (currentIndex + 1) % participants.length;
            nextPlayerId = participants[nextIndex] as string;
            newTurnNumber += 1;
        }

        // Вычисляем раунд (если вернулись к первому игроку)
        const isFirstPlayer = participants.indexOf(nextPlayerId) === 0;
        const newRound = isFirstPlayer && newTurnNumber > 1 ? (game.round || 1) + 1 : (game.round || 1);

        // Обновляем данные в Redis
        await this.redis.updateGame(gameId, {
            currentPlayerId: nextPlayerId,
            turn: newTurnNumber,
            round: newRound,
            phase: GamePhase.TURN,
            status: GameStatus.IN_GAME,
            activeDoor: null,
            phaseQueue: [],
            monsterCards: [],
            battleCards: [],
            previousPhase: undefined,
        });

        // Отправляем событие всем игрокам
        gameDispatcher.emitValidated(GameEventType.StateUpdated, gameId, {
            phase: GamePhase.TURN,
            currentPlayerId: nextPlayerId,
            turnNumber: newTurnNumber
        });

        gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, {
            message: `Ход игрока ${nextPlayerId}. Раунд ${newRound}`,
            type: 'info'
        });
        logger.info(`[GameEngine] turn ${nextPlayerId}`);

        gameSyncService.broadcastGameState(gameId);
    }

    public async handlePlayerDie(gameId: string, userId: string) {
        const game = await this.redis.getGame(gameId);
        if (!game) return;

        // 1. Уведомляем лог о выбывании игрока
        gameSyncService.sendNotification(
            gameId,
            `Время ожидания истекло. Игрок ${userId} выбывает!`,
            'danger'
        );

        // 2. Логика удаления из участников
        const remainParticipants = game.participantsId.filter(id => id !== userId);

        const updateData: any = {
            participantsId: remainParticipants
        };

        // 3. Если остался один — завершаем игру, иначе продолжаем
        if (remainParticipants.length < 2) {
            updateData.status = GameStatus.ENDED;
            gameSyncService.sendNotification(
                gameId,
                "Игра завершена: недостаточно игроков",
                'info'
            );
        } else {
            updateData.status = GameStatus.IN_GAME;
        }

        await this.redis.updateGame(gameId, updateData);

        // 4. Синхронизируем состояние у всех оставшихся
        await gameSyncService.broadcastGameState(gameId);
    }
    public async enterBattlePhase(gameId: string, monsterCard: IDoorData) {
        const game = await this.redis.getGame(gameId);
        if (!game) return;

        await this.redis.updateGame(gameId, {
            phase: GamePhase.BATTLE,
            activeDoor: monsterCard
        });

        await this.battleService.refreshBattlePower(gameId);

        gameSyncService.sendNotification(
            gameId,
            `Монстр "${monsterCard.name}" преграждает путь!`,
            'danger'
        );

        await gameSyncService.broadcastGameState(gameId);
    }

    /**
     * Переход в фазу Обыска (Loot)
     * Вызывается, если при открытии двери не было монстра, 
     * или после победы над монстром (согласно правилам)
     */
    public async enterLootPhase(gameId: string) {
        const game = await this.redis.getGame(gameId);
        if (!game) return;

        await this.redis.updateGame(gameId, {
            phase: GamePhase.LOOT
        });

        gameSyncService.sendNotification(
            gameId,
            `Фаза обыска: игрок ${game.currentPlayerId} забирает карту или ищет неприятности.`,
            'info'
        );
        await gameSyncService.broadcastGameState(gameId);

        logger.info(`[GameEngine] Game ${gameId} moved to LOOT phase`);
    }

    public async pauseGame(gameId: string, userId: string) {
        const game = await this.redis.getGame(gameId);
        if (game && game.status === GameStatus.IN_GAME) {
            await this.redis.updateGame(gameId, { status: GameStatus.PAUSED });

            gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, {
                message: `Игрок ${userId} покинул игру. Пауза 2 минуты.`,
                type: 'danger'
            });
            await gameSyncService.broadcastGameState(gameId);
            logger.info(`[GameDispatcher] Game ${gameId} paused by user ${userId}`);
        }
    }

    public async resumeGame(gameId: string, userId: string) {
        const game = await this.redis.getGame(gameId);
        if (game && game.status === GameStatus.PAUSED) {
            await this.redis.updateGame(gameId, { status: GameStatus.IN_GAME });

            await gameSyncService.broadcastGameState(gameId);
            gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, {
                message: `Игрок ${userId} вернулся! Продолжаем.`,
                type: 'info'
            });

            logger.info(`[GameDispatcher] Game ${gameId} resumed by user ${userId}`);
        }
    }

    public async getGameState(gameId: string) {
        const game = await this.redis.getGame(gameId);
        if (!game) throw new Error("Game not found");

        return {
            id: gameId,
            phase: game.phase as GamePhase,
            status: game.status as GameStatus,
            currentPlayerId: game.currentPlayerId || '',
            turnNumber: game.turn || 0,
            participantsId: game.participantsId || []
        };
    }


    public async endGame(gameId: string, manualWinnerId?: string) {
        logger.info(`[GameEngine] Ending game ${gameId}`);

        const game = await this.redis.getGame(gameId);
        if (!game) return;

        let winnerId = manualWinnerId;

        // 1. Если победитель не указан явно, ищем того, кто достиг 10 уровня
        if (!winnerId) {
            const playerStatsPromises = game.participantsId.map(pid => 
                this.redis.getPlayerStats(gameId, pid)
            );
            const allStats = await Promise.all(playerStatsPromises);

            const winnerStats = allStats.find(stats => stats && stats.level >= 10);
            if (winnerStats) {
                winnerId = winnerStats.id;
            }
        }

        const finalWinner = winnerId || game.currentPlayerId || "Unknown";

        try {
            await gameService.createResult(gameId, finalWinner);

            await this.redis.updateGame(gameId, { 
                status: GameStatus.ENDED,
                phase: GamePhase.VICTORY 
            });

            // 4. Логируем событие
            gameDispatcher.emitValidated(GameEventType.LogMessage, gameId, {
                message: `ИГРА ОКОНЧЕНА! Победитель: ${finalWinner}`,
                type: 'success'
            });

            // 5. Отправляем финальную синхронизацию через GameSyncService
            await gameSyncService.syncGameEnd(gameId);
            
            // 6. Дополнительно обновляем состояние у всех (чтобы закрылись UI элементы боя и т.д.)
            await gameSyncService.broadcastGameState(gameId);

            logger.info(`[GameEngine] Game ${gameId} successfully ended. Winner: ${finalWinner}`);

        } catch (error) {
            logger.error(`[GameEngine] Error during ending game ${gameId}: ${error}`);
        }
    }
}

export const gameEngine = new GameEngine();