import { GameRedisService } from './game.redis.service';
import { PlayerService } from './player.service';
import { 
    ICardData, 
    IDoorData, 
    IGameData, 
    IPlayerStats 
} from '@munchkin/shared';
import { ValidationError } from '@src/utils/CustomErrors';
import logger from '@src/utils/logger';

export class BattleService {
    constructor(
        private gameRedisService: GameRedisService,
        private playerService: PlayerService
    ) {}

    /**
     * Добавление карты в зону боя (для монстра или игрока)
     * monsterCards теперь принимает ICardData[]
     */
    async addCardToBattle(
        gameId: string, 
        card: ICardData, 
        target: 'monster' | 'player'
    ): Promise<void> {
        await this.gameRedisService.updateGameAtomic(gameId, (game) => {
            if (target === 'monster') {
                if (game.monsterCards.length >= 4) {
                    throw new ValidationError("Максимум 4 карты усиления для монстра");
                }
                // Теперь monsterCards принимает ICardData, приведение типов не требуется
                game.monsterCards.push(card);
            } else {
                if (game.battleCards.length >= 4) {
                    throw new ValidationError("Максимум 4 карты усиления для игрока");
                }
                game.battleCards.push(card);
            }
            return game;
        });

        // Синхронизируем расчет силы после добавления
        await this.refreshBattlePower(gameId);
    }

    /**
     * Пересчет сил на основе текущего состояния Redis
     */
    async refreshBattlePower(gameId: string): Promise<void> {
        const game = await this.gameRedisService.getGame(gameId);
        if (!game) return;

        const playerStats = await this.gameRedisService.getPlayerStats(gameId, game.currentPlayerId);
        
        await this.gameRedisService.updateGameAtomic(gameId, (currentGame) => {
            // 1. Расчет силы Монстра
            // Базовая сила монстра (уровень карты двери)
            let mPower = 0;
            if (currentGame.activeDoor) {
                mPower += (currentGame.activeDoor as IDoorData).level || 0;
            }
            
            // Суммируем все бонусы из monsterCards (теперь это ICardData[])
            const monsterBonuses = currentGame.monsterCards.reduce(
                (sum, card) => sum + (card.bonus || 0), 0
            );
            
            currentGame.monsterPower = mPower + monsterBonuses;

            // 2. Расчет силы Игрока
            if (playerStats) {
                // Постоянная сила (уровень + экипировка из PlayerService)
                const baseStrength = this.playerService.calculatePlayerStrength(playerStats);
                
                // Временные бонусы от карт на столе боя (battleCards)
                const battleBonuses = currentGame.battleCards.reduce(
                    (sum, card) => sum + (card.bonus || 0), 0
                );
                
                currentGame.playerPower = baseStrength + battleBonuses;
            }

            return currentGame;
        });
    }

    /**
     * Проверка на победу (Игрок побеждает, если сила > силы Монстра)
     */
    async checkVictory(gameId: string): Promise<{ isVictory: boolean; pPower: number; mPower: number }> {
        // Гарантируем актуальность данных перед проверкой
        await this.refreshBattlePower(gameId);
        
        const game = await this.gameRedisService.getGame(gameId);
        if (!game) throw new ValidationError("Игра не найдена");

        return {
            isVictory: game.playerPower > game.monsterPower,
            pPower: game.playerPower,
            mPower: game.monsterPower
        };
    }

    /**
     * Очистка стола после боя
     */
    async clearBattlefield(gameId: string): Promise<void> {
        await this.gameRedisService.updateGameAtomic(gameId, (game) => {
            game.monsterCards = [];
            game.battleCards = [];
            game.monsterPower = 0;
            game.playerPower = 0;
            game.activeDoor = null;
            return game;
        });
    }

    /**
     * Установка монстра, с которым идет бой
     */
    async setBattleTarget(gameId: string, monster: IDoorData): Promise<void> {
        await this.gameRedisService.updateGameAtomic(gameId, (game) => {
            game.activeDoor = monster;
            return game;
        });
        await this.refreshBattlePower(gameId);
    }
}