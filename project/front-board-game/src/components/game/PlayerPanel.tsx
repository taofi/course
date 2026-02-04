import { GameAvatar } from './GameAvatar';
import { EquipmentSlot } from './EquipmentSlot';
import {
    type IPlayerStats,
    type ICardData,
    type IDoorData,
    type GameEventParams,
    GameEventType,
    type PlayerEquipSlot
} from '@munchkin/shared';
import type { User } from '@/types/authTypes';
import { SlotType } from '@/types/gameDnd';
import { DraggableCard } from './DraggableCard';

interface PlayerPanelProps {
    me: IPlayerStats | null;
    user: User;
    gameState: GameEventParams[GameEventType.StateUpdated] | null;
    setSelectedCard: (card: ICardData | IDoorData) => void;
    onUnequip: (slot: PlayerEquipSlot) => void; // Добавляем функцию снятия
    isDraggingAny?: boolean;
}

export const PlayerPanel = ({ me, user, gameState, setSelectedCard, onUnequip, isDraggingAny }: PlayerPanelProps) => {
    // Вычисляем, наш ли сейчас ход
    const isMyTurn = gameState?.currentPlayerId === user?._id;

    return (
        <footer className="min-h-[220px] border-t bg-card/80 backdrop-blur-xl w-full flex px-8 py-4 gap-10 items-center shadow-[0_-8px_30px_rgba(0,0,0,0.2)]">

            {/* ЛЕВАЯ СЕКЦИЯ: ПРОФИЛЬ И СЛОТЫ */}
            <div className="flex flex-col gap-4 h-full shrink-0 justify-center">
                {me && (
                    <GameAvatar
                        userName={user?.name}
                        avatarPath={user?.avatar}
                        level={me.level}
                        isCurrentTurn={isMyTurn}
                        isMe={true}
                        power={me.power}
                    />
                )}

                <div className="flex gap-3">
                    <EquipmentSlot
                        id="slot-head"
                        data={me?.headGear}
                        icon="/icons/head_icon.png"
                        label="Голова"
                        acceptType={SlotType.HEAD}
                        isMyTurn={isMyTurn}
                        onRemove={onUnequip}
                    />

                    <EquipmentSlot
                        id="slot-armor"
                        data={me?.armor}
                        icon="/icons/armor_icon.png"
                        label="Тело"
                        acceptType={SlotType.ARMOR}
                        isMyTurn={isMyTurn}
                        onRemove={onUnequip}
                    />

                    <EquipmentSlot
                        id="slot-boots"
                        data={me?.boots}
                        icon="/icons/boots_icon.png"
                        label="Обувь"
                        acceptType={SlotType.BOOTS}
                        isMyTurn={isMyTurn}
                        onRemove={onUnequip}
                    />

                    <div className="w-[1px] h-12 bg-border/40 self-center mx-1" />

                    <EquipmentSlot
                        id="slot-race"
                        data={me?.race}
                        icon="/icons/race_icon.png"
                        label="Раса"
                        isIdentity
                        acceptType={SlotType.RACE}
                        isMyTurn={isMyTurn}
                        onRemove={onUnequip}
                    />

                    <EquipmentSlot
                        id="slot-hand-left"
                        data={me?.oneHand}
                        icon="/icons/hand_left.png"
                        label="Л. Рука"
                        acceptType={SlotType.WEAPON}
                        isMyTurn={isMyTurn}
                        onRemove={onUnequip}
                    />

                    <EquipmentSlot
                        id="slot-hand-right"
                        data={me?.secondHand}
                        icon="/icons/hand_right.png"
                        label="П. Рука"
                        acceptType={SlotType.WEAPON}
                        isMyTurn={isMyTurn}
                        onRemove={onUnequip}
                    />
                </div>
            </div>

            {/* ЦЕНТРАЛЬНАЯ СЕКЦИЯ: РУКА ИГРОКА */}
            <div className="flex-1 h-full flex flex-col justify-center border-l border-border/40 pl-10 overflow-visible">
                <h3 className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.3em] mb-4 opacity-40">
                    Карты ({me?.cards.length || 0})
                </h3>

                <div className={`flex transition-all duration-500 ease-out items-end pb-4 ${(isDraggingAny || me?.cards.length === 1) ? '-space-x-8' : '-space-x-24 hover:-space-x-8'} group`}>
                    {me?.cards.map((card) => (
                        <div
                            key={card._id}
                            className={`relative w-28 shrink-0 transition-all duration-500 ease-out group ${isDraggingAny ? 'z-0' : 'z-10 hover:z-50'}`}
                        >
                            <DraggableCard
                                card={card}
                                setSelectedCard={setSelectedCard}
                            />
                        </div>
                    ))}

                    {(!me?.cards || me.cards.length === 0) && (
                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted rounded-xl w-full max-w-xs transition-all">
                            <span className="text-muted-foreground/30 uppercase text-[10px] font-bold tracking-widest">Пустая рука</span>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};