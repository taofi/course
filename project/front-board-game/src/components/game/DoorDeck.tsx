import { DraggableDeckCard } from './DraggableDeckCard';
import { GamePhase, PlayerActionType, PHASE_PERMISSIONS } from '@munchkin/shared';

interface DoorDeckProps {
  doorsCount: number;
  treasureCount: number;
  currentPhase: GamePhase;
  isMyTurn: boolean;
}

export function DoorDeck({ doorsCount, treasureCount, currentPhase, isMyTurn }: DoorDeckProps) {
  // Проверка разрешений на основе PHASE_PERMISSIONS
  const canOpenDoor = isMyTurn && PHASE_PERMISSIONS[currentPhase]?.some(
    p => p.action === PlayerActionType.OpenDoor
  );

  const canTakeTreasure = isMyTurn && PHASE_PERMISSIONS[currentPhase]?.some(
    p => p.action === PlayerActionType.TakeCard
  );

  return (
    <div className="flex flex-col justify-center gap-8 shrink-0 py-4">
      
      {/* Секция Дверей */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative group">
          {/* Эффект стопки (тень под картой) */}
          <div className="absolute inset-0 translate-x-1 translate-y-1 bg-primary/10 rounded-lg -z-10 border border-primary/20" />
          
          {/* Компонент перетаскивания */}
          <DraggableDeckCard type="door" disabled={!canOpenDoor || doorsCount <= 0} />

          {/* Счётчик карт Дверей */}
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-background z-20">
            {doorsCount}
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Двери</span>
      </div>

      {/* Секция Сокровищ */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative group">
          <div className="absolute inset-0 translate-x-1 translate-y-1 bg-amber-500/10 rounded-lg -z-10 border border-amber-500/20" />
          
          <DraggableDeckCard type="treasure" disabled={!canTakeTreasure || treasureCount <= 0} />

          <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-background z-20">
            {treasureCount}
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Сокровища</span>
      </div>

    </div>
  );
}