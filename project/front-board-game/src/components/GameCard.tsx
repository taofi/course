import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ICardData, IDoorData } from '@munchkin/shared'; 
import { API_BASE_URL } from '@/services/apiService';
import { getCardIcon } from './CardIcon';

const CLASS_LABELS: Record<string, string> = {
  Warrior: 'Воин',
  Wizard: 'Маг',
  Cleric: 'Клирик',
  Thief: 'Вор',
};

interface GameCardProps {
  data: ICardData | IDoorData;
  isCompact?: boolean; 
  variant?: 'default' | 'icon';
  className?: string;
  onClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  data, 
  isCompact = false, 
  variant = 'default', 
  className, 
  onClick 
}) => {
  const currentImgSrc = data.imageUrl 
    ? `${API_BASE_URL}/${data.imageUrl}` 
    : `${API_BASE_URL}/public/card/default.png`;

  const isDoor = 'level' in data || 'treasure' in data;

  const handleInternalClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  // Вспомогательная функция для управления размерами
  const getResponsiveText = (compactClass: string, largeClass: string) => 
    isCompact ? compactClass : `${compactClass} ${largeClass}`;

  if (variant === 'icon') {
    return (
      <div 
        onClick={handleInternalClick}
        className="group relative w-full h-full cursor-zoom-in overflow-hidden rounded-md border border-muted-foreground/30 shadow-md transition-all hover:ring-2 hover:ring-primary active:scale-95"
      >
        <img src={currentImgSrc} alt={data.name} className="w-full h-full object-cover pointer-events-none" />
        {'bonus' in data && data.bonus !== 0 && (
          <div className={getResponsiveText("absolute top-0.5 right-0.5 bg-black/70 text-white text-[8px] px-1 rounded font-bold", "md:text-xs md:top-1 md:right-1")}>
            +{data.bonus}
          </div>
        )}
      </div>
    );
  }

  return (
    <div onClick={handleInternalClick} className="w-full h-full contents">
      <Card className={`w-full h-full aspect-[5/7] flex flex-col overflow-hidden bg-card border-2 select-none group cursor-pointer ${className}`}>
        
        {/* Шапка: для компактных всегда p-1.5/p-2, для обычных растет на md */}
        <CardHeader className={getResponsiveText("p-1.5 sm:p-2 pb-1 space-y-0.5", "md:p-4 md:pb-2 md:space-y-1")}>
          <div className="flex justify-between items-start gap-1">
            <CardTitle className={getResponsiveText("text-[10px] sm:text-xs font-bold leading-tight truncate uppercase", "md:text-base")}>
              {data.name}
            </CardTitle>
            <div className={getResponsiveText("flex gap-1 shrink-0 scale-75 origin-right", "md:scale-110")}>
               {getCardIcon(data.type)}
               {'race' in data && data.race && getCardIcon(data.race)}
            </div>
          </div>
          {!isCompact && (
            <CardDescription className="line-clamp-2 mt-1 text-[9px] md:text-sm leading-tight italic min-h-[1.5em]">
              {data.description}
            </CardDescription>
          )}
        </CardHeader>

        <div className={getResponsiveText("relative flex-1 min-h-0 px-1.5 sm:px-2 py-0.5", "md:px-4 md:py-2")}>
          <div className="w-full h-full overflow-hidden rounded-md border-2 border-muted bg-zinc-100">
            <img src={currentImgSrc} alt={data.name} className="object-cover w-full h-full" />
          </div>
          
          {/* Бейджи внутри картинки */}
          <div className={getResponsiveText("absolute bottom-1.5 left-2 flex flex-wrap gap-1", "md:bottom-3 md:left-6 md:gap-2")}>
            {'bonus' in data && data.bonus !== 0 && (
              <Badge className={getResponsiveText("text-[7px] sm:text-[9px] px-1 h-3.5 sm:h-4", "md:text-xs md:h-7 md:px-2")}>
                +{data.bonus} Сила
              </Badge>
            )}
            {'level' in data && data.level !== 0 && (
              <Badge variant="destructive" className={getResponsiveText("text-[7px] sm:text-[9px] px-1 h-3.5 sm:h-4", "md:text-xs md:h-7 md:px-2")}>
                УР. {data.level}
              </Badge>
            )}
          </div>
        </div>

        {/* Футер */}
        <CardContent className={getResponsiveText("p-1 sm:p-1.5 bg-muted/20 mt-auto", "md:p-3")}>
          <div className={getResponsiveText("flex justify-between items-center text-[8px] sm:text-[9px] font-bold", "md:text-sm")}>
              {'class' in data && data.class && (
                <span className="uppercase">{CLASS_LABELS[data.class as string] || data.class}</span>
              )}
              <div className="flex gap-1 md:gap-2">
                 {isDoor && 'treasure' in data && data.treasure !== 0 && <span>💰{data.treasure}</span>}
                 {'price' in data && data.price !== 0 && <span>💎{data.price}</span>}
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};