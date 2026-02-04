// src/types/LobbyTypes.ts

export interface CreateLobbyRequest {
    type: LobbyType;
    name: string,
    maxPlayers: number;
    isPrivate: boolean;
    password?: string;
}

/**
 * Ответы обычно будут содержать полные данные лобби.
 */
export type LobbyResponse = LobbyDetails; 

/**
 * Тип для ответа на запрос о списке лобби.
 */
export type LobbiesListResponse = LobbyDetails[];

/**
 * Тип для данных при присоединении к приватному лобби.
 */
export interface JoinLobbyRequest {
    password?: string;
}

/**
 * Тип для смены статуса готовности.
 */
export interface ReadyStatusRequest {
    isReady: boolean;
}

/**
 * Ответ после смены статуса готовности.
 */
export interface ReadyStatusResponse {
    message: string;
    isReady: boolean;
    lobbyAllReady: boolean;
}






// src/models/LobbyModels.ts

export type LobbyType = 'Casual' | 'Ranked' | 'Custom';
export enum LobbyStatus {
    WAITING = 'WAITING',
    IN_GAME = 'IN_GAME',
    ENDED = 'ENDED',
    CLOSED='CLOSED'
};

export interface UserParticipant {
    id: string;
    isReady: boolean;
    username?: string; 
}

export interface Lobby {
  id: string; // UUID_12345
  creatorId: string;
  name:string;
  type: LobbyType;
  isPrivate: boolean;
  password?: string; // Опционально, если isPrivate=true
  maxPlayers: number;
  status: LobbyStatus;
  // Участники будут извлекаться из Redis Set/Hash
}

export interface LobbyDetails extends Lobby {
  participants: UserParticipant[];
}

// Поля, которые хранятся в Redis Hash
export interface LobbyHashData {
    id: string;
    creatorId: string;
    type: LobbyType;
    isPrivate: string;
    password?: string;
    maxPlayers: string; 
    status: LobbyStatus;
    [key: string]: string | undefined; 
}


// --- Интерфейсы для данных, получаемых с сервера (Входящие) ---


// 2. Успешное присоединение (ответ на 'join_lobby')
export interface JoinSuccessData {
    lobbyId: string;
    message: string;
}

// 3. Входящее чат-сообщение (транслируется сервером)
export interface IncomingChatMessageData {
    senderId: string; // ID пользователя, отправившего сообщение (добавлено бэкендом)
    lobbyId: string;
    data: { text: string }; // Полезная нагрузка, которую отправил клиент
    timestamp: string;
}

// 4. Уведомление об отключении игрока (транслируется сервером)
export interface PlayerDisconnectedData {
    userId: string;
    message: string;
}
