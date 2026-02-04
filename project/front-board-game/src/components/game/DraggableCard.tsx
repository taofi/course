import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GameCard } from '../GameCard';
import { DoorType, type ICardData, type IDoorData } from '@munchkin/shared';
import { mapCardToSlotType } from '@/utils/mapCardToSlotType';
import { SlotType, type CardDragData } from '@/types/gameDnd';

interface DraggableCardProps {
  card: ICardData | IDoorData; // Добавили поддержку IDoorData
  setSelectedCard: (card: ICardData | IDoorData) => void;
}

export function DraggableCard({ card, setSelectedCard }: DraggableCardProps) {
    // ЛОГИКА ОПРЕДЕЛЕНИЯ ТИПА СЛОТА
    let type: SlotType;
    let hands: number | undefined;

    // Проверяем, является ли карта дверью (Race или Class)
    if ('type' in card && (card.type === DoorType.Race)) {
        type = card.type === DoorType.Race ? SlotType.RACE : SlotType.CLASS;
        hands = undefined;
    } else {
        // Для обычных сокровищ используем существующую мапу
        const mapped = mapCardToSlotType((card as ICardData).type);
        type = mapped.type;
        hands = mapped.hands;
    }
  
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: card._id,
      data: {
        id: card._id,
        type, // Теперь здесь будет корректный RACE или CLASS для дверей
        hands,
        card,
      } as CardDragData
    });
  
    const style = {
      transform: CSS.Translate.toString(transform),
      zIndex: isDragging ? 1000 : undefined,
    };
  
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative w-28 group/card origin-bottom ${isDragging ? 'opacity-30' : 'opacity-100'}`}
      >
        <div 
          {...attributes} 
          {...listeners}
          className={`
            relative shadow-xl rounded-lg ring-1 ring-black/5 
            cursor-grab active:cursor-grabbing
            transition-all duration-300 ease-out
            ${!isDragging ? 'hover:scale-125 hover:-translate-y-10' : ''}
          `}
        >
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation(); // Чтобы кнопка "инфо" не активировала drag
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); 
              setSelectedCard(card);
            }}
            className="absolute -top-2 -right-2 z-60 bg-primary text-white rounded-full p-1 shadow-xl opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100 hover:bg-primary/90"
          >
             <span className="sr-only">Info</span>
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          
          <GameCard data={card} isCompact />
        </div>
      </div>
    );
}