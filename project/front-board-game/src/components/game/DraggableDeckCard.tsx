import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CardBack } from './CardBack';

interface DraggableDeckCardProps {
  type: 'door' | 'treasure';
  disabled?: boolean;
}

export function DraggableDeckCard({ type, disabled }: DraggableDeckCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `deck-${type}-draggable`,
    disabled: disabled,
    data: {
      isDeck: true,
      deckType: type,
    }
  });

  // Применяем трансформацию для перемещения самого элемента
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-24 aspect-[5/7] touch-none ${
        isDragging ? 'opacity-50 z-50' : 'opacity-100'
      }`}
    >
      <div 
        {...listeners} 
        {...attributes}
        className={`
          w-full h-full 
          rounded-lg shadow-xl
          cursor-grab active:cursor-grabbing
          
          /* Отключаем transition при перетаскивании, чтобы не было задержки */
          ${!isDragging ? 'transition-all duration-200 hover:-translate-y-2' : ''}
          
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[0.3]' : ''}
        `}
      >
        <CardBack 
          type={type} 
          className={`border-2 rounded-lg h-full w-full ${
            type === 'door' ? 'border-primary/30' : 'border-amber-500/30'
          }`} 
        />
      </div>
    </div>
  );
}