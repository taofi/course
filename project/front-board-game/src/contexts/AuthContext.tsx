// src/contexts/AuthContext.tsx (ИСПРАВЛЕНО)

import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authService from '../services/apiAuth'; 
import type { 
  User, 
  RegisterRequest, 
  LoginRequest, 
  AuthSuccessResponse, 
  ApiErrorResponse, 
  VerificationRequest, 
  RegisterSuccessResponse,
  // --- НОВЫЕ ИМПОРТЫ ---
  ResendVerificationRequest,
  ResendVerificationSuccessResponse
} from '../types/authTypes';

// Импортируем сам контекст и типы из отдельного файла
import { AuthContext, type AuthState, type AuthContextType } from './useAuth'; 

// --- Провайдер ---

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // ... (fetchCurrentUser и useEffect остаются без изменений)
  /**
   * Получает свежую информацию о пользователе с сервера.
   */
  const fetchCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const userData = await authService.getCurrentUser();
      setState(prevState => ({
        ...prevState,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      }));
      return userData;
    } catch (error) {
      console.error("Ошибка при получении данных пользователя:", (error as ApiErrorResponse).error?.message || error);
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  }, []);

  // Эффект при монтировании: Проверяем наличие токена и загружаем пользователя
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      fetchCurrentUser();
    } else {
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  }, [fetchCurrentUser]);


  // --- Методы Аутентификации ---
  
  const handleLogin = async (data: LoginRequest): Promise<AuthSuccessResponse> => {
    const result = await authService.login(data);
    await fetchCurrentUser(); 
    return result;
  };

  const handleRegister = async (data: RegisterRequest): Promise<RegisterSuccessResponse> => { 
    const result = await authService.register(data); 
    return result;
  };

  const handleVerifyEmail = async (data: VerificationRequest): Promise<AuthSuccessResponse> => {
    const result = await authService.verifyEmail(data);
    
    await fetchCurrentUser();
    
    return result;
  };
  
  // --- ДОБАВЛЕННЫЙ МЕТОД ДЛЯ ПОВТОРНОЙ ОТПРАВКИ ---
  const handleResendVerificationCode = async (data: ResendVerificationRequest): Promise<ResendVerificationSuccessResponse> => {
    const result = await authService.resendVerificationCode(data); 
    return result;
  };

  const handleLogout = async (): Promise<void> => {
    try {
      // Отправка запроса на сервер
      await authService.logout();
    } catch (error) {
      console.warn("Выход выполнен локально, но произошла ошибка на сервере:", error);
    }
    // Локальная очистка
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };


  const handleSetUser = (user: User) => {
    setState(prevState => ({
      ...prevState,
      user: user,
      // Убедимся, что если есть юзер, то мы авторизованы
      isAuthenticated: true 
    }));
  };
  // Объединяем состояние и действия
  const value: AuthContextType = {
    ...state,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    verifyEmail: handleVerifyEmail,
    resendVerificationCode: handleResendVerificationCode, 
    fetchCurrentUser: fetchCurrentUser,
    setUser: handleSetUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Пока идет проверка токена, можно показать спиннер */}
      {state.isLoading ? <div>Загрузка пользователя...</div> : children}
    </AuthContext.Provider>
  );
};