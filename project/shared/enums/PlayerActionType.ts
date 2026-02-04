import type { PlayerEquipSlot } from "../interfaces/IGame";

export enum PlayerActionType {
    UseCard = "UseCard",
    UseOtherCard = "UseOtherCard",
    Equip = "Equip",
    UnEquip = "UnEquip",
    OpenDoor = "OpenDoor",
    TakeCard = "TakeCard",
    DropCard = "DropCard",
    Run = "Run",
    TakeTreasure = "TakeTreasure",
    AskHelp = "AskHelp",
    Help = "Help",
    EndTurn = "EndTurn",
    BuffPlayer = "BuffPlayer",
    BuffMonster = "BuffMonster",
    Fight = "Fight",

}

export interface PlayerActionParams {
    [PlayerActionType.UseCard]: { cardId: string; targetPlayerId?: string };
    [PlayerActionType.UseOtherCard]: { cardId: string; };
    [PlayerActionType.Equip]: { cardId: string };
    [PlayerActionType.OpenDoor]: {};
    [PlayerActionType.TakeCard]: {};
    [PlayerActionType.DropCard]: { cardId: string };
    [PlayerActionType.Run]: {};
    [PlayerActionType.TakeTreasure]: { count?: number };
    [PlayerActionType.AskHelp]: { targetPlayerId: string };
    [PlayerActionType.Help]: { targetPlayerId: string };
    [PlayerActionType.EndTurn]: {};
    [PlayerActionType.BuffMonster]: {cardId: string;};
    [PlayerActionType.BuffPlayer]: {cardId: string;};
    [PlayerActionType.Fight]: {};
    [PlayerActionType.UnEquip]: {slot:PlayerEquipSlot };


}

export type IPlayerAction = {
    [K in PlayerActionType]: {
        name: K;
        params: PlayerActionParams[K];
    };
}[PlayerActionType];