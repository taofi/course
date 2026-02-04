// src/api/apiResult.ts
import type { IGameResult } from '@/types/gameResultTypes';
import { api, handleApiError } from './apiService'; 

const BASE_URL = "/results"; 

export const resultApi = {
    /**
     * Получить детальный результат конкретной игры.
     * @param gameId UUID или MongoDB ID игры
     */
    getResultById: async (gameId: string): Promise<IGameResult> => {
        try {
            const response = await api.get<IGameResult>(`${BASE_URL}/${gameId}`);
            return response.data;
        } catch (error) {
            handleApiError(error); 
        }
    },

    /**
     * Получить историю всех игр конкретного пользователя.
     * @param userId ID пользователя
     */
    getResultsByPlayer: async (userId: string): Promise<IGameResult[]> => {
        try {
            const response = await api.get<IGameResult[]>(`${BASE_URL}/player/${userId}`);
            return response.data;
        } catch (error) {
            handleApiError(error); 
        }
    },

    /**
     * Получить список всех результатов игр (общая история).
     */
    getAllResults: async (): Promise<IGameResult[]> => {
        try {
            const response = await api.get<IGameResult[]>(`${BASE_URL}`);
            return response.data;
        } catch (error) {
            handleApiError(error); 
        }
    }
};