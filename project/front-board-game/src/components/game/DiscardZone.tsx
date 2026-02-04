import { useDroppable } from '@dnd-kit/core';

// Вспомогательный компонент для зоны сброса
export const DiscardZone = ({ isActive, doorsCount, treasuresCount }: { 
    isActive: boolean; 
    doorsCount: number; 
    treasuresCount: number; 
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'discard-zone',
      data: { zone: 'DISCARD' },
    });
  
    return (
      <div
        ref={setNodeRef}
        className={`
          relative w-24 aspect-[5/7] rounded-xl border-2 border-dashed 
          flex flex-col items-center justify-center transition-all duration-300
          ${isOver ? 'bg-destructive/20 border-destructive scale-105 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-muted/5 border-muted-foreground/20'}
          ${!isActive ? 'opacity-20 grayscale cursor-not-allowed' : 'cursor-pointer hover:bg-muted/10'}
        `}
      >
        <div className="text-xl mb-1 opacity-50">🗑️</div>
        <span className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 text-center px-1">
          Сброс
        </span>
        
        {/* Маленькие индикаторы активности колод в зоне сброса */}
        <div className="absolute -bottom-2 flex gap-1">
          <div className="px-1.5 py-0.5 rounded-full bg-background border text-[7px] font-bold">
            D: {doorsCount}
          </div>
          <div className="px-1.5 py-0.5 rounded-full bg-background border text-[7px] font-bold">
            T: {treasuresCount}
          </div>
        </div>
  
        {isOver && isActive && (
          <div className="absolute inset-0 bg-destructive/10 animate-pulse rounded-xl" />
        )}
      </div>
    );
  };