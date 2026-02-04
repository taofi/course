import { RedisService } from "./redis.service";
import { IPlayerStats, PlayerActivity } from "@munchkin/shared";
import logger from "@src/utils/logger";
import { IServerGame } from "@src/game/models/GameModel";


export class GameRedisService {
  private redisService: RedisService;
  private readonly GAME_PREFIX = "game:session:";
  private readonly PLAYER_PREFIX = "game:stats:";
  private readonly DEFAULT_TTL = 10800;

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  /**
   * Сохраняет полный объект игры в Redis
   */
  async saveGame(game: IServerGame): Promise<void> {
    const key = `${this.GAME_PREFIX}${game.id}`;
    const data = JSON.stringify(game);
    await this.redisService.set(key, data, this.DEFAULT_TTL);
  }

  /**
   * Получает объект игры по ID
   */
  async getGame(gameId: string): Promise<IServerGame | null> {
    const key = `${this.GAME_PREFIX}${gameId}`;
    const data = await this.redisService.get(key);

    if (!data) return null;
    return JSON.parse(data) as IServerGame;
  }

  /**
   * Обновляет конкретные поля игры (например, статус или текущий ход)
   */
  async updateGame(gameId: string, updates: Partial<IServerGame>): Promise<IServerGame | null> {

    const game = await this.getGame(gameId);
    if (!game) return null;

    const updatedGame = { ...game, ...updates };
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  /**
   * Сохраняет характеристики игрока для конкретной игры
   */
  async savePlayerStats(gameId: string, playerId: string, stats: IPlayerStats): Promise<void> {
    const key = `${this.PLAYER_PREFIX}${gameId}:${playerId}`;
    const data = JSON.stringify(stats);
    await this.redisService.set(key, data, this.DEFAULT_TTL);
  }

  /**
   * Получает характеристики игрока
   */
  async getPlayerStats(gameId: string, playerId: string): Promise<IPlayerStats | null> {
    const key = `${this.PLAYER_PREFIX}${gameId}:${playerId}`;
    const data = await this.redisService.get(key);

    if (!data) return null;
    return JSON.parse(data) as IPlayerStats;
  }

  /**
   * Удаляет все данные игры (при закрытии лобби)
   */
  async deleteGame(gameId: string, participants: string[]): Promise<void> {
    try {
      // Удаляем саму игру
      await this.redisService.del(`${this.GAME_PREFIX}${gameId}`);

      // Удаляем статы всех игроков
      const playerDeletePromises = participants.map(playerId =>
        this.redisService.del(`${this.PLAYER_PREFIX}${gameId}:${playerId}`)
      );

      await Promise.all(playerDeletePromises);
      logger.info(`Redis: Game ${gameId} and player stats deleted.`);
    } catch (err: any) {
      logger.error(`Error deleting game ${gameId}: ${err.message}`);
    }
  }

  /**
   * Продлевает время жизни сессии (вызывать при каждом активном действии)
   */
  async refreshSession(gameId: string): Promise<void> {
    await this.redisService.expire(`${this.GAME_PREFIX}${gameId}`, this.DEFAULT_TTL);
  }

  /**
   * Добавляет игрока в список онлайн участников конкретной игры
   */
  async setPlayerOnline(gameId: string, userId: string): Promise<void> {
    // 1. Управляем быстрым списком (Set) для подсчета количества
    const onlineKey = `game:online:${gameId}`;
    await this.redisService.sAdd(onlineKey, userId);

    // 2. Обновляем статус внутри объекта статистики
    const stats = await this.getPlayerStats(gameId, userId);
    if (stats) {
      stats.activity = PlayerActivity.ONLINE;
      await this.savePlayerStats(gameId, userId, stats);
    }
  }

  /**
   * Удаляет игрока из онлайн и обновляет его статус в статах
   */
  async setPlayerOffline(gameId: string, userId: string): Promise<void> {
    // 1. Убираем из быстрого списка (Set)
    const onlineKey = `game:online:${gameId}`;
    await this.redisService.sRem(onlineKey, userId);

    const stats = await this.getPlayerStats(gameId, userId);
    if (stats) {
      stats.activity = PlayerActivity.OFFLINE;
      await this.savePlayerStats(gameId, userId, stats);
    }
  }

  /**
   * Получает количество игроков онлайн
   */
  async getOnlineCount(gameId: string): Promise<number> {
    const key = `game:online:${gameId}`;
    return await this.redisService.sCard(key);
  }

  /**
   * Проверяет, онлайн ли конкретный игрок
   */
  async isPlayerOnline(gameId: string, userId: string): Promise<boolean> {
    const key = `game:online:${gameId}`;
    return await this.redisService.sIsMember(key, userId);
  }

  async setPlayerActivity(gameId: string, userId: string, activity: PlayerActivity): Promise<void> {
    const stats = await this.getPlayerStats(gameId, userId);
    if (stats) {
      stats.activity = activity; // Добавьте это поле в интерфейс IPlayerStats
      await this.savePlayerStats(gameId, userId, stats);
    }
  }

  async updateGameAtomic(gameId: string, updateFn: (game: IServerGame) => IServerGame): Promise<IServerGame> {
    const key = `${this.GAME_PREFIX}${gameId}`;
    let retries = 5; // Количество попыток при конфликте

    while (retries > 0) {
      try {
        // 1. "Наблюдаем" за ключом
        await (this.redisService as any).redis.watch(key);

        // 2. Получаем текущие данные
        const data = await this.redisService.get(key);
        if (!data) {
          await (this.redisService as any).redis.unwatch();
          throw new Error("Game not found");
        }

        const game = JSON.parse(data) as IServerGame;

        // 3. Применяем изменения локально
        const updatedGame = updateFn(game);

        // 4. Пытаемся сохранить через транзакцию
        const result = await (this.redisService as any).redis
          .multi()
          .set(key, JSON.stringify(updatedGame), 'EX', this.DEFAULT_TTL)
          .exec();

        // Если result === null, значит ключ изменился другим процессом
        if (result !== null) {
          return updatedGame;
        }

        retries--;
        // Небольшая задержка перед повтором (backoff)
        await new Promise(res => setTimeout(res, 50));
      } catch (error) {
        await (this.redisService as any).redis.unwatch();
        throw error;
      }
    }

    throw new Error("Failed to update game due to high concurrency");
  }
}