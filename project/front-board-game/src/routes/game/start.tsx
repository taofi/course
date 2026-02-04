import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/useAuth';
import { apiLobby } from '@/services/apiLobby';
import { useLobbies } from '@/hooks/useLobbies'; // Предполагаемый хук для получения списка
import { type LobbyType, LobbyStatus } from '@/types/lobbyTypes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sword, Trophy, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/game/start')({
  component: GameSearchComponent,
});

function GameSearchComponent() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { lobbies, isLoading: isLobbiesLoading } = useLobbies();

  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<LobbyType | null>(null);

  // 1. Проверка авторизации
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !user) {
      toast.error("Пожалуйста, войдите в систему");
      navigate({ to: '/auth/login' });
    }
  }, [isAuthenticated, isAuthLoading, navigate, user]);
  if(!user)
    {
      toast.error("Пожалуйста, войдите в систему");
      navigate({ to: '/auth/login' });
      return;
    }
  // Хелперы для отображения статуса
  const getStatusVariant = (status: LobbyStatus, currentPlayers: number, maxPlayers: number) => {
    if (status === LobbyStatus.IN_GAME) return 'outline';
    if (currentPlayers >= maxPlayers) return 'destructive';
    return 'default';
  };

  const getStatusText = (status: LobbyStatus, currentPlayers: number, maxPlayers: number) => {
    if (currentPlayers >= maxPlayers) return 'Полное';
    if (status === LobbyStatus.IN_GAME) return 'В игре';
    return 'В ожидании';
  };

  // Логика поиска или создания
  const handleStartSearch = async (type: LobbyType) => {
    setIsSearching(true);
    setSelectedType(type);
    
    try {
      // Ищем подходящее лобби: нужный тип, статус WAITING и есть места
      const suitableLobby = lobbies?.find(l => 
        l.type === type && 
        l.status === LobbyStatus.WAITING && 
        l.participants.length < l.maxPlayers &&
        !l.isPrivate
      );

      if (suitableLobby) {
        toast.success(`Найдено лобби ${type}! Подключение...`);
        navigate({ to: `/lobby/${suitableLobby.id}` });
      } else {
        // Если лобби нет, создаем новое
        toast.loading(`Свободных ${type} лобби нет. Создаем новое...`, { id: `search` });
        const newLobby = await apiLobby.create({
          type,
          name: `Lobby: ${type}${user._id}`,
          maxPlayers: 4,
          isPrivate: false
        });
        toast.dismiss('search');
        navigate({ to: `/lobby/${newLobby.id}` });
      }
    } catch (error) {
      toast.error("Ошибка при поиске игры");
      console.log(error);
      setIsSearching(false);
    }
  };

  if (isAuthLoading) return <div className="flex h-screen items-center justify-center">Загрузка...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Выбор режима игры</h1>
      </div>

      {!isSearching ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Casual Mode */}
          <Card 
            className="hover:border-primary transition-all cursor-pointer group relative overflow-hidden"
            onClick={() => handleStartSearch('Casual')}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <Sword className="h-10 w-10 text-blue-500 mb-2" />
                <Badge variant="secondary">Обычная</Badge>
              </div>
              <CardTitle className="text-2xl">Casual</CardTitle>
              <CardDescription>Расслабленная игра для удовольствия без потери рейтинга.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Активных лобби: {lobbies?.filter(l => l.type === 'Casual').length || 0}
              </div>
            </CardContent>
          </Card>

        </div>
      ) : (
        <Card className="border-primary shadow-lg bg-primary/5">
          <CardContent className="py-12 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold italic tracking-wider uppercase">Поиск {selectedType} игры...</h2>
              <p className="text-muted-foreground">Подбираем подходящих оппонентов</p>
            </div>
            <div className="w-full max-w-xs">
              <Progress value={66} className="h-2" />
            </div>
            <Button variant="outline" onClick={() => setIsSearching(false)}>
              Отменить поиск
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Список текущих лобби (опционально для наглядности) */}
      <div className="pt-8">
        <h3 className="text-lg font-semibold mb-4">Активные сессии</h3>
        <div className="grid gap-2">
          {isLobbiesLoading ? <p>Обновление списка...</p> : lobbies?.slice(0, 5).map(l => (
            <div key={l.id} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{l.type}</Badge>
                <span className="text-sm font-medium">#{l.id.slice(-4)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {l.participants.length} / {l.maxPlayers}
                </span>
                <Badge variant={getStatusVariant(l.status, l.participants.length, l.maxPlayers)}>
                  {getStatusText(l.status, l.participants.length, l.maxPlayers)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}