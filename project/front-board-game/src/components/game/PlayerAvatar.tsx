import { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { PlayerActivity, type IPlayerStats, type ICardData, type IDoorData } from '@munchkin/shared'
import { userCacheService } from '@/services/UserCacheService'
import type { UserDetails } from '@/services/apiUserLobbyWrapper'
import { CardBack } from './CardBack'
import { GameAvatar } from './GameAvatar'
import { GameCard } from '../GameCard'

interface PlayerAvatarProps {
  stats: IPlayerStats;
  isCurrentTurn?: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  // Добавляем функцию для выбора карты (из GamePage)
  setSelectedCard: (card: ICardData | IDoorData | null) => void;
}

export const PlayerAvatar = ({ stats, isCurrentTurn, position, setSelectedCard }: PlayerAvatarProps) => {
  const [userData, setUserData] = useState<UserDetails | null>(null);
  const isOffline = stats.activity === PlayerActivity.OFFLINE;

  useEffect(() => {
    userCacheService.getById(stats.id).then(setUserData);
  }, [stats.id]);

  const cardsInHandArray = Array.from({ length: stats.cardsCount || 0 });
  const isSide = position === 'left' || position === 'right';
  const isTop = position === 'top';
  const slotSize = isTop ? 'sm' : 'md';

  // Массив конфигурации слотов для чистого рендеринга
  const equipmentSlots = [
    { data: stats.headGear, label: "Head", icon: "/icons/head_icon.png" },
    { data: stats.armor, label: "Body", icon: "/icons/armor_icon.png" },
    { data: stats.boots, label: "Feet", icon: "/icons/boots_icon.png" },
    { data: stats.race, label: "Race", icon: "/icons/race_icon.png" },
    { data: stats.oneHand, label: "Hand", icon: "/icons/hand_left.png" },
    { data: stats.secondHand, label: "Hand", icon: "/icons/hand_right.png" },
  ];

  return (
    <div className={`flex transition-all duration-500 ${isOffline ? 'opacity-40 grayscale' : ''} ${
      isSide ? 'flex-col gap-4 items-center' : 'flex-row gap-8 items-center w-full'
    }`}>

      {/* 1. БЛОК ИНФОРМАЦИИ */}
      <div className={`flex ${isSide ? 'flex-col' : 'flex-row'} items-center gap-3 ${isTop ? 'ml-4' : ''}`}>
        <GameAvatar 
          userName={userData?.username}
          avatarPath={userData?.avatarUrl}
          level={stats.level}
          isCurrentTurn={!!isCurrentTurn}
          isMe={false}
          power={stats.power}
        />
        <div className={`flex flex-col mt-1 ${isSide ? 'items-center' : 'items-start'}`}>
          <Badge variant="secondary" className="text-[9px] px-2 h-4 bg-primary/10 text-primary border-none font-bold">
            ⚔️ {stats.power}
          </Badge>
        </div>
      </div>

      {/* 2. КАРТЫ В РУКЕ */}
      <div className={`flex items-center justify-center overflow-visible ${isSide ? 'order-2 w-full py-2' : 'w-48'}`}>
        <div className="flex flex-wrap justify-center -space-x-8">
          {cardsInHandArray.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className="w-12 sm:w-16 shadow-xl transition-all duration-300"
              style={{ zIndex: i }}
            >
              <CardBack type="treasure" className="border-[1px] rounded-md" />
            </div>
          ))}
          {cardsInHandArray.length > 5 && (
            <div className="z-[70] -ml-4 self-center flex items-center justify-center bg-primary text-primary-foreground border-2 border-background rounded-full h-6 w-6 text-[9px] font-bold shadow-xl">
              +{cardsInHandArray.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* 3. ЭКИПИРОВКА */}
      <div className={`
        grid gap-1.5 p-2 rounded-xl bg-muted/10 border border-border/40
        ${isSide ? 'grid-cols-3 order-3 w-fit' : 'grid-cols-6 h-fit'}
      `}>
        {equipmentSlots.map((slot, index) => (
          <div 
            key={index}
            className={`
              relative rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 overflow-hidden
              ${slotSize === 'sm' ? 'w-12 h-16' : 'w-16 h-20'}
              ${slot.data ? 'cursor-pointer hover:ring-2 ring-primary/40 transition-all' : ''}
            `}
            onClick={() => slot.data && setSelectedCard(slot.data)}
          >
            {slot.data ? (
              <div className="w-full h-full animate-in fade-in duration-300">
                <GameCard data={slot.data} variant="icon" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full opacity-20 p-1">
                <img src={slot.icon} alt={slot.label} className="w-1/2 h-1/2 object-contain grayscale brightness-0" />
                <span className="text-[7px] uppercase font-bold mt-1 text-center leading-none">{slot.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};