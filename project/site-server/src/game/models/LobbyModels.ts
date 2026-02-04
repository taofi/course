// src/models/LobbyModels.ts

import { LobbyType, LobbyStatus } from "@munchkin/shared";


export interface UserParticipant {
  id: string; // user_101
  isReady: boolean;
}

export interface Lobby {
  id: string; // UUID_12345
  name:string;
  creatorId: string;
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

