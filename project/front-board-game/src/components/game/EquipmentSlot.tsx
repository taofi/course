import { type ICardData, type IDoorData, type PlayerEquipSlot } from '@munchkin/shared'
import { GameCard } from '../GameCard';
import { getCardIcon } from '../CardIcon';
import { useDroppable } from '@dnd-kit/core';
import { SlotType, type CardDragData } from '@/types/gameDnd';
import { X } from 'lucide-react';

interface EquipmentSlotProps {
  id: string;
  data?: ICardData | IDoorData;
  icon?: string;
  iconValue?: string;
  label: string;
  isIdentity?: boolean;
  acceptType: SlotType;
  isMyTurn?: boolean;
  onRemove?: (slot: PlayerEquipSlot) => void;
}

// Используем строковые значения, которые соответствуют PlayerEquipSlot
const slotMapping: Record<string, string> = {
  [SlotType.HEAD]: 'headGear',
  [SlotType.ARMOR]: 'armor',
  [SlotType.BOOTS]: 'boots',
  [SlotType.RACE]: 'race',
  [SlotType.CLASS]: 'class',
};

export function EquipmentSlot({ 
  id, data, icon, iconValue, label, isIdentity, acceptType, 
  onRemove, isMyTurn 
}: EquipmentSlotProps) {
  const hasItem = !!data;

  const { setNodeRef, isOver, active } = useDroppable({
    id: id,
    data: {
      zone: 'EQUIPMENT',
      acceptType: acceptType,
    }
  });

  const activeData = active?.data.current as CardDragData | undefined;
  const isTwoHandedWeapon = activeData?.type === SlotType.WEAPON && activeData?.hands === 2;
  const isWeaponSlot = acceptType === SlotType.WEAPON;
  const isCompatible = activeData?.type === acceptType || (isTwoHandedWeapon && isWeaponSlot);

  const isHighlight = activeData?.type === acceptType;
  const isPotentialTarget = isHighlight;
  const isError = isOver && !isCompatible;

  // Внутренняя функция преобразования и вызова
  const handleRemoveClick = () => {
    if (!onRemove) return;

    let targetSlot: string | undefined;

    if (acceptType === SlotType.WEAPON) {
      // Определяем конкретную руку по ID слота (slot-hand-left или slot-hand-right)
      targetSlot = id.includes('left') ? 'oneHand' : 'secondHand';
    } else {
      targetSlot = slotMapping[acceptType];
    }
    
    if (targetSlot) {
      onRemove(targetSlot as PlayerEquipSlot);
    }
  };

  return (
    <div className="relative group flex flex-col items-center gap-2">
      <div
        ref={setNodeRef}
        className={`
          w-28 aspect-[5/7] rounded-xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden
          ${hasItem ? 'border-primary/40 shadow-xl bg-card' : 'border-dashed border-muted-foreground/20 bg-muted/5'}
          ${isIdentity && !hasItem ? 'bg-primary/[0.03] border-primary/20' : ''}
          ${isPotentialTarget && !isHighlight ? 'animate-pulse border-primary/40 bg-primary/5' : ''}
          ${isHighlight ? 'border-primary scale-105 shadow-[0_0_20px_rgba(var(--primary),0.4)] bg-primary/10' : ''}
          ${isError ? 'border-destructive bg-destructive/10 cursor-no-drop scale-95' : ''}
        `}
      >
        {hasItem ? (
          <div className="relative w-full h-full group/card animate-in fade-in zoom-in duration-300">
            <GameCard data={data} isCompact />
            
            {/* Кнопка снятия: только в ход игрока */}
            {isMyTurn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveClick();
                }}
                className="absolute top-1 right-1 z-20 p-1.5 
                           bg-destructive/90 text-destructive-foreground rounded-lg
                           opacity-0 translate-y-[-4px] group-hover/card:opacity-100 group-hover/card:translate-y-0
                           transition-all duration-200 hover:bg-destructive shadow-lg backdrop-blur-sm"
              >
                <X size={16} strokeWidth={3} />
              </button>
            )}
            
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ) : (
          <div className={`
            flex flex-col items-center justify-center gap-3 p-4 h-full w-full transition-opacity
            ${isPotentialTarget ? 'opacity-80' : 'opacity-20 group-hover:opacity-40'}
          `}>
            {icon ? (
              <img src={icon} alt={label} className={`w-14 h-14 object-contain grayscale brightness-0 transition-transform ${isHighlight ? 'scale-110' : ''}`} />
            ) : iconValue ? (
              <div className={`transition-transform ${isHighlight ? 'scale-[2.5]' : 'scale-[2]'}`}>
                {getCardIcon(iconValue)}
              </div>
            ) : null}

            <span className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight transition-colors ${isHighlight ? 'text-primary' : ''}`}>
              {label}
            </span>
          </div>
        )}
      </div>

      {isHighlight && (
        <div className="absolute -bottom-1 w-1/2 h-1 bg-primary rounded-full blur-sm animate-pulse" />
      )}
    </div>
  );
}