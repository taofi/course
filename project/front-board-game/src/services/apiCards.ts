// src/services/apiCards.ts

import { api, handleApiError } from './apiService';
import type { ICardData, IDoorData } from "@munchkin/shared";

const BASE_URL = '/cards';

export const apiCards = {

  // --- ЗАГРУЗКА ИЗОБРАЖЕНИЙ ---

  // src/services/apiCards.ts

  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<{ imageUrl: string }>(
        `${BASE_URL}/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.imageUrl;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // --- МЕТОДЫ ДЛЯ ДВЕРЕЙ (DOORS) ---

  async getAllDoors(): Promise<IDoorData[]> {
    try {
      const response = await api.get<IDoorData[]>(`${BASE_URL}/doors`);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async getDoorById(id: string): Promise<IDoorData> {
    try {
      const response = await api.get<IDoorData>(`${BASE_URL}/doors/${id}`);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async addDoor(data: Partial<IDoorData>): Promise<IDoorData> {
    try {
      const response = await api.post<IDoorData>(`${BASE_URL}/doors`, data);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async updateDoor(id: string, data: Partial<IDoorData>): Promise<IDoorData> {
    try {
      const response = await api.put<IDoorData>(`${BASE_URL}/doors/${id}`, data);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async deleteDoor(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`${BASE_URL}/doors/${id}`);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  // --- МЕТОДЫ ДЛЯ СОКРОВИЩ (TREASURES) ---

  async getAllTreasures(): Promise<ICardData[]> {
    try {
      const response = await api.get<ICardData[]>(`${BASE_URL}/treasures`);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async getTreasureById(id: string): Promise<ICardData> {
    try {
      const response = await api.get<ICardData>(`${BASE_URL}/treasures/${id}`);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async addTreasure(data: Partial<ICardData>): Promise<ICardData> {
    try {
      const response = await api.post<ICardData>(`${BASE_URL}/treasures`, data);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async updateTreasure(id: string, data: Partial<ICardData>): Promise<ICardData> {
    try {
      const response = await api.put<ICardData>(`${BASE_URL}/treasures/${id}`, data);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  },

  async deleteTreasure(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`${BASE_URL}/treasures/${id}`);
      return response.data;
    } catch (error) { throw handleApiError(error); }
  }
};