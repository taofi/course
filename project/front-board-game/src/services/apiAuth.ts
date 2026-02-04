import type { AxiosResponse, } from 'axios';
import type {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  AuthSuccessResponse,
  RefreshSuccessResponse,
  LogoutSuccessResponse,
  User,
  VerificationRequest,
  RegisterSuccessResponse,
  ResendVerificationSuccessResponse,
  ResendVerificationRequest,
  ResetPasswordRequest,
} from '../types/authTypes'; // Путь к вашим типам
import { api, handleApiError } from './apiService';

// --- Сервисные Функции ---

/**
 * Регистрация нового пользователя.
 * @param data Данные регистрации (имя, логин, email, чистый пароль).
 * @returns Promise<AuthSuccessResponse> Ответ с данными пользователя и токенами.
 */
export async function register(data: RegisterRequest): Promise<RegisterSuccessResponse> {
  try {

    const requestBody = {
      ...data,
    };

    const response: AxiosResponse<RegisterSuccessResponse> = await api.post('/auth/register', requestBody);


    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Аутентификация пользователя.
 * @param data Данные входа (логин, чистый пароль).
 * @returns Promise<AuthSuccessResponse> Ответ с данными пользователя и токенами.
 */
export async function login(data: LoginRequest): Promise<AuthSuccessResponse> {
  try {
    const response: AxiosResponse<AuthSuccessResponse> = await api.post('/auth/login', data);

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Обновление токенов с помощью refreshToken.
 * @param data Объект с refreshToken.
 * @returns Promise<RefreshSuccessResponse> Ответ с новыми токенами.
 */
export async function refresh(data: RefreshRequest): Promise<RefreshSuccessResponse> {
  try {
    const response: AxiosResponse<RefreshSuccessResponse> = await api.post('/auth/refresh', data);

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Выход пользователя из системы.
 * @returns Promise<LogoutSuccessResponse> Ответ с сообщением об успехе.
 */
export async function logout(): Promise<LogoutSuccessResponse> {
  try {
    const response: AxiosResponse<LogoutSuccessResponse> = await api.post('/auth/logout');

    // Удаляем токены после успешного выхода
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Получение данных текущего пользователя. Требует токен в заголовке.
 * @returns Promise<User> Данные пользователя.
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response: AxiosResponse<{ user: User }> = await api.get('/user');
    return response.data.user;
  } catch (error) {
    handleApiError(error);
  }
}


export async function verifyEmail(data: VerificationRequest): Promise<AuthSuccessResponse> {
  try {
    const response: AxiosResponse<AuthSuccessResponse> = await api.post('/auth/verify', data); // Новая точка входа

    // Сохраняем токены после успешной верификации
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}


export async function resendVerificationCode(data: ResendVerificationRequest): Promise<ResendVerificationSuccessResponse> {
  try {
    const response: AxiosResponse<ResendVerificationSuccessResponse> = await api.post('/auth/resend', data);

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  try {
    const response: AxiosResponse<{ message: string }> = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function confirmResetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  try {
    const response: AxiosResponse<{ message: string }> = await api.post('/auth/confirm-reset', data);
    
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}