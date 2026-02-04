import { CardType } from '@munchkin/shared';
import { SlotType } from '@/types/gameDnd';

export const mapCardToSlotType = (type: CardType): { type: SlotType; hands?: 1 | 2 } => {
  switch (type) {
    case CardType.Armor: return { type: SlotType.ARMOR };
    case CardType.Headgear: return { type: SlotType.HEAD };
    case CardType.Boots: return { type: SlotType.BOOTS };
    case CardType.OneHand: return { type: SlotType.WEAPON, hands: 1 };
    case CardType.TwoHands: return { type: SlotType.WEAPON, hands: 2 };
    default: return { type: SlotType.OTHER };
  }
};