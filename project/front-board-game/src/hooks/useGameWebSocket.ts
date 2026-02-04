import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { gameApi } from '@/services/apiGame';
import { API_BASE_URL } from '@/services/apiService';
import toast from 'react-hot-toast';

interface GameError {
    message: string;
    status?: number;
}

export const useGameWebSocket = (gameId: string | undefined, userId: string | undefined) => {
    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(async () => {
        if (!gameId || !userId) return;

        try {
            // 1. Получаем временный пароль доступа к игровой сессии
            const access = await gameApi.checkAccess(gameId);
            
            // 2. Инициализируем сокет в пространстве имен /game
            const socket = io(`${API_BASE_URL}game`, {
                auth: {
                    gameId,
                    userId,
                    password: access.data.password
                },
                transports: ['websocket'],
                forceNew: true
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                setIsConnected(true);
                setError(null);
                toast.success('Подключено к игре');
            });

            socket.on('game:state_update', (state: any) => {
                setGameState(state);
            });

            socket.on('game:error', (err: GameError) => {
                setError(err.message);
                toast.error(err.message);
            });

            socket.on('disconnect', () => {
                setIsConnected(false);
            });

            socket.on('connect_error', () => {
                setError('Ошибка авторизации в игровой сессии');
            });

        } catch (err: any) {
            const msg = err.error?.message || 'Не удалось получить доступ к игре';
            setError(msg);
            toast.error(msg);
        }
    }, [gameId, userId]);

    const sendAction = useCallback((name: string, payload: any = {}) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('game:action', { name, payload });
        } else {
            toast.error('Нет соединения с сервером');
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            socketRef.current?.disconnect();
        };
    }, [connect]);

    return { isConnected, gameState, error, sendAction, retry: connect };
};