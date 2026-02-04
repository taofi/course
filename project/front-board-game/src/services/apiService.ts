// src/services/authService.ts

import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type  {
  RefreshSuccessResponse,
  ApiErrorResponse,
} from '../types/authTypes'; // Путь к вашим типам

// Получаем базовый URL из .env файла
// В CRA/Vite это обычно process.env.REACT_APP_API_BASE_URL или import.meta.env.VITE_API_BASE_URL
// Здесь используем общую форму с учетом вашего примера
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/';
export const AVATAR_BASE_URL: string = import.meta.env. AVATAR_API_BASE_URL || 'http://localhost:3000';

export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  interface FailedQueueItem {
    resolve: (value: string | PromiseLike<string>) => void; // Resolve возвращает новый токен (string)
    reject: (reason?: ApiErrorResponse | Error) => void;     // Reject принимает ошибку
  }
  
  let isRefreshing = false;
  let failedQueue: FailedQueueItem[] = [];
  /**
   * Добавляет запрос в очередь, пока идет обновление токена.
   * @param error Ошибка, вызвавшая перехватчик. (Тип unknown для строгости)
   */
  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        // Когда вызываем reject, передаем ошибку, которую получим
        prom.reject(error as (ApiErrorResponse | Error)); // Приводим к известному нам типу ошибки
      } else if (token) {
        // Когда вызываем resolve, передаем новый токен
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };
/**
 * Перехватчик ответов для обработки ошибок 401 (истекший токен).
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config!;

    // Если ошибка 401 И это не запрос на логин/регистрацию/рефреш
    if (error.response?.status === 401 && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/register' && originalRequest.url !== '/auth/refresh') {
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Если токена нет, просто выбрасываем ошибку для выхода из системы
      if (!refreshToken) {
         // Очищаем токены, если 401 пришел без refresh
         localStorage.removeItem('accessToken');
         localStorage.removeItem('refreshToken');
         // Выбрасываем ошибку, чтобы провайдер мог обновить состояние
         return Promise.reject(error.response.data);
      }

      // 1. Предотвращаем множественный вызов refresh
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        // 2. Вызываем обновление токена
        const response = await api.post<RefreshSuccessResponse>('/auth/refresh', { refreshToken });
        const newAccessToken = response.data.accessToken;
        
        // 3. Сохраняем новые токены
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken); // Обновляем и refresh
        
        // 4. Обрабатываем очередь запросов
        processQueue(null, newAccessToken);

        // 5. Повторяем изначальный запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // 6. Если обновление токена не удалось (refresh тоже истек), очищаем все и выбрасываем ошибку.
        processQueue(refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // throw new Error("Сессия истекла. Пожалуйста, войдите снова."); // Можем выбросить кастомную ошибку
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Для всех остальных ошибок (400, 500 и т.д.) просто выбрасываем ошибку
    return Promise.reject(error.response?.data || error);
  }
);



/**
 * Перехватчик запросов для добавления токена аутентификации.
 * Предполагается, что вы сохраняете accessToken в localStorage.
 */
api.interceptors.request.use(
  (config) => {
    // В реальном приложении лучше использовать более надежное хранилище
    const accessToken: string | null = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Обрабатывает ошибки Axios и приводит их к общему типу ApiErrorResponse,
 * выбрасывая ошибку для дальнейшей обработки.
 * @param error Ошибка Axios
 */
export function handleApiError(error: unknown): never {
  console.log(error);

  // 1. ГЛАВНОЕ ИСПРАВЛЕНИЕ: Проверяем, не является ли ошибка уже структурированным JSON-объектом.
  // Это происходит, когда перехватчик отклоняет промис с error.response.data.
  if (
      typeof error === 'object' && error !== null &&
      'error' in error &&
      typeof (error).error === 'object' &&
      'message' in (error).error &&
      'statusCode' in (error).error
  ) {
      // Ошибка уже в нужном формате ApiErrorResponse. Выбрасываем ее.
      throw error as ApiErrorResponse;
  }

  // 2. Проверяем, является ли ошибка исходным объектом Axios (например, для сетевых ошибок)
  if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>; 

      // 3. СЕТЕВАЯ ОШИБКА (response === undefined: таймаут, нет сети)
      if (!axiosError.response) {
          throw {
              error: {
                  message: 'Ошибка сети. Проверьте подключение или попробуйте позже.',
                  statusCode: 500, 
              },
          } as ApiErrorResponse;
      }

      // 4. ОШИБКА С СЕРВЕРА С НЕОЖИДАННОЙ СТРУКТУРОЙ (Резервный путь)
      // Если ответ есть, но не прошел проверку в п.1 (что маловероятно при вашей гарантии)
      throw {
          error: {
              // Используем сообщение Axios как запасной вариант
              message: axiosError.message, 
              // Используем фактический статус-код, полученный от сервера
              statusCode: axiosError.response.status, 
          },
      } as ApiErrorResponse;
  }

  // 5. НЕИЗВЕСТНЫЕ ОШИБКИ (не Axios, не структурированный объект)
  let message = 'Неизвестная ошибка';
  if (error instanceof Error) {
      message = error.message;
  }

  throw {
      error: {
          message: message,
          statusCode: 500,
      },
  } as ApiErrorResponse;
}