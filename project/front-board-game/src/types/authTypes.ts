// src/types/authTypes.ts

// --- Общие Типы ---
export interface ApiErrorResponse {
  error: {
    message: string;
    statusCode: number;
  };
}

export interface User {
  _id: string;
  name: string;
  login: string;
  email: string;
  password?: string; 
  registrationDate: string;
  avatar: string;
  role: string;
  __v: number;
}

// --- Запросы ---

export interface RegisterRequest {
  name: string;
  login: string;
  email: string;
  password: string; // Чистый пароль до хеширования
}

export interface LoginRequest {
  login: string;
  password: string; // Чистый пароль до хеширования
}

export interface RefreshRequest {
  refreshToken: string;
}

// --- Ответы ---

export interface AuthSuccessResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshSuccessResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutSuccessResponse {
  message: string;
}



export interface VerificationRequest {
  login: string;
  code: string;
}


export interface RegisteredUserSubset {
  id: string;
  name: string;
  login: string;
  email: string;
}

export interface RegisterSuccessResponse {
  user: RegisteredUserSubset;
  message: string;
}

export type ResendVerificationRequest = {
  login: string; 
};

export type ResendVerificationSuccessResponse = {
  message: string;
};

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}