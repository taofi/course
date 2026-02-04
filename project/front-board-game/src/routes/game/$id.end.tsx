import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { UserCacheService } from '@/services/UserCacheService';
import type { IGameResult } from '@/types/gameResultTypes';
import type { UserDetails } from '@/services/apiUserLobbyWrapper';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Clock, Users } from "lucide-react";
import { resultApi } from '@/services/apiResult';
import { useAuth } from '@/contexts/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/game/$id/end')({
  component: GameEndComponent,
});

function GameEndComponent() {
  const { id: gameId } = Route.useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [result, setResult] = useState<IGameResult | null>(null);
  const [winnerName, setWinnerName] = useState<string>("Загрузка...");
  const [participants, setParticipants] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const cache = UserCacheService.getInstance();

  const formatDateTime = (dateString: Date | string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        // 1. Получаем результат игры
        const gameData = await resultApi.getResultById(gameId);
        setResult(gameData);

        // 2. Получаем детали победителя через кеш
        if (gameData.result) {
          const winner = await cache.getById(gameData.result);
          setWinnerName(winner.username);
        }

        // 3. Загружаем всех участников для отображения списка
        const users = await Promise.all(
          gameData.players.map(pid => cache.getById(pid))
        );
        setParticipants(users);
      } catch (error) {
        console.error("Ошибка при загрузке итогов игры:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchGameData();
    }
  }, [gameId, isAuthenticated]);

  // Редирект, если не авторизован
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  if (loading || authLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const isUserWinner = user?._id === result?.result;

  return (
    <div className="container mx-auto py-10 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Хедер с поздравлением */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900 dark:text-slate-50">
            Игра окончена
          </h1>
          <p className="text-xl text-muted-foreground">
            {isUserWinner ? "Поздравляем с победой!" : "Хорошая игра! В следующий раз повезет больше."}
          </p>
        </div>

        {/* Основная карточка результата */}
        <Card className={`border-2 ${isUserWinner ? 'border-yellow-400 shadow-yellow-100' : 'border-slate-200'}`}>
          <CardHeader className="text-center bg-slate-50/50 dark:bg-slate-900/50 border-b">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${isUserWinner ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600'}`}>
                <Trophy size={48} />
              </div>
            </div>
            <CardTitle className="text-2xl">Победитель</CardTitle>
            <CardDescription className="text-xl font-bold text-primary">
              {winnerName}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Calendar className="text-primary" />
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground">Начало и дата</p>
                <p className="font-medium">{result ? formatDateTime(result.start) : '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Clock className="text-primary" />
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground">Длительность</p>
                <p className="font-medium">
                  {result ? `${Math.round((new Date(result.end).getTime() - new Date(result.start).getTime()) / 60000)} мин.` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список участников */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users size={20} />
              Участники партии
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {participants.map((participant) => (
                <div key={participant.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {participant.username}
                      {participant.id === user?._id && <span className="ml-2 text-xs text-muted-foreground">(Вы)</span>}
                    </span>
                  </div>
                  {participant.id === result?.result && (
                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Победитель</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}