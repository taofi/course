import { RedisService } from "./redis.service";
import { GameRedisService } from "./game.redis.service";
import { IPlayerStats, ICardData, IDoorData } from "@munchkin/shared";
import { IServerGame } from "@src/game/models/GameModel";
import { LobbyNotFoundError } from "@src/utils/CustomErrors";

export interface IFullGameSnapshot {
    game: IServerGame;
    playersStats: Record<string, IPlayerStats>;
    decks: {
        doors: IDoorData[];
        treasures: ICardData[];
        discardDoors: IDoorData[];
        discardTreasures: ICardData[];
    };
}

export class GameStatisticsService {
    private readonly GAME_KEY_PATTERN = "game:session:*";

    constructor(
        private redisService: RedisService,
        private gameRedisService: GameRedisService
    ) {}

    /**
     * Сборка полного объекта игры (Snapshot)
     */
    async getFullGameSnapshot(gameId: string): Promise<IFullGameSnapshot> {
        const game = await this.gameRedisService.getGame(gameId);
        if (!game) throw new LobbyNotFoundError(`Игра ${gameId} не найдена в Redis`);

        // Запускаем параллельный сбор данных для оптимизации скорости
        const [playersStats, decks] = await Promise.all([
            this.getGamePlayersStats(gameId, game.participantsId),
            this.getGameDecks(gameId)
        ]);

        return {
            game,
            playersStats,
            decks
        };
    }

    /**
     * Получение всех активных игр
     */
    async getAllActiveGames(): Promise<IServerGame[]> {
        // Получаем все ключи сессий
        const keys = await (this.redisService as any).redis.keys(this.GAME_KEY_PATTERN);
        if (!keys || keys.length === 0) return [];

        const gameIds = keys.map((key: string) => key.split(":").pop() || "");
        
        const games = await Promise.all(
            gameIds.map((id: string) => this.gameRedisService.getGame(id))
        );

        return games.filter((g): g is IServerGame => g !== null);
    }

    /**
     * Получение статистики всех участников (IPlayerStats)
     */
    async getGamePlayersStats(gameId: string, playerIds: string[]): Promise<Record<string, IPlayerStats>> {
        const statsMap: Record<string, IPlayerStats> = {};
        
        const statsArray = await Promise.all(
            playerIds.map(userId => this.gameRedisService.getPlayerStats(gameId, userId))
        );

        playerIds.forEach((userId, index) => {
            const stats = statsArray[index];
            if (stats) statsMap[userId] = stats;
        });

        return statsMap;
    }

    /**
     * Получение всех колод игры (Doors, Treasures + Discards)
     */
    async getGameDecks(gameId: string) {
        // Формируем ключи так же, как в DeckService
        const deckKeys = {
            doors: `game:${gameId}:deck:doors`,
            treasures: `game:${gameId}:deck:treasures`,
            discardDoors: `game:${gameId}:discard:doors`,
            discardTreasures: `game:${gameId}:discard:treasures`
        };

        const [doors, treasures, dDoors, dTreasures] = await Promise.all([
            this.getListContent<IDoorData>(deckKeys.doors),
            this.getListContent<ICardData>(deckKeys.treasures),
            this.getListContent<IDoorData>(deckKeys.discardDoors),
            this.getListContent<ICardData>(deckKeys.discardTreasures)
        ]);

        return {
            doors,
            treasures,
            discardDoors: dDoors,
            discardTreasures: dTreasures
        };
    }

    /**
     * Вспомогательный метод для вычитки списков Redis (LRANGE)
     */
    private async getListContent<T>(key: string): Promise<T[]> {
        try {
            // Получаем все элементы списка от 0 до конца (-1)
            const rawData = await (this.redisService as any).redis.lrange(key, 0, -1);
            if (!rawData) return [];
            
            return rawData.map((item: string) => JSON.parse(item) as T);
        } catch (err) {
            return [];
        }
    }
}