import redis from "@src/config/redis";
import logger from "@src/utils/logger";

export class RedisService {
 
  // Внутри класса RedisService

// Установка TTL (Time-To-Live) для ключа
async expire(key: string, seconds: number): Promise<void> {
  try {
      // Используем команду EXPIRE
      const result = await this.redis.expire(key, seconds); 
      logger.debug(`Redis expire: ${key} set to ${seconds} seconds. Result: ${result}`);
  } catch (err: any) {
      logger.error(`Redis expire error for key ${key}: ${err.message}`);
      throw err;
  }
}



async sAdd(key: string, member: string): Promise<void> { 
  try {
      // Используем команду SADD. Она возвращает количество добавленных элементов.
      await this.redis.sadd(key, member); 
      logger.debug(`Redis sAdd: ${key}, member: ${member}`);
  } catch (err: any) {
      logger.error(`Redis sAdd error: ${err.message}`);
      throw err;
  }
}

/**
   * Возвращает количество элементов в множестве (SET)
   */
async sCard(key: string): Promise<number> {
  try {
    const count = await this.redis.scard(key);
    logger.debug(`Redis sCard: ${key}, count: ${count}`);
    return count;
  } catch (err: any) {
    logger.error(`Redis sCard error for key ${key}: ${err.message}`);
    throw err;
  }
}

/**
 * Проверяет, является ли пользователь участником множества (SET)
 */
async sIsMember(key: string, member: string): Promise<boolean> {
  try {
    const result = await this.redis.sismember(key, member);
    logger.debug(`Redis sIsMember: ${key}, member: ${member}, result: ${result === 1}`);
    return result === 1;
  } catch (err: any) {
    logger.error(`Redis sIsMember error for key ${key}: ${err.message}`);
    throw err;
  }
}

async sMembers(key: string): Promise<string[]> {
  try {
      const members = await this.redis.smembers(key);
      logger.debug(`Redis sMembers: ${key}`);
      return members; 
  } catch (err: any) {
      logger.error(`Redis sMembers error: ${err.message}`);
      throw err;
  }
}
  private redis = redis;

  // Устанавливаем ключ с TTL (в секундах)
  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      if (ttlSeconds) {
        await this.redis.set(key, value, "EX", ttlSeconds);
      } else {
        await this.redis.set(key, value);
      }
      logger.debug(`Redis set: ${key}`);
    } catch (err: any) {
      logger.error(`Redis set error: ${err.message}`);
      throw err;
    }
  }

  // Получаем значение по ключу
  async get(key: string) {
    try {
      const value = await this.redis.get(key);
      logger.debug(`Redis get: ${key}`);
      return value;
    } catch (err: any) {
      logger.error(`Redis get error: ${err.message}`);
      throw err;
    }
  }

  // Удаляем ключ
  async del(keys: string | string[]) {
    try {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      
      if (keysArray.length === 0) return;
  
      await this.redis.del(...keysArray); 
      
      logger.debug(`Redis del: ${keysArray.join(', ')}`);
    } catch (err: any) {
      logger.error(`Redis del error: ${err.message}`);
      throw err;
    }
  }

  // Проверка существования ключа
  async exists(key: string) {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (err: any) {
      logger.error(`Redis exists error: ${err.message}`);
      throw err;
    }
  }

  // Внутри класса RedisService

  // Устанавливает поле в HASH-объекте (для создания/обновления лобби)
  async hSet(key: string, field: string, value: string) {
    try {
      await this.redis.hset(key, field, value);
      logger.debug(`Redis hSet: ${key}, field: ${field}`);
    } catch (err: any) {
      logger.error(`Redis hSet error: ${err.message}`);
      throw err;
    }
  }

  // Получает все поля HASH-объекта (для получения всего лобби)
  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      const data = await this.redis.hgetall(key);
      logger.debug(`Redis hGetAll: ${key}`);
      return data;
    } catch (err: any) {
      logger.error(`Redis hGetAll error: ${err.message}`);
      throw err;
    }
  }

  // Удаляет одно или несколько полей из HASH-объекта (например, для очистки флагов)
  async hDel(key: string, fields: string | string[]) {
    try {
      const f = Array.isArray(fields) ? fields : [fields];
      await this.redis.hdel(key, ...f);
      logger.debug(`Redis hDel: ${key}, fields: ${f.join(', ')}`);
    } catch (err: any) {
      logger.error(`Redis hDel error: ${err.message}`);
      throw err;
    }
  }

  async sRem(key: string, member: string): Promise<void> {
    try {
        await this.redis.srem(key, member); 
        logger.debug(`Redis sRem: ${key}, member: ${member}`);
    } catch (err: any) {
        logger.error(`Redis sRem error: ${err.message}`);
        throw err;
    }
}
}
