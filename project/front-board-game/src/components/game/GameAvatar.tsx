import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AVATAR_BASE_URL } from '@/services/apiService';

interface GameAvatarProps {
  userName: string | undefined;
  avatarPath: string | undefined;
  level: number;
  isCurrentTurn: boolean;
  isMe?: boolean;
  power?: number;
}

export function GameAvatar({ 
  userName, 
  avatarPath, 
  level, 
  isCurrentTurn, 
  isMe ,
  power
}: GameAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Avatar 
          className={`h-10 w-10 border-2 transition-all ${
            isCurrentTurn
              ? 'border-primary ring-4 ring-primary/10 scale-105'
              : 'border-border'
          }`}
        >
          <AvatarImage src={`${AVATAR_BASE_URL}${avatarPath}`} />
          <AvatarFallback className="bg-muted">
            {userName?.slice(0, 2).toUpperCase() || '??'}
          </AvatarFallback>
        </Avatar>
        
        {/* Индикатор уровня */}
        <div className="absolute -top-1 -right-1 h-4 min-w-4 bg-primary text-primary-foreground flex items-center justify-center rounded-full text-[9px] font-black shadow-lg border-2 border-background">
          {level}
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`text-[10px] font-black uppercase tracking-widest ${
          isCurrentTurn ? 'text-primary' : 'text-foreground/70'
        }`}>
          {userName} {isMe && "(Вы)"}
        </span>
        <Badge 
          variant="outline" 
          className="text-[8px] px-1 h-3.5 border-amber-500/20 bg-amber-500/5 text-amber-500 w-fit"
        >
          {power || level} Сила
        </Badge>
      </div>
    </div>
  );
}