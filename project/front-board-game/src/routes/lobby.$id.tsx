import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/useAuth';
import { useLobbyWebSocket } from '@/hooks/useLobbyWebSocket';
import { apiLobby } from '@/services/apiLobby';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import { SendHorizontal, Crown, CheckCircle2, Clock, Lock, UserMinus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ApiErrorResponse } from '@/types/authTypes';
import { gameApi } from '@/services/apiGame';

export const Route = createFileRoute('/lobby/$id')({
    component: RouteComponent,
    loader: ({ params }) => params.id,
});

function RouteComponent() {
    const navigate = useNavigate();
    const { id: lobbyId } = Route.useParams();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const userId = user?._id || (user as any)?.id;

    const [password, setPassword] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [isCheckingAccess, setIsCheckingAccess] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        lobby,
        isConnected,
        chatMessages,
        sendChatMessage
    } = useLobbyWebSocket(userId, lobbyId);

    // --- Логика удаления лобби ---
    const handleDeleteLobby = async () => {
        try {
            await apiLobby.delete(lobbyId);
            toast.success('Лобби удалено');
            navigate({ to: '/' });
        } catch (e) {
            toast.error('Не удалось удалить лобби');
        }
    };

    // --- Логика кика игрока ---
    const handleKickPlayer = async (targetUserId: string, username: string) => {
        try {
            await apiLobby.kickPlayer(lobbyId, targetUserId);
            toast.success(`Игрок ${username} исключен`);
        } catch (e) {
            toast.error('Ошибка при исключении игрока');
        }
    };

    const handleJoin = async (pass?: string) => {
        try {
            setJoinError(null);
            await apiLobby.join(lobbyId, { password: pass });
        } catch (e: any) {
            const apiError = e as ApiErrorResponse;
            if (apiError?.error) {
                const { statusCode, message } = apiError.error;
                if (statusCode === 404) {
                    toast.error('Лобби не найдено');
                    navigate({ to: '/' });
                    return;
                }
                if (statusCode === 401 || statusCode === 403) {
                    setJoinError(message);
                } else {
                    toast.error(message || 'Произошла ошибка при входе');
                }
            } else {
                toast.error('Ошибка сети или сервера');
            }
        } finally {
            setIsCheckingAccess(false);
        }
    };


    const handleStartGame = async () => {
       
        try {
            await gameApi.startGame(lobbyId);
        } catch (err) {
            // Приведение типа к вашему интерфейсу ошибок
            const apiError = err as ApiErrorResponse;

            const errorMessage = apiError.error?.message || "Не удалось запустить игру";
            const statusCode = apiError.error?.statusCode;

            console.error(`[StartGame Error] Status: ${statusCode}, Message: ${errorMessage}`);

            // Вывод ошибки пользователю
            toast.error(errorMessage);
        } 
    };

    useEffect(() => {
        if (isAuthenticated && !lobby && !isAuthLoading) {
            handleJoin();
        }
    }, [isAuthenticated, lobbyId, isAuthLoading]);

    const isCreator = useMemo(() => lobby?.creatorId === userId, [lobby, userId]);
    const isAllReady = useMemo(() => lobby?.participants.every(p => p.isReady) ?? false, [lobby]);
    const currentUserParticipant = useMemo(() => lobby?.participants.find(p => p.id === userId), [lobby, userId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);
    if (!isAuthenticated || !user) return <div className="p-8 text-center text-destructive">Войдите в систему.</div>;

    if (isAuthLoading || isCheckingAccess) {
        return <div className="flex h-screen items-center justify-center text-muted-foreground animate-pulse">Проверка доступа...</div>;
    }


    if (!lobby) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-primary/20">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-2">
                            <Lock className="h-10 w-10 text-primary/80" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Приватное лобби</CardTitle>
                        <CardDescription>Введите пароль для входа в эту игровую сессию</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {joinError && (
                            <div className="text-destructive-foreground bg-destructive/15 p-3 rounded-md text-sm border border-destructive/20 text-center">
                                {joinError}
                            </div>
                        )}
                        <Input
                            type="password"
                            placeholder="Пароль доступа"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin(password)}
                        />
                        <Button className="w-full font-bold" onClick={() => handleJoin(password)}>
                            Присоединиться
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border p-6 rounded-xl shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        Лобби #{lobbyId.slice(-6).toUpperCase()}
                        {lobby.isPrivate && <Lock className="h-5 w-5 text-muted-foreground" title="Приватное" />}
                    </h1>
                    <div className="flex gap-2 items-center">
                        <Badge variant={isConnected ? "secondary" : "destructive"} className="flex gap-1 items-center px-2 py-0">
                            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {isConnected ? "В сети" : "Разрыв"}
                        </Badge>
                        <Badge variant="outline" className="font-mono">{lobby.type}</Badge>
                    </div>
                </div>

                {/* Кнопка удаления для создателя */}
                {isCreator && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                                <Trash2 className="h-4 w-4" /> Удалить лобби
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Это действие полностью удалит лобби и исключит всех игроков.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteLobby} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Удалить
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <div className="grid md:grid-cols-12 gap-6">
                <Card className="md:col-span-4 h-fit border-muted shadow-md">
                    <CardHeader className="pb-3 border-b bg-muted/30">
                        <CardTitle className="text-lg flex justify-between items-center">
                            Игроки
                            <span className="text-sm font-normal text-muted-foreground">
                                {lobby.participants.length} / {lobby.maxPlayers}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[350px] p-4">
                            <div className="space-y-2">
                                {lobby.participants.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-accent/40 rounded-lg border border-transparent hover:border-accent transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{p.username}</span>
                                            {p.id === lobby.creatorId && <Crown className="h-3 w-3 text-amber-500" />}

                                            {/* Кнопка кика: видна только создателю и только напротив других игроков */}
                                            {isCreator && p.id !== userId && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                                                            <UserMinus className="h-4 w-4" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Исключить игрока?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Вы действительно хотите исключить <strong>{p.username}</strong> из лобби?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleKickPlayer(p.id, p.username)}>
                                                                Исключить
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                        {p.isReady ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Готов
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="gap-1 opacity-70">
                                                <Clock className="h-3 w-3" /> Ждет
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Separator />
                        <div className="p-4 space-y-3 bg-muted/10">
                            <Button
                                variant={currentUserParticipant?.isReady ? "outline" : "default"}
                                className="w-full font-bold h-12"
                                onClick={async () => await apiLobby.setReadyStatus(lobby.id, { isReady: !currentUserParticipant?.isReady })}
                            >
                                {currentUserParticipant?.isReady ? "Отменить готовность" : "Я готов"}
                            </Button>

                            {isCreator && (
                                <Button
                                    className={`w-full font-bold h-12 shadow-lg transition-all ${isAllReady
                                        ? "bg-indigo-600 hover:bg-indigo-700"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                        }`}
                                    disabled={!isAllReady}
                                    onClick={() => handleStartGame()}
                                >
                                    {isAllReady ? "НАЧАТЬ ИГРУ" : "ОЖИДАНИЕ ИГРОКОВ"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Chat Column */}
                <Card className="md:col-span-8 flex flex-col h-[600px] border-muted shadow-md overflow-hidden">
                    <CardHeader className="py-4 border-b bg-muted/30">
                        <CardTitle className="text-lg">Чат группы</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-grow p-6">
                            <div ref={scrollRef} className="space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}>
                                        <div className="flex gap-2 text-[10px] text-muted-foreground mb-1 px-1">
                                            <span className="font-bold">{msg.senderName}</span>
                                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl text-sm max-w-[75%] shadow-sm ${msg.senderId === userId
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-accent text-accent-foreground rounded-tl-none border'
                                            }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Separator />
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (chatInput.trim() && isConnected) {
                                    sendChatMessage(chatInput.trim());
                                    setChatInput('');
                                }
                            }}
                            className="p-4 bg-background flex gap-2 items-center"
                        >
                            <Input
                                placeholder="Напишите сообщение..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                className="flex-grow bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <Button type="submit" size="icon" className="shrink-0" disabled={!chatInput.trim() || !isConnected}>
                                <SendHorizontal className="h-5 w-5" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}