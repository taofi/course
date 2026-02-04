import type { ICardData, IDoorData } from './ICard';
import { GamePhase, GameStatus, PlayerActivity, type LobbyType } from '../enums';

export interface IPlayerStats {
    id: string; 
    level: number;
    boots?: ICardData | null;
    armor?: ICardData | null;
    headGear?: ICardData | null;
    oneHand?: ICardData | null;
    secondHand?: ICardData | null;
    race?: IDoorData | null;
    agility: number;
    tempraryBonus: ICardData[];
    permanentBonus: ICardData[];
    cards: (ICardData)[]; 
    cardsCount:number;
    activity: PlayerActivity;
    power?: number;
}
export type PlayerEquipSlot = 'boots' | 'armor' | 'headGear' | 'oneHand' | 'secondHand';


export interface IGameData {
    id: string;
    phase: GamePhase;
    status: GameStatus;
    type: LobbyType;
    turn: number; 
    participantsId: string[];
    currentPlayerId: string;
    round: number;
    doorsCount: number;
    treasureCount: number;
    doorsLeftCount: number;
    treasureLeftCount: number;
    time: Date;
    monsterCards: ICardData[]; 
    monsterPower: number;
    battleCards: ICardData[]; 
    activeDoor: IDoorData | null;
    phaseQueue: IQueuedPhase[];
    playerPower: number;
}

export interface IQueuedPhase {
    newPhase: GamePhase;    
    userId: string;        
    card?: IDoorData | ICardData; 
    timestamp: number;     
  }

  export interface IFullGameSnapshot {
    game: IGameData;
    playersStats: Record<string, IPlayerStats>;
    decks: {
        doors: IDoorData[];
        treasures: ICardData[];
        discardDoors: IDoorData[];
        discardTreasures: ICardData[];
    };
}