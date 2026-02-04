import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/useAuth';
import { UserAvatar } from '@/components/UserAvatar';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { resultApi } from '@/services/apiResult';
import type { IGameResult } from '@/types/gameResultTypes';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, ShieldCheck, Trophy, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/profile/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout, setUser } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Состояния для данных игр
  const [games, setGames] = useState<IGameResult[]>([]);
  const [isGamesLoading, setIsGamesLoading] = useState(true);

  // Загрузка истории игр пользователя
  useEffect(() => {
    const fetchHistory = async () => {
      if (user?._id) {
        try {
          const history = await resultApi.getResultsByPlayer(user._id);
          // Сортируем по дате (сначала новые)
          setGames(history.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime()));
        } catch (error) {
          console.error("Ошибка при загрузке истории:", error);
        } finally {
          setIsGamesLoading(false);
        }
      }
    };

    if (isAuthenticated) fetchHistory();
  }, [user?._id, isAuthenticated]);

  // Расчет статистики на лету
  const stats = useMemo(() => {
    const totalGames = games.length;
    const wins = games.filter(g => g.result === user?._id).length;
    return { totalGames, wins };
  }, [games, user?._id]);

  const handleEditSuccess = (updatedUser: any) => {
    if (setUser) setUser(updatedUser);
    else window.location.reload();
  };

  if (isAuthLoading) {
    return <div className="p-8 text-center text-lg">Загрузка профиля...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Доступ запрещен</h1>
        <p className="text-muted-foreground">Пожалуйста, войдите в систему.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* 1. Блок Заголовка */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 border-b pb-6">
        <UserAvatar
          imageUrl={user.avatar}
          username={user.name}
          className="w-24 h-24 border-2"
          isEditable={true}
        />

        <div className="flex flex-col items-center sm:items-start flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{user.name || 'Игрок'}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">@{user.login}</p>
          {user.role === 'admin' && (
             <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200">
               Администратор
             </Badge>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {user.role === 'admin' && (
            <Button asChild variant="outline">
              <Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" />Админка</Link>
            </Button>
          )}
          <Button onClick={logout} variant="destructive">Выйти</Button>
        </div>
      </div>

      {/* 2. Блок Статистики */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" /> Игровая статистика
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatBlock title="Всего побед" value={stats.wins} loading={isGamesLoading} />
          <StatBlock title="Количество игр" value={stats.totalGames} loading={isGamesLoading} />
        </div>
      </section>

      <Separator />

      {/* 3. Список результатов игр */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> История последних игр
        </h2>
        <div className="border rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm">
          {isGamesLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : games.length > 0 ? (
            <div className="divide-y">
              {games.slice(0, 10).map((game) => (
                <GameResultRow 
                  key={game.id} 
                  game={game} 
                  currentUserId={user._id} 
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Вы еще не сыграли ни одной игры
            </div>
          )}
        </div>
      </section>

      <EditProfileDialog
        user={user}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

// Вспомогательный компонент статистики
const StatBlock = ({ title, value, loading }: { title: string; value: number; loading: boolean }) => (
  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border flex flex-col items-center justify-center">
    {loading ? <Skeleton className="h-9 w-12 mb-1" /> : <div className="text-3xl font-bold text-primary">{value}</div>}
    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</div>
  </div>
);

// Вспомогательный компонент строки игры
const GameResultRow = ({ game, currentUserId }: { game: IGameResult, currentUserId: string }) => {
  const isWinner = game.result === currentUserId;
  const gameDate = new Date(game.end).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Link 
      to="/game/$id/end" 
      params={{ id: game.id }}
      className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
    >
      <div className="flex flex-col">
        <span className="font-semibold group-hover:text-primary transition-colors">Манчкин Партия</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase ${isWinner ? 'text-green-500' : 'text-red-400'}`}>
            {isWinner ? 'Победа' : 'Поражение'}
          </span>
          <span className="text-xs text-muted-foreground">• {game.players.length} игроков</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{gameDate}</div>
        <div className="text-xs text-muted-foreground italic">Нажми для деталей</div>
      </div>
    </Link>
  );
};