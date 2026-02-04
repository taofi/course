import type { ICardData, IDoorData } from "@munchkin/shared";

export function MiniSlot({ data, label, size, isIdentity, icon }: { 
    data?: ICardData | IDoorData, 
    label: string, 
    size: 'sm' | 'md', 
    isIdentity?: boolean,
    icon: string 
  }) {
    const hasItem = !!data;
    const sizeClasses = size === 'sm' ? 'w-15' : 'w-15'; 
    
    return (
      <div className={`
        ${sizeClasses} aspect-[5/7] rounded-md border flex items-center justify-center relative transition-all duration-300 overflow-hidden
        ${hasItem 
          ? 'border-primary/40 bg-card shadow-lg' 
          : 'border-dashed border-muted-foreground/20 bg-muted/5'
        }
        ${isIdentity && !hasItem ? 'bg-primary/[0.03] border-primary/20' : ''}
      `}>
        
        {hasItem ? (
          /* Если предмет надет — можно оставить свечение или добавить мини-карточку */
          <div className="relative z-10 w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
              <div className="w-full h-full bg-primary/10 animate-pulse" />
              <div className="absolute inset-0 border-[1px] border-primary/20 rounded-md" />
          </div>
        ) : (
          /* Если слот пуст — показываем темную иконку-заглушку */
          <div className="flex flex-col items-center justify-center h-full w-full opacity-20 transition-opacity">
            <img 
              src={icon} 
              alt={label}
              /* grayscale и brightness-0 делают иконку полностью черной */
              className="w-1/2 h-1/2 object-contain grayscale brightness-0" 
            />
          </div>
        )}
      </div>
    );
}