import { Server as SocketIOServer, Socket, Namespace } from 'socket.io';
import * as http from 'http';
import logger from '@src/utils/logger';
import { LobbyDetails } from '../game/models/LobbyModels';
import { lobbyService } from './lobby.service';

export interface ClientAuthData {
    userId: string;
    lobbyId: string;
}

/**
 * Универсальный сервис для управления лобби (Namespace: /lobby).
 */
export class WebSocketService {
    private io: SocketIOServer | null = null;
    private lobbyNamespace: Namespace | null = null;
    
    // Храним маппинги внутри сервиса
    private userSocketMap: Map<string, string> = new Map();
    private socketUserMap: Map<string, string> = new Map();
    private socketLobbyMap: Map<string, string> = new Map();

    private constructor() { }
    private static instance: WebSocketService;
    
    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    /**
     * Инициализация через основной экземпляр Server
     */
    public initialize(io: SocketIOServer): void {
        this.io = io;
        // Создаем или получаем пространство имен /lobby
        this.lobbyNamespace = this.io.of('/lobby');

        this.lobbyNamespace.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });

        logger.info('WebSocket: Lobby namespace initialized (/lobby)');
    }

    private handleConnection(socket: Socket): void {
        logger.info(`[WS Lobby] Новое подключение: ${socket.id}`);

        socket.on('join_lobby', (data: ClientAuthData) => {
            const { userId, lobbyId } = data;
            
            this.userSocketMap.set(userId, socket.id);
            this.socketUserMap.set(socket.id, userId);
            this.socketLobbyMap.set(socket.id, lobbyId);
            
            socket.join(lobbyId);
    
            logger.debug(`[WS Lobby] Пользователь ${userId} присоединен к комнате ${lobbyId}`);
            this.sendToUser(userId, 'join_success', { lobbyId, message: 'Вы успешно присоединились к лобби.' });
        });

        socket.on('lobby_message', (data: { event: string, payload: any }) => {
            const userId = this.socketUserMap.get(socket.id);
            const lobbyId = this.socketLobbyMap.get(socket.id);

            if (!userId || !lobbyId || !this.lobbyNamespace) {
                logger.warn(`[WS Lobby] Сообщение отклонено: сокет ${socket.id} не в лобби.`);
                return;
            }

            const fullPayload = {
                senderId: userId,
                lobbyId: lobbyId,
                ...data.payload,
                timestamp: new Date().toISOString()
            };

            // Транслируем ТОЛЬКО внутри пространства имен /lobby
            this.lobbyNamespace.to(lobbyId).emit(data.event, fullPayload);
            logger.debug(`[WS Lobby: OUT] Событие '${data.event}' в лобби ${lobbyId}`);
        });

        socket.on('disconnect', async () => {
            const userId = this.socketUserMap.get(socket.id);
            const lobbyId = this.socketLobbyMap.get(socket.id);

            if (userId && lobbyId) {
                // Уведомляем остальных в лобби
                if (this.lobbyNamespace) {
                    this.lobbyNamespace.to(lobbyId).emit('player_disconnected', {
                        userId,
                        message: `Пользователь ${userId} покинул лобби.`
                    });
                }

                try {
                    await lobbyService.removePlayerFromLobby(lobbyId, userId);
                } catch (error) {
                    logger.error(`[WS Lobby] Ошибка удаления игрока: ${error}`);
                }

                this.userSocketMap.delete(userId);
                this.socketUserMap.delete(socket.id);
                this.socketLobbyMap.delete(socket.id);
            }
        });
    }

    /**
     * Отправляет сигнал о старте игры игрокам, находящимся в лобби
     */
    public sendGameStarted(lobbyId: string, gamePassword: string): void {
        if (this.lobbyNamespace) {
            logger.info(`[WS Lobby] Сигнал старта игры для лобби ${lobbyId}`);
            this.lobbyNamespace.to(lobbyId).emit('game_started', {
                gameId: lobbyId,
                password: gamePassword,
                message: 'Игра начинается! Используйте пароль для входа в /game'
            });
        }
    }

    public sendLobbyUpdate(lobbyId: string, payload: LobbyDetails): void {
        if (this.lobbyNamespace) {
            this.lobbyNamespace.to(lobbyId).emit('lobby_update', payload);
        }
    }

    public sendToUser(userId: string, event: string, payload: any): boolean {
        const socketId = this.userSocketMap.get(userId);
        if (socketId && this.lobbyNamespace) {
            this.lobbyNamespace.to(socketId).emit(event, payload);
            return true;
        }
        return false;
    }
}

export const wsService = WebSocketService.getInstance();