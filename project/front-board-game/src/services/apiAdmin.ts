// src/api/apiAdmin.ts
import { api, handleApiError } from './apiService';
import type { User } from '@/types/authTypes';
import type { IPlayerStats, IFullGameSnapshot } from '@munchkin/shared';

const BASE_URL = "/admin";

export const adminApi = {
    /**
     * Пользователи (User Management) - работа с MongoDB
     */
    users: {
        getAll: async (): Promise<User[]> => {
            try {
                const response = await api.get<User[]>(`${BASE_URL}/users`);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        },

        getById: async (id: string): Promise<User> => {
            try {
                const response = await api.get<User>(`${BASE_URL}/users/${id}`);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        },

        update: async (id: string, data: Partial<User>): Promise<User> => {
            try {
                const response = await api.put<User>(`${BASE_URL}/users/${id}`, data);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        },

        delete: async (id: string): Promise<{ message: string }> => {
            try {
                const response = await api.delete(`${BASE_URL}/users/${id}`);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        }
    },

    /**
     * Игровые сессии (Active Games) - работа с Redis через GameStatisticsService
     */
    games: {
        /**
         * Получить список всех активных игр, происходящих в данный момент.
         */
        getAllActive: async (): Promise<IFullGameSnapshot[]> => {
            try {
                const response = await api.get<IFullGameSnapshot[]>(`${BASE_URL}/games`);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        },

        /**
         * Получить полный "снимок" игры: состояние, статы всех игроков и карты в колодах.
         */
        getSnapshot: async (gameId: string): Promise<IFullGameSnapshot> => {
            try {
                const response = await api.get<IFullGameSnapshot>(`${BASE_URL}/games/${gameId}`);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        },

        /**
         * Получить только состояние колод конкретной игры.
         */
        getDecks: async (gameId: string): Promise<IFullGameSnapshot['decks']> => {
            try {
                const response = await api.get<IFullGameSnapshot['decks']>(`${BASE_URL}/games/${gameId}/decks`);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        },

        /**
         * Получить статы игроков (уровни, шмотки) конкретной сессии.
         */
        getPlayersStats: async (gameId: string): Promise<Record<string, IPlayerStats>> => {
            try {
                const response = await api.get<Record<string, IPlayerStats>>(`${BASE_URL}/games/${gameId}/players`);
                return response.data;
            } catch (error) {
                handleApiError(error);
            }
        }
    }
};