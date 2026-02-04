import type { ICardData, IDoorData } from "@munchkin/shared";

// Новое перечисление для крупных игровых зон
export enum GameZone {
  BATTLEFIELD = 'battlefield', // Игровое поле (для монстров и одноразовых карт)
  EQUIPMENT = 'equipment',     // Слот вещей игрока (панель снаряжения)
  DISCARD = 'discard',         // Стопка сброса
}

export enum SlotType {
  HEAD = 'head',
  ARMOR = 'armor',
  BOOTS = 'boots',
  RACE = 'race',
  CLASS = 'class',
  WEAPON = 'weapon', 
  OTHER = 'other'
}

export interface CardDragData {
  card: ICardData | IDoorData; // Сами данные карты
  id: string;
  type: SlotType; // К какому типу относится карта (например, Броня)
  hands?: 1 | 2;
}