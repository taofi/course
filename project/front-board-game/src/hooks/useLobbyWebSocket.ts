import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { type LobbyDetails, LobbyStatus } from '../types/lobbyTypes';
import { userCacheService } from '../services/UserCacheService';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/services/apiService';

const WS_SERVER_URL = 'http://localhost:9000/' + 'lobby'; 

export interface ChatMessage {
    senderId: string;
    senderName: string;
    message: string;
    timestamp: string;
}

export const useLobbyWebSocket = (userId: string | undefined, lobbyId: string | null) => {
    const [lobby, setLobby] = useState<LobbyDetails | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // --- ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ЧАТА (не в БД) ---
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    
    const socketRef = useRef<Socket | null>(null);

    // Вспомогательная функция для получения имен участников
    const enrichParticipants = useCallback(async (participants: any[]) => {
        return Promise.all(participants.map(async (p) => {
            try {
                const details = await userCacheService.getById(p.id);
                return { ...p, username: details.username };
            } catch {
                return { ...p, username: `User ${p.id.slice(0, 4)}` };
            }
        }));
    }, []);

    // Обработка обновлений лобби
    const handleLobbyUpdate = useCallback(async (details: LobbyDetails) => {
        if (details.status === LobbyStatus.CLOSED) {
            setLobby(null);
            setError('Лобби закрыто.');
            if (socketRef.current) socketRef.current.disconnect();
        } else {
            const participantsWithNames = await enrichParticipants(details.participants);
            setLobby({ ...details, participants: participantsWithNames });
        }
    }, [enrichParticipants]);

    

    // --- ОБРАБОТКА ВХОДЯЩЕГО СООБЩЕНИЯ ЧАТА ---
    const handleChatMessage = useCallback(async (payload: { senderId: string, message: string, timestamp?: string }) => {
        // Быстро получаем имя отправителя через кэш-сервис
        let senderName = 'Система';
        try {
            const details = await userCacheService.getById(payload.senderId);
            senderName = details.username;
        } catch (e) {
            senderName = payload.senderId.slice(0, 5);
        }

        const newMessage: ChatMessage = {
            senderId: payload.senderId,
            senderName: senderName,
            message: payload.message,
            timestamp: payload.timestamp || new Date().toISOString()
        };

        // Добавляем сообщение в локальный список
        setChatMessages(prev => [...prev, newMessage]);
    }, []);

    useEffect(() => {
        if (!userId || !lobbyId) return;

        const socket = io(WS_SERVER_URL, {
            query: { userId, lobbyId },
            autoConnect: false
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join_lobby', { userId, lobbyId });
        });

        socket.on('lobby_update', handleLobbyUpdate);
        
        // Слушаем событие чата, которое ретранслирует сервер
        socket.on('chat_message', handleChatMessage);

        socket.on('disconnect', () => setIsConnected(false));
        socket.on('connect_error', () => setError('Ошибка подключения к WS'));

        socket.on('kicked_from_lobby', (data: { message: string }) => {
            toast.error(data.message);
            window.location.href = '/'; 
        });

        socket.on('game_started', (data: { gameId: string, message?: string }) => {
            if (data.message) {
                toast.success(data.message);
            }
            // Перенаправляем всех участников лобби на страницу игры
            window.location.href = `/game/${data.gameId}`;
        })

        socket.connect();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [userId, lobbyId, handleLobbyUpdate, handleChatMessage]);

    // --- ФУНКЦИЯ ОТПРАВКИ СООБЩЕНИЯ ---
    const sendChatMessage = useCallback((text: string) => {
        if (socketRef.current?.connected && text.trim()) {
            // Отправляем через системный обработчик 'lobby_message' на сервере
            socketRef.current.emit('lobby_message', {
                event: 'chat_message',
                payload: { message: text }
            });
        }
    }, []);

    
    return { 
        lobby, 
        isConnected, 
        error, 
        chatMessages, // Передаем список сообщений в компонент
        sendChatMessage // Передаем функцию отправки
    };
};