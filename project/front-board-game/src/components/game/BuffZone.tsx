import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { CardType, type ICardData } from '@munchkin/shared';
import { GameCard } from '@/components/GameCard';

interface BuffZoneProps {
  id: string;
  label: string;
  colorClass: string;
  cards: ICardData[];
  target: 'monster' | 'player';
  activeCardType?: string; // тип карты, которую сейчас тащат
}

export const BuffZone = ({ id, label, colorClass, cards, target, activeCardType }: BuffZoneProps) => {
  // Зона активна только если тащат одноразовую шмотку
  const canDrop = activeCardType === CardType.DisposableItem;

  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !canDrop, // dnd-kit игнорирует зону, если тип не подходит
    data: { 
      zone: 'BATTLEFIELD',
      target: target 
    },
  });

  return (
    <div className="flex flex-col gap-2" ref={setNodeRef}>
      <span className={`text-[9px] font-black uppercase tracking-widest ${colorClass} ml-2 opacity-70`}>
        {label}
      </span>
      <div className={`flex gap-3 transition-all ${isOver ? 'scale-105' : ''}`}>
        {/* Сначала рендерим уже лежащие в бою карты */}
        {cards?.map((card) => (
          <div key={card._id} className="w-24 h-36 shadow-lg">
            <GameCard data={card} isCompact />
          </div>
        ))}
        
        {/* Оставшиеся пустые слоты (всего 4) */}
        {Array.from({ length: Math.max(0, 4 - (cards?.length || 0)) }).map((_, i) => (
          <div 
            key={i}
            className={`w-24 h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all
              ${isOver ? 'bg-primary/20 border-primary shadow-inner' : 'bg-primary/5 border-primary/10'}
              ${canDrop && !isOver ? 'border-primary/30 animate-pulse' : ''}
            `}
          >
            <Plus className={`w-6 h-6 ${isOver ? 'text-primary' : 'text-primary/10'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};