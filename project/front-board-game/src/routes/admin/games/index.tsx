import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { adminApi } from '@/services/apiAdmin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayCircle, Users, Clock, Eye, Activity, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";

export const Route = createFileRoute('/admin/games/')({
  component: AdminGamesComponent,
})

function AdminGamesComponent() {
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.games.getAllActive();
      setGames(data || []);
    } catch (error) {
      toast.error("Не удалось загрузить список игр");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Получение данных из Redis...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Активные сессии</h1>
          <p className="text-muted-foreground">Мониторинг игр в реальном времени (Redis)</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="h-8 px-3 text-sm">
            <Activity className="mr-2 h-3 w-3 text-green-500" />
            Всего игр: {games.length}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchGames}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Обновить
          </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">ID Сессии / Время запуска</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Игроки</TableHead>
              <TableHead>Текущий ход</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.length > 0 ? (
              games.map((game) => (
                <TableRow key={game.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-primary font-bold">{game.id}</span>
                      <span className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(game.time).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className="capitalize"
                      variant={game.status === 'playing' ? 'default' : 'secondary'}
                    >
                      {game.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {game.participantsId.map((pId: string) => (
                          <div 
                            key={pId} 
                            className="h-7 w-7 rounded-full border-2 border-background bg-slate-200 flex items-center justify-center text-[10px] font-bold"
                            title={pId}
                          >
                            {pId.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-medium ml-1">
                        {game.participantsId.length}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <PlayCircle className="h-4 w-4 text-amber-500" />
                      Игрок #{game.currentPlayerIndex + 1}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/games/$gameId" params={{ gameId: game.id }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Подробнее
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  В данный момент активных игр не обнаружено
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}