import type { GameAccessResponse, GameSessionResponse } from '@/types/gameTypes';
import { api, handleApiError } from './apiService'; 

const BASE_URL = "/games"; 


export const gameApi = {
    /**
     * Запуск игры из лобби.
     * Используется создателем лобби.
     */
    startGame: async (lobbyId: string): Promise<GameSessionResponse> => {
        try {
            const response = await api.post<GameSessionResponse>(`${BASE_URL}/start`, {
                lobbyId
            });
            return response.data;
        } catch (error) {
            handleApiError(error); 
        }
    },

    /**
     * Проверка доступа к игре и получение пароля для WebSocket.
     * Используется при входе на страницу игры или после перезагрузки страницы (F5).
     */
    checkAccess: async (gameId: string): Promise<GameAccessResponse> => {
        try {
            const response = await api.get<GameAccessResponse>(`${BASE_URL}/${gameId}/check-access`);
            return response.data;
        } catch (error) {
            handleApiError(error); 
        }
    }
};