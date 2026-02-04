import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  type IPlayerAction,
  type IServerEvent,
  GameEventType,
  type IPlayerStats,
  type IGameData,
  GamePhase
} from '@munchkin/shared';
import type { GameEventParams } from '@munchkin/shared';
import { gameApi } from '@/services/apiGame';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/services/apiService';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from '@tanstack/react-router';

// Вспомогательная функция для красивых логов
const log = (message: string, data?: any, type: 'info' | 'warn' | 'error' | 'socket' = 'info') => {
  const styles = {
    info: 'color: #3b82f6; font-weight: bold',
    socket: 'color: #10b981; font-weight: bold',
    warn: 'color: #f59e0b; font-weight: bold',
    error: 'color: #ef4444; font-weight: bold',
  };
  console.log(`%c[GameLoop] ${message}`, styles[type], data ?? '');
};

export const useGameLoop = (gameId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const [runResult, setRunResult] = useState<{ dice: number; result: boolean } | null>(null);
  const [gameData, setGameData] = useState<IGameData | null>(null);
  const [gameState, setGameState] = useState<GameEventParams[GameEventType.StateUpdated] | null>(null);
  const [me, setMe] = useState<IPlayerStats | null>(null);
  const [opponents, setOpponents] = useState<Record<string, IPlayerStats>>({});
  const [logs, setLogs] = useState<GameEventParams[GameEventType.LogMessage][]>([]);

  useEffect(() => {
    if (!user?._id) return;

    let isCancelled = false;

    const initConnection = async () => {
      try {
        log(`Initializing connection for game: ${gameId}...`);
        const access = await gameApi.checkAccess(gameId);

        if (isCancelled) return;

        const s = io(`http://localhost:9000/game`, {
          auth: {
            gameId: gameId,
            userId: user._id,
            password: access.data.password
          },
          transports: ['websocket'],
          forceNew: true
        });

        socketRef.current = s;

        s.on('connect', () => {
          log('Connected to socket server', { socketId: s.id }, 'socket');
          setIsConnected(true);
        });

        s.on('disconnect', (reason) => {
          log('Disconnected from server', { reason }, 'warn');
          setIsConnected(false);
        });

        s.on('connect_error', (err) => {
          log('Connection error', err.message, 'error');
        });

        s.on('server:event', (event: IServerEvent) => {
          const { type, payload } = event;

          // Логируем каждое входящее событие
          log(`Event [${type}] received`, payload);

          switch (type) {
            case GameEventType.UpdateGame:
              setGameData(payload.game);
              if (payload.game.phase !== GamePhase.RUN) {
                setRunResult(null); 
              }
              break;

            case GameEventType.StateUpdated:
              setGameState(payload);
              break;

            case GameEventType.UpdatePlayer: {
              const player = payload.player;
              if (player.id === user._id) {
                log('Updating current player stats (me)', player);
                setMe(prev => prev ? { ...prev, ...player, cards: prev.cards } : player);
              } else {
                log(`Updating opponent stats: ${player.id}`, player);
                setOpponents(prev => ({
                  ...prev,
                  [player.id]: player
                }));
              }
              break;
            }

            case GameEventType.InventoryUpdated:
              if (payload.userId === user._id) {
                log('Private inventory sync (cards received)', { count: payload.cardsCount });
                setMe(prev => prev ? {
                  ...prev,
                  cards: payload.cards,
                  cardsCount: payload.cardsCount
                } : null);
              } else {
                log(`Public inventory update for opponent ${payload.userId}`, { count: payload.cardsCount });
                setOpponents(prev => {
                  const opponent = prev[payload.userId];
                  if (!opponent) return prev;
                  return {
                    ...prev,
                    [payload.userId]: { ...opponent, cardsCount: payload.cardsCount }
                  };
                });
              }
              break;

            case GameEventType.StatsChanged:
              if (payload.userId === user._id) {
                setMe(prev => prev ? { ...prev, level: payload.level } : null);
              } else {
                setOpponents(prev => {
                  const target = prev[payload.userId];
                  if (!target) return prev;
                  return {
                    ...prev,
                    [payload.userId]: { ...target, level: payload.level }
                  };
                });
              }
              break;

            case GameEventType.LogMessage:
              setLogs(prev => {
                if (prev.length > 0 && prev[0].message === payload.message) return prev;
                return [payload, ...prev].slice(0, 50);
              });
              break;

            case GameEventType.ErrorOccurred:
              log('Server-side game error', payload, 'error');

              if (payload.code === 'LIMIT_BIG_ITEMS') {
                toast.error(payload.message, {
                  icon: '🐘',
                  duration: 4000,
                  style: {
                    border: '1px solid #ef4444',
                    padding: '16px',
                    color: '#ef4444',
                    fontWeight: 'bold'
                  }
                });
              } else if (payload.code === 'VALIDATION_ERROR') {
                toast.error(payload.message, { icon: '⚠️' });
              } else {
                toast.error(payload.message);
              }
              break;

            case GameEventType.RunResult:
              setRunResult({
                dice: payload.dice,
                result: payload.result
              });
              break;

            case GameEventType.End:
              navigate({ 
                to: '/game/$id/end', 
                params: { id: gameId } 
              });
              break;

            default:
              log('Unhandled event type', type, 'warn');
          }
        });

        setSocket(s);
      } catch (err) {
        if (!isCancelled) {
          log('Initialization failed', err, 'error');
          toast.error("Ошибка доступа к игре");
        }
      }
    };

    initConnection();

    return () => {
      log('Cleaning up connection...');
      isCancelled = true;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setLogs([]);
      setOpponents({});
      setMe(null);
    };
  }, [gameId, user?._id]);

  const sendAction = useCallback((action: IPlayerAction) => {
    if (socket?.connected) {
      log('Sending player action', action);
      socket.emit('game:action', action);
    } else {
      log('Failed to send action: socket not connected', action, 'error');
      toast.error("Нет соединения с сервером");
    }
  }, [socket]);

  return {
    isConnected,
    gameData,
    gameState,
    me,
    opponents,
    logs,
    runResult,
    sendAction
  };
};