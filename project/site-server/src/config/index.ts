// src/config/index.ts

import * as dotenv from 'dotenv';
import configJson from './config.json'; 

// Загрузка переменных из .env файла
dotenv.config();

// Определяем текущее окружение (по умолчанию 'development')
const ENV = process.env.NODE_ENV || 'development';
const currentConfig = (configJson as any)[ENV];

// -----------------------------------------------------
// I. Конфигурация Приложения (из .env)
// -----------------------------------------------------

export const AppConfig = {
    // Основные настройки
    NODE_ENV: ENV,
    PORT: parseInt(process.env.PORT || '3000', 10),

    // Настройки Базы Данных
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/courseDb',

    // Настройки Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    // Настройки JWT
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
    JWT_EXPIRES: process.env.JWT_EXPIRES || '1h',
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
    ADMIN_LOGIN: process.env.ADMIN_LOGIN || 'admin',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

};

// -----------------------------------------------------
// II. Конфигурация Сервисов (из config.json)
// -----------------------------------------------------

export const ServiceConfig = {
    // Настройки Кэша Redis (берутся из JSON, зависят от ENV)
    REDIS_CACHE_TTL: currentConfig?.redis?.cacheTtlSeconds || 3600,
};

// -----------------------------------------------------
// III. Полный Объект Конфигурации (для удобства)
// -----------------------------------------------------

export const Config = {
    ...AppConfig,
    ...ServiceConfig
};

// Экспортируем все вместе для удобства
export default Config;