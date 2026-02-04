import type { ICardData } from "./interfaces/ICard";
import type { IGameData, IPlayerStats } from "./interfaces/IGame";

// types/gameEvents.ts
export enum GameEventType {
    StatsChanged = "StatsChanged",
    InventoryUpdated = "InventoryUpdated",
    StateUpdated = "StateUpdated",
    LogMessage = "LogMessage",
    ErrorOccurred = "ErrorOccurred",
    UpdatePlayer = "UpdatePlayer",
    UpdateGame = "UpdateGame",
    DropCards = "DropCards",
    End = "End",
    RunResult = "RunResult",

}

export interface GameEventParams {
    [GameEventType.StatsChanged]: { userId: string; level: number; strength: number };
    [GameEventType.InventoryUpdated]: { userId: string; cards: ICardData[]; cardsCount: number };
    [GameEventType.StateUpdated]: { phase: string; currentPlayerId: string; turnNumber: number };
    [GameEventType.LogMessage]: { message: string; type: 'info' | 'danger' | 'success' };
    [GameEventType.ErrorOccurred]: { message: string; userId: string; code:string };
    [GameEventType.UpdatePlayer]: { player:IPlayerStats };
    [GameEventType.UpdateGame]: { game:IGameData };
    [GameEventType.DropCards]: { count:number };
    [GameEventType.End]: { };
    [GameEventType.RunResult]: {dice: number, result: boolean};

}


export type IServerEvent = {
    [K in GameEventType]: {
        type: K;                            // Название типа события
        payload: GameEventParams[K];         // Данные, которые соответствуют ЭТОМУ типу
        metadata?: {                        // Дополнительные данные 
            timestamp: number;
            isPrivate?: boolean;
        };
    };
}[GameEventType];