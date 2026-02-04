import { useMemo, useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    PlayerActionType,
    PHASE_PERMISSIONS,
    GamePhase,
    type IGameData,
    type IPlayerStats,
    CardType
} from '@munchkin/shared';
import { DiscardZone } from './DiscardZone';
import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/GameCard';
import { CardBack } from './CardBack';
import { GameAvatar } from './GameAvatar';
import { BuffZone } from './BuffZone'; // Импортируем созданный компонент
import { userCacheService } from '@/services/UserCacheService';
import type { UserDetails } from '@/services/apiUserLobbyWrapper';
import { Sword, Undo2, Plus, Skull } from 'lucide-react';
import { Dice } from '../Dice';

interface GameBattlefieldProps {
    gameData: IGameData;
    userId: string;
    me: IPlayerStats | null;
    opponents: IPlayerStats[];
    phaseText: string;
    onEndTurn: () => void;
    onEscape?: () => void;
    onFight?: () => void;
    runResult: { dice: number; result: boolean } | null,
    activeId?: string | null;
}

export const GameBattlefield = ({
    gameData,
    userId,
    me,
    runResult,
    opponents,
    phaseText,
    onEndTurn,
    onEscape,
    onFight,
    activeId
}: GameBattlefieldProps) => {
    const isMyTurn = gameData?.currentPlayerId === userId;
    const [isOpening, setIsOpening] = useState(false);
    const [currentPlayerDetails, setCurrentPlayerDetails] = useState<UserDetails | null>(null);

    const activePlayerStats = useMemo(() => {
        if (gameData.currentPlayerId === userId) return me;
        return opponents.find(opt => opt.id === gameData.currentPlayerId) || null;
    }, [gameData.currentPlayerId, userId, me, opponents]);

    useEffect(() => {
        if (gameData.currentPlayerId) {
            userCacheService.getById(gameData.currentPlayerId).then(setCurrentPlayerDetails);
        }
    }, [gameData.currentPlayerId]);

    useEffect(() => {
        if (gameData.activeDoor) setIsOpening(false);
    }, [gameData.activeDoor]);

    const isInBattle = gameData.phase === GamePhase.BATTLE;

    const activeDraggingCardType = useMemo(() => {
        if (!activeId || !me) return undefined;
        return me.cards.find(c => c._id === activeId)?.type;
    }, [activeId, me]);

    const canEndTurn = useMemo(() => {
        if (!gameData || !userId) return false;
        const phaseRules = PHASE_PERMISSIONS[gameData.phase];
        const endTurnRule = phaseRules?.find(p => p.action === PlayerActionType.EndTurn);
        return endTurnRule?.allowedFor === 'current' ? isMyTurn : !!endTurnRule;
    }, [gameData.phase, gameData.currentPlayerId, userId, isMyTurn]);

    const isDraggingOther = useMemo(() => {
        if (!activeId || !me) return false;
        const card = me.cards.find(c => c._id === activeId);
        return card?.type === CardType.Other;
    }, [activeId, me]);

    const { setNodeRef, isOver } = useDroppable({
        id: 'battlefield-zone',
        disabled: isInBattle && !isDraggingOther,
        data: { zone: 'BATTLEFIELD' },
    });
    const [showTextResult, setShowTextResult] = useState(false);

    useEffect(() => {
        if (runResult) {
            setShowTextResult(false);
            const timer = setTimeout(() => setShowTextResult(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowTextResult(false);
        }
    }, [runResult]);

    const showPendingCard = isOpening || (activeId === 'deck-door-draggable' && isOver);

    return (
        <div className="flex-1 relative flex flex-col">
            <div
                ref={setNodeRef}
                className={`flex-1 border-2 border-dashed rounded-[3.5rem] transition-all relative overflow-hidden flex flex-col p-8
            ${isDraggingOther ? 'border-amber-400 bg-amber-400/5 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : ''}
            ${isOver && isDraggingOther ? 'bg-amber-400/20 scale-[0.99]' : ''}
            
            ${isOver && !isInBattle && !isDraggingOther ? 'bg-primary/5 border-primary shadow-inner' : 'bg-background/40 border-muted-foreground/10'}
            ${isInBattle && !isDraggingOther ? 'border-transparent' : ''}
        `}
            >
                <div className="flex-1 flex flex-col items-center justify-center gap-8">

                    {(gameData.activeDoor || showPendingCard) ? (
                        <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">

                            {/* ЗОНА МОНСТРА */}
                            <div className="flex items-center gap-10">
                                <div className="relative">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap mb-1">
                                            Монстр
                                        </span>
                                        {gameData.activeDoor && (
                                            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-0.5 rounded-full shadow-lg">
                                                <Skull className="w-3 h-3" />
                                                <span className="text-sm font-black">{gameData.monsterPower || 0}</span>
                                            </div>
                                        )}
                                    </div>

                                    {gameData.activeDoor ? (
                                        <div className="w-40 shadow-xl transition-transform hover:scale-105 duration-300">
                                            <GameCard data={gameData.activeDoor} isCompact />
                                        </div>
                                    ) : (
                                        <div className="w-40 h-56 animate-pulse">
                                            <CardBack type="door" className="rounded-2xl border-2 border-primary/40 shadow-xl" />
                                        </div>
                                    )}
                                </div>

                                <BuffZone
                                    id="monster-buff-zone"
                                    label="Баффы Монстра"
                                    colorClass="text-red-500"
                                    target="monster"
                                    cards={gameData.monsterCards || []}
                                    activeCardType={activeDraggingCardType}
                                />
                            </div>

                            {/* ПАНЕЛЬ VERSUS / КНОПКИ */}
                            <div className="w-full flex items-center gap-6">
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                                {runResult ? (
                                    <div className="flex flex-col items-center">
                                        <Dice
                                            key={`dice-${runResult.dice}`} // Используем значение для сброса анимации
                                            value={runResult.dice}
                                            isSuccess={runResult.result}
                                        />

                                        <div className="h-6 flex items-center justify-center mt-2">
                                            {showTextResult && (
                                                <span className={`text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-500
                                                    ${runResult.result ? 'text-green-500' : 'text-red-500'}`}>
                                                    {runResult.result ? 'СМЫЛСЯ!' : 'ПОЙМАН!'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : isInBattle && isMyTurn ? (
                                    <div className="flex gap-4 animate-in slide-in-from-bottom-2 duration-500">
                                        <Button variant="destructive" size="sm" onClick={onEscape} className="...">
                                            <Undo2 className="h-4 w-4" /> Побег
                                        </Button>
                                        <Button size="sm" onClick={onFight} className="...">
                                            <Sword className="h-4 w-4" /> В Бой!
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-2xl font-black italic text-primary/10 tracking-[0.3em] uppercase">Versus</div>
                                )}

                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                            </div>

                            {/* ЗОНА ИГРОКА */}
                            <div className="flex items-center gap-10">
                                <div className="flex flex-col items-center gap-3 w-40">
                                    <div className="scale-125 drop-shadow-xl">
                                        <GameAvatar
                                            userName={currentPlayerDetails?.username}
                                            avatarPath={currentPlayerDetails?.avatarUrl}
                                            level={activePlayerStats?.level || 1}
                                            power={activePlayerStats?.power || 0}
                                            isCurrentTurn={true}
                                            isMe={isMyTurn}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest mt-4">
                                        {isMyTurn ? "Твой Бой" : ''}
                                    </span>
                                </div>

                                <BuffZone
                                    id="player-buff-zone"
                                    label="Усиления Бойца"
                                    colorClass="text-primary"
                                    target="player"
                                    cards={gameData.battleCards || []}
                                    activeCardType={activeDraggingCardType}
                                />
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 opacity-20 pointer-events-none">
                            <div className="w-36 h-52 border-4 border-dashed border-current rounded-[2.5rem] flex items-center justify-center">
                                <Plus className="w-10 h-10" strokeWidth={1} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.5em]">Вышибай дверь</p>
                        </div>
                    )}
                </div>

                {/* ПЕРИФЕРИЯ */}
                <div className="absolute bottom-8 left-10">
                    <DiscardZone
                        isActive={isMyTurn}
                        doorsCount={gameData.doorsLeftCount ?? 0}
                        treasuresCount={gameData.treasureLeftCount ?? 0}
                    />
                </div>

                <div className="absolute top-10 right-10 flex flex-col items-end gap-3 z-20">
                    <div className="px-5 py-2 bg-background border rounded-full shadow-lg flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isMyTurn ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{phaseText}</span>
                    </div>

                    {canEndTurn && !isInBattle && (
                        <Button variant="default" size="sm" onClick={onEndTurn} className="h-10 px-8 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl">
                            Завершить ход
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};