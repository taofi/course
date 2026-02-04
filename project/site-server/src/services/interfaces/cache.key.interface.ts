// interfaces/cache.key.interface.ts

/**
 * Интерфейс, который должны реализовать сущности (или их DTO) 
 * для использования в GenericCacheService.
 */
export interface ICacheableEntity {
    // Уникальные поля, по которым можно искать сущность (например, _id, login, email)
    [key: string]: any; 
}