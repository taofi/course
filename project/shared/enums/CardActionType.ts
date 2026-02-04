export enum CardActionType {
    LevelUP = "LevelUP",
    DropArmor = "DropArmor",
    DropHeadgear = "DropHeadgear",
    DropBoots = "DropBoots",
    DropOneHand = "DropOneHand",
    DropHands = "DropHands",
    LevelDown = "LevelDown",
    GiveBonus = "GiveBonus",
}

export type DynamicValue = "card_bonus" | "card_level";

export interface CardActionParams {
  [CardActionType.LevelUP]: { count: number };
  [CardActionType.LevelDown]: { count: number };
  [CardActionType.GiveBonus]: { 
    amount: number | DynamicValue; 
    duration: "permanent" | "temporary" 
  };
  [CardActionType.DropArmor]: { };
  [CardActionType.DropHeadgear]: { };
  [CardActionType.DropBoots]: { };
  [CardActionType.DropOneHand]: { };
  [CardActionType.DropHands]: { };
}

export type ICardAction = {
    [K in CardActionType]: {
        name: K;
        params: CardActionParams[K];
    };
}[CardActionType];