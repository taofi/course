// src/contexts/useAuth.ts (или src/hooks/useAuth.ts)

import { createContext, useContext } from 'react';
import type { 
  User, 
  RegisterRequest, 
  LoginRequest, 
  AuthSuccessResponse, 
  VerificationRequest, 
  RegisterSuccessResponse,
  // --- НОВЫЕ ИМПОРТЫ ---
  ResendVerificationRequest, 
  ResendVerificationSuccessResponse // Предполагаем, что эти типы существуют
} from '../types/authTypes';

/** Состояние аутентификации */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Действия провайдера */
export interface AuthActions {
  login: (data: LoginRequest) => Promise<AuthSuccessResponse>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterSuccessResponse>;
  fetchCurrentUser: () => Promise<User | null>;
  verifyEmail: (data: VerificationRequest) => Promise<AuthSuccessResponse>;
  setUser: (user: User) => void;
  resendVerificationCode: (data: ResendVerificationRequest) => Promise<ResendVerificationSuccessResponse>;
}

/** Объединенный тип контекста */
export interface AuthContextType extends AuthState, AuthActions {}

// Инициализация контекста (экспортируем для AuthProvider)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Хук для удобного доступа ---

/**
 * Хук для доступа к контексту аутентификации.
 * @returns {AuthContextType} Состояние и методы аутентификации.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};