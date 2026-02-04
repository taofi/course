// src/services/apiLobby.ts

import { api, handleApiError } from "./apiService"; // Используем настроенный Axios инстанс и обработчик ошибок
import type {
    CreateLobbyRequest,
    LobbiesListResponse,
    LobbyResponse,
    JoinLobbyRequest,
    ReadyStatusRequest,
    ReadyStatusResponse
} from "../types/lobbyTypes"; 


const BASE_URL = "/lobbies"; 

export const apiLobby = {
    /**
     * Создает новое лобби.
     * @param data Данные для создания лобби.
     * @returns Детали созданного лобби.
     */
    create: async (data: CreateLobbyRequest): Promise<LobbyResponse> => {
        try {
            const response = await api.post<LobbyResponse>(BASE_URL, data);
            return response.data;
        } catch (error) {
            handleApiError(error); // Перебрасывает структурированную ошибку
        }
    },

    /**
     * Получает список всех активных лобби.
     * @returns Массив деталей лобби.
     */
    getAll: async (): Promise<LobbiesListResponse> => {
        try {
            const response = await api.get<LobbiesListResponse>(BASE_URL);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * Получает детали конкретного лобби.
     * @param lobbyId ID лобби.
     * @returns Детали лобби.
     */
    getById: async (lobbyId: string): Promise<LobbyResponse> => {
        try {
            const response = await api.get<LobbyResponse>(`${BASE_URL}/${lobbyId}`);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * Присоединяется к лобби.
     * @param lobbyId ID лобби.
     * @param data Пароль, если лобби приватное.
     * @returns Детали лобби после присоединения.
     */
    join: async (lobbyId: string, data: JoinLobbyRequest): Promise<LobbyResponse> => {
        try {
            const response = await api.post<LobbyResponse>(`${BASE_URL}/${lobbyId}/join`, data);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * Изменяет статус готовности игрока.
     * @param lobbyId ID лобби.
     * @param data Статус готовности (true/false).
     * @returns Ответ со статусом готовности лобби.
     */
    setReadyStatus: async (lobbyId: string, data: ReadyStatusRequest): Promise<ReadyStatusResponse> => {
        try {
            const response = await api.put<ReadyStatusResponse>(`${BASE_URL}/${lobbyId}/ready`, data);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * Удаляет лобби (доступно только создателю).
     * @param lobbyId ID лобби.
     * @returns Сообщение об успехе.
     */
    delete: async (lobbyId: string): Promise<{ message: string }> => {
        try {
            const response = await api.delete<{ message: string }>(`${BASE_URL}/${lobbyId}`);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    kickPlayer: async (lobbyId: string, userId: string): Promise<{ message: string }> => {
        try {
            const response = await api.delete<{ message: string }>(`${BASE_URL}/${lobbyId}/participants/${userId}`);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },
};