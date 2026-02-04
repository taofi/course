import { HelpCircle } from "lucide-react";
import { CardType, DoorType, CardRace, CardClass } from '@munchkin/shared';

// Мапа путей к изображениям
export const CARD_ICON_PATHS: Record<string, string> = {
  [CardType.Armor]: '/icons/armor_icon.png',
  [CardType.OneHand]: '/icons/sword_icon.png',
  [CardType.TwoHands]: '/icons/swords_icon.png',
  [CardType.Headgear]: '/icons/head_icon.png',
  [CardType.Boots]: '/icons/boots_icon.png',
  [CardType.DisposableItem]: '/icons/potion_icon.png',
  [CardType.Other]: '/icons/book_icon.png',
  [DoorType.Monster]: '/icons/monster_icon.png',
  [DoorType.Race]: '/icons/race_icon.png',
  [CardClass.Warrior]: '/icons/warrior_icon.png',
  [CardClass.Wizard]: '/icons/wizard_icon.png',
  [CardClass.Cleric]: '/icons/cleric_icon.png',
  [CardClass.Thief]: '/icons/bandit_icon.png',
  [CardRace.Human]: '/icons/human_icon.png',
  [CardRace.Elf]: '/icons/elf_icon.png',
  [CardRace.Halfling]: '/icons/halfling_icon.png',
  [CardRace.Dwarf]: '/icons/dwarf_icon.png',
};

// Словарь русских названий
const CARD_LABELS: Record<string, string> = {
  [CardType.Armor]: 'Броня',
  [CardType.OneHand]: 'Одноручное',
  [CardType.TwoHands]: 'Двуручное',
  [CardType.Headgear]: 'Головняк',
  [CardType.Boots]: 'Обувка',
  [CardType.DisposableItem]: 'Разовый шмот',
  [CardType.Other]: 'Другое',
  [DoorType.Monster]: 'Монстр',
  [DoorType.Race]: 'Раса',
  [CardClass.Warrior]: 'Воин',
  [CardClass.Wizard]: 'Волшебник',
  [CardClass.Cleric]: 'Клирик',
  [CardClass.Thief]: 'Вор',
  [CardRace.Human]: 'Человек',
  [CardRace.Elf]: 'Эльф',
  [CardRace.Halfling]: 'Хафлинг',
  [CardRace.Dwarf]: 'Дварф',
};

export const getCardIcon = (value: string | undefined) => {
  if (!value) return null;

  const imageSrc = CARD_ICON_PATHS[value];
  const label = CARD_LABELS[value] || value; // Если перевода нет, покажет ключ

  return (
    <span 
      title={label} 
      className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-secondary/30 p-0.5 shadow-sm border border-border/50 transition-colors hover:bg-secondary/50"
    >
      {imageSrc ? (
        <img 
          src={imageSrc} 
          alt={label} 
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </span>
  );
};