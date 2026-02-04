import { useEffect, useRef, useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useGameLoop } from '@/hooks/useGameLoop'
import { PlayerAvatar } from '@/components/game/PlayerAvatar'
import { useAuth } from '@/contexts/useAuth'
import { Button } from '@/components/ui/button'
import { Maximize2, } from 'lucide-react'
import { PauseOverlay } from '@/components/game/PauseOverlay'
import { GameCard } from '@/components/GameCard' // Импортируем ваш компонент
import { CardType, GamePhase, PlayerActionType, type ICardData, type IDoorData } from '@munchkin/shared'
import { CardBack } from '@/components/game/CardBack'
import { userCacheService } from '@/services/UserCacheService'
import { PlayerPanel } from '@/components/game/PlayerPanel'

import {
  PointerSensor,   // Для мыши и тачскрина
  KeyboardSensor,  // Для доступности
  useSensor,
  useSensors,
  type DragEndEvent,
  DndContext,
  DragOverlay
} from '@dnd-kit/core';
import toast, { Toaster } from 'react-hot-toast'
import { GameBattlefield } from '@/components/game/GameBattlefield'
import { DoorDeck } from '@/components/game/DoorDeck'

export const Route = createFileRoute('/game/$id/')({
  component: GamePage,
})

const PHASE_LABELS: Record<string, string> = {
  idle: 'Ожидание',
  turn: 'Ход',
  battle: 'Бой',
  loot: 'Обыск',
  charity: 'От щедрот',
  enemyTurn: 'Ход противника',
  dropCards: 'Сброс карт',
};

function GamePage() {
  const { id } = Route.useParams()
  const { user } = useAuth()
  const { isConnected, gameState, gameData, me, opponents, runResult, sendAction } = useGameLoop(id)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Состояние для увеличенной карточки
  const [selectedCard, setSelectedCard] = useState<ICardData | IDoorData | null>(null)
  const [activePlayerName, setActivePlayerName] = useState<string>('Загрузка...');


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Чтобы перетаскивание не срабатывало при обычном клике (например, по кнопке "Инфо"),
        // игрок должен сдвинуть курсор минимум на 8 пикселей.
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor) // Позволяет управлять картами стрелками (хороший тон)
  );
  const [activeCard, setActiveCard] = useState<ICardData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    const { active } = event;

    setActiveId(active.id);

    const card = active.data.current?.card;
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);
    setActiveId(null);

    if (!over) return;

    const dragData = active.data.current;
    const dropData = over.data.current;

    // --- ЛОГИКА ДЛЯ КОЛОДЫ (ДВЕРИ) ---
    if (dragData?.isDeck && dragData.deckType === 'door') {
      if (dropData?.zone === 'BATTLEFIELD' && !dropData?.target) { // Убеждаемся, что это основное поле, а не зона баффа
        const canOpen = isMyTurn && gameData?.phase === GamePhase.TURN;

        if (canOpen) {
          sendAction({
            name: PlayerActionType.OpenDoor,
            params: {}
          });
          console.log("[Game] Opening door from deck...");
        } else {
          toast.error("Сейчас нельзя вышибать дверь!");
        }
      }
      return;
    }

    // --- ЛОГИКА ДЛЯ КАРТ ИЗ РУКИ ---
    if (!dragData?.card) return;

    if (dropData?.zone === 'BATTLEFIELD' && !dropData?.target) {
      if (dragData.card.type === CardType.Other) {
        if (isMyTurn) {
          sendAction({
            name: PlayerActionType.UseOtherCard, // Используем созданный метод
            params: { cardId: dragData.card._id }
          });
          toast.success(`Активируем: ${dragData.card.name}`);
        } else {
          toast.error("Использовать карты можно только в свой ход");
        }
        return;
      }
    }

    // Обработка перетаскивания в зоны усиления (BuffZone)
    if (dropData?.zone === 'BATTLEFIELD' && dropData?.target) {
      const cardId = dragData.card._id;

      if (dropData.target === 'monster') {
        sendAction({
          name: PlayerActionType.BuffMonster,
          params: { cardId }
        });
        toast.success("Усиливаем монстра...");
      } else if (dropData.target === 'player') {
        sendAction({
          name: PlayerActionType.BuffPlayer,
          params: { cardId }
        });
        toast.success("Усиливаем игрока...");
      }
      return;
    }

    if (dropData?.zone === 'EQUIPMENT') {
      sendAction({
        name: PlayerActionType.Equip,
        params: { cardId: dragData.card._id }
      });
    }

    if (dropData?.zone === 'DISCARD') {
      if (isMyTurn) {
        sendAction({
          name: PlayerActionType.DropCard,
          params: { cardId: dragData.card._id }
        });
        toast.success("Карта сброшена");
      } else {
        toast.error("Сбрасывать карты можно только в свой ход");
      }
    }
  };

  useEffect(() => {
    const fetchActivePlayerName = async () => {
      if (gameState?.currentPlayerId) {
        try {
          // Если ID совпадает с текущим пользователем, можно взять имя из объекта user
          if (gameState.currentPlayerId === user?._id) {
            setActivePlayerName(user.name || 'Вы');
            return;
          }

          // Иначе получаем данные через UserCacheService (из кэша или по API)
          const details = await userCacheService.getById(gameState.currentPlayerId);
          setActivePlayerName(details.username);
        } catch (error) {
          console.error("Ошибка при получении имени игрока:", error);
          setActivePlayerName('Игрок');
        }
      }
    };

    fetchActivePlayerName();
  }, [gameState?.currentPlayerId, user?._id]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const positions = useMemo(() => {
    if (!gameData || !user) return null
    const ids = gameData.participantsId
    const myIndex = ids.indexOf(user._id)
    if (myIndex === -1) return null
    const rotatedIds = [...ids.slice(myIndex), ...ids.slice(0, myIndex)]
    return {
      leftId: rotatedIds[1],
      topId: rotatedIds[2],
      rightId: rotatedIds[3],
    }
  }, [gameData, user])


  const getPhaseStatus = () => {
    if (!gameData || !gameState) return 'Загрузка...';

    const phase = gameData.phase;
    const isMyTurn = gameState.currentPlayerId === user?._id;

    if (isMyTurn) {
      switch (phase) {
        case GamePhase.TURN: return 'Ваш ход: Вышибайте дверь';
        case GamePhase.BATTLE: return 'Ваш бой: Сражайтесь!';
        case GamePhase.LOOT: return 'Обыск: Берете карту';
        case GamePhase.CHARITY: return 'От щедрот: Лишние карты';
        case GamePhase.DROP_CARDS: return 'Сброс лишних карт';
        default: return PHASE_LABELS[phase as string] || phase;
      }
    }

    // Для оппонентов используем имя, полученное из UserCacheService
    switch (phase) {
      case GamePhase.TURN: return `Ход: ${activePlayerName}`;
      case GamePhase.BATTLE: return `Бой: ${activePlayerName}`;
      case GamePhase.LOOT: return `${activePlayerName} обыскивает`;
      case GamePhase.CHARITY: return `${activePlayerName} раздает карты`;
      case GamePhase.DROP_CARDS: return `${activePlayerName} Сбросыет лишние карты`;

      default: return `${PHASE_LABELS[phase as string] || phase}: ${activePlayerName}`;
    }
  };

  const phaseText = getPhaseStatus();
  const isMyTurn = gameState?.currentPlayerId === user?._id;



  if (!isConnected || !gameData || !user || !positions) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground animate-pulse uppercase tracking-widest text-sm">
        Connecting...
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={gameContainerRef}
        className="relative w-full h-screen bg-background text-foreground overflow-hidden flex flex-col select-none"
      >
        <Toaster
          position="bottom-right"
          reverseOrder={false}
        />
        <PauseOverlay status={gameData.status} opponents={opponents} me={me} />

        {/* МОДАЛЬНОЕ ОКНО УВЕЛИЧЕННОЙ КАРТОЧКИ */}
        {selectedCard && (
          <div
            className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedCard(null)}
          >
            <div className="relative max-w-[350px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <GameCard data={selectedCard} />
              <p className="text-center text-muted-foreground mt-4 text-sm animate-pulse">
                Нажмите в любое место, чтобы закрыть
              </p>
            </div>
          </div>
        )}

        {/* 1. ВЕРХНЯЯ И СРЕДНЯЯ ЧАСТЬ (Оппоненты и Поле) */}
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-60 border-r bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="p-4 flex-1">
              {positions.leftId && opponents[positions.leftId] && (
                <PlayerAvatar
                  stats={opponents[positions.leftId]}
                  position="left"
                  isCurrentTurn={gameState?.currentPlayerId === positions.leftId}
                  setSelectedCard={setSelectedCard}
                />
              )}
            </div>
          </aside>

          <main className="flex-1 flex flex-col relative bg-muted/5">
            {/* ВЕРХНЯЯ ПАНЕЛЬ (Оппонент сверху) */}
            <div className="h-32 border-b bg-card/20 flex items-center justify-center relative z-10">
              {positions.topId && opponents[positions.topId] && (
                <PlayerAvatar
                  stats={opponents[positions.topId]}
                  position="top"
                  isCurrentTurn={gameState?.currentPlayerId === positions.topId}
                  setSelectedCard={setSelectedCard}
                />
              )}
            </div>

            <div className="flex-1 flex overflow-hidden p-6 gap-6">

              {/* ЛЕВАЯ КОЛОНКА: Только активные колоды */}
              <div className="flex flex-col justify-center gap-6 shrink-0">
                {/* Колода Дверей */}
                <DoorDeck
                  doorsCount={gameData?.doorsCount ?? 0}
                  treasureCount={gameData?.treasureCount ?? 0}
                  currentPhase={gameData.phase}
                  isMyTurn={isMyTurn}
                />
              </div>
              <GameBattlefield
                gameData={gameData}
                userId={user._id}
                me={me}
                opponents={Object.values(opponents)}
                phaseText={phaseText}
                activeId={activeId}
                runResult = {runResult}
                onEndTurn={() => sendAction({
                  name: PlayerActionType.EndTurn,
                  params: {}
                })}

                // Экшен попытки смыться (бросок кубика)
                onEscape={() => sendAction({
                  name: PlayerActionType.Run,
                  params: {}
                })}

                // Экшен завершения боя (подсчет силы и победа/поражение)
                onFight={() => sendAction({
                  name: PlayerActionType.Fight,
                  params: {}
                })}
              />
            </div>
          </main>

          <aside className="w-60 border-l bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="p-4 flex-1">
              {positions.rightId && opponents[positions.rightId] && (
                <PlayerAvatar
                  stats={opponents[positions.rightId]}
                  position="right"
                  isCurrentTurn={gameState?.currentPlayerId === positions.rightId}
                  setSelectedCard={setSelectedCard}
                />
              )}
            </div>
          </aside>
        </div>

        {/* 2. НИЖНЯЯ ПАНЕЛЬ (Интерфейс игрока) */}
        <PlayerPanel
          me={me}
          user={user}
          gameState={gameState}
          setSelectedCard={setSelectedCard}
          isDraggingAny={!!activeCard}
          onUnequip={(slotName) => {
            sendAction({
              name: PlayerActionType.UnEquip,
              params: { slot: slotName }
            });
          }}
        />
        {/* Кнопка Fullscreen */}
        {!isFullscreen && (
          <div className="absolute inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20">
                <Maximize2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                Требуется полный экран
              </h2>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                Для корректного отображения игрового поля, карт и интерфейса подземелья необходимо активировать полноэкранный режим.
              </p>
              <Button
                size="lg"
                onClick={toggleFullscreen}
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105 transition-transform"
              >
                ВОЙТИ В ИГРУ
              </Button>
              <p className="mt-6 text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em]">
                Нажмите кнопку выше
              </p>
            </div>
          </div>
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {/* ПАНЕЛЬ ОТЛАДКИ (Видна только во время перетаскивания) */}
        {(activeId || activeCard) && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white px-6 py-3 rounded-2xl text-[10px] font-mono z-[1000] border border-white/20 shadow-2xl flex flex-col gap-1 pointer-events-none">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">activeId:</span>
              <span className="text-yellow-400 font-bold">{activeId || 'NULL'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">activeCard:</span>
              <span className={activeCard ? 'text-green-400' : 'text-red-400'}>
                {activeCard ? `ID: ${activeCard._id}` : 'NULL'}
              </span>
            </div>
          </div>
        )}

        {/* ЛОГИКА ОТОБРАЖЕНИЯ КАРТЫ */}
        {activeCard ? (
          /* 1. Если тянем обычную карту из руки */
          (<div className="z-[999] pointer-events-none scale-110 shadow-2xl">
            <GameCard data={activeCard} isCompact className="shadow-2xl" />
          </div>)
        ) : activeId === 'deck-door-draggable' ? (
          /* 2. Если тянем колоду ДВЕРЕЙ */
          (<div className="z-[999] pointer-events-none scale-110 shadow-2xl rotate-3">
            <div className="w-24 aspect-[5/7]">
              <CardBack type="door" className="border-2 border-primary/30 rounded-lg shadow-2xl" />
            </div>
          </div>)
        ) : activeId === 'deck-treasure-draggable' ? (
          /* 3. Если тянем колоду СОКРОВИЩ */
          (<div className="z-[999] pointer-events-none scale-110 shadow-2xl -rotate-3">
            <div className="w-24 aspect-[5/7]">
              <CardBack type="treasure" className="border-2 border-amber-500/30 rounded-lg shadow-2xl" />
            </div>
          </div>)
        ) : (
          /* 4. Если ID есть, но не подошел ни под одно условие выше */
          (activeId && (<div className='bg-red-600 text-white p-4 rounded-lg animate-bounce border-2 border-white shadow-2xl'>Unknown ID: {activeId}
          </div>))
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default GamePage
