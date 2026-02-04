// src/components/LobbyList.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Loader2, Lock } from 'lucide-react'; 
import { LobbyStatus } from '@/types/lobbyTypes'; 
import { useLobbies } from '@/hooks/useLobbies';

const getStatusVariant = (status: LobbyStatus, currentPlayers: number, maxPlayers: number): "outline" | "destructive" | "default" | "secondary" => {
    if (status === LobbyStatus.IN_GAME) return 'outline';
    if (currentPlayers >= maxPlayers) return 'destructive';
    return 'default'; 
};

const getStatusText = (status: LobbyStatus, currentPlayers: number, maxPlayers: number) => {
    if (currentPlayers >= maxPlayers) return 'Полное';
    if (status === LobbyStatus.IN_GAME) return 'В игре';
    return 'В ожидании'; 
};

export function LobbyList() {
    const { lobbies, isLoading, error } = useLobbies();

    if (isLoading) {
        return (
            <div className="mt-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Загрузка лобби...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-12 text-center text-destructive">
                <p>Ошибка загрузки: {error}</p>
            </div>
        );
    }
    
    if (lobbies.length === 0) {
        return (
            <div className="mt-12 text-center">
                 <p className="text-xl font-semibold text-muted-foreground">
                    Нет активных лобби. Будьте первым!
                 </p>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <h2 className="text-3xl font-bold tracking-tight mb-8 text-foreground px-1">
                Открытые Лобби
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lobbies.map((lobby) => {
                    const currentPlayers = lobby.participants.length;
                    const isFull = currentPlayers >= lobby.maxPlayers;
                    const isInGame = lobby.status === LobbyStatus.IN_GAME;
                    const statusText = getStatusText(lobby.status, currentPlayers, lobby.maxPlayers);

                    return (
                        <Card key={lobby.id} className={`flex flex-col hover:shadow-md transition-all border-muted/60 ${isFull || isInGame ? 'bg-muted/30' : ''}`}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                                <div className="space-y-1 pr-2 overflow-hidden">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 truncate">
                                        {lobby.isPrivate && <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
                                        <span className="truncate">{lobby.name || `Лобби #${lobby.id.slice(0, 4)}`}</span>
                                    </CardTitle>
                                    {/* Тип лобби мелким шрифтом под названием */}
                                    <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                                        {lobby.type}
                                    </p>
                                </div>
                                
                                <Badge 
                                    variant={getStatusVariant(lobby.status, currentPlayers, lobby.maxPlayers)}
                                    className="shrink-0 whitespace-nowrap"
                                >
                                    {statusText}
                                </Badge>
                            </CardHeader>

                            <CardContent className="mt-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-muted-foreground italic">Заполненность</span>
                                    <span className="text-sm font-semibold">
                                        {currentPlayers} <span className="text-muted-foreground/60">/</span> {lobby.maxPlayers}
                                    </span>
                                </div>

                                <Link to={!isFull && !isInGame ? `/lobby/${lobby.id}` : '#'}>
                                    <Button 
                                        disabled={isFull || isInGame} 
                                        className="w-full font-bold"
                                        variant={(isFull || isInGame) ? 'secondary' : 'default'}
                                    >
                                        {isFull ? 'Мест нет' : isInGame ? 'Уже в игре' : 'Присоединиться'}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}