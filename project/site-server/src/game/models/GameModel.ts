import { ICardData, IGameData, IDoorData, GamePhase } from "@munchkin/shared";

export interface IServerGame extends IGameData {
    password?: string;
    watchers: string[];   
    previousPhase?: GamePhase;
}