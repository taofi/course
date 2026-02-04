// src/routes/test/game.$id.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useGameLoop } from '@/hooks/useGameLoop';
import { PlayerActionType } from '@munchkin/shared';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute('/test/game/$id')({
  component: GameTestPage,
});

function GameTestPage() {
  const { id } = Route.useParams();
  
  // Извлекаем обновленные данные из хука
  const { 
    isConnected, 
    gameState, // Добавили инвентарь (приватные данные игрока)
    logs, 
    sendAction 
  } = useGameLoop(id);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Game Session</h1>
          <code className="bg-muted px-2 py-1 rounded text-sm">{id}</code>
        </div>
        <Badge variant={isConnected ? "default" : "destructive"} className="px-3 py-1">
          {isConnected ? "● Connected" : "○ Offline"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Глобальное состояние игры */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Server State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phase:</span>
              <Badge variant="outline" className="capitalize">{gameState?.phase || 'initial'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turn:</span>
              <span className="font-mono">{gameState?.turnNumber || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active ID:</span>
              <span className="text-xs truncate max-w-[100px] font-mono" title={gameState?.currentPlayerId}>
                {gameState?.currentPlayerId || '—'}
              </span>
            </div>
          </CardContent>
        </Card>


      {/* 3. Панель действий */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button 
            disabled={!isConnected}
            onClick={() => sendAction({ name: PlayerActionType.OpenDoor, params: {} })}
          >
            Kick Open The Door
          </Button>
          
          <Button 
            variant="secondary"
            disabled={!isConnected}
            onClick={() => sendAction({ name: PlayerActionType.EndTurn, params: {} })}
          >
            End My Turn
          </Button>

          <Button 
            variant="destructive"
            disabled={!isConnected}
            onClick={() => sendAction({ name: PlayerActionType.Run, params: {} })}
          >
            Run Away!
          </Button>
        </CardContent>
      </Card>

        {/* 5. Лог событий */}
        <Card>
          <CardHeader>
            <CardTitle>Game Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] rounded-md border bg-zinc-950 p-4 font-mono text-[11px]">
              {logs.length === 0 && <span className="text-zinc-500 italic">Waiting for actions...</span>}
              {logs.map((log, i) => (
                <div key={i} className="mb-2 flex gap-2 border-b border-zinc-800 pb-1 last:border-0">
                  <span className="text-zinc-500 whitespace-nowrap">
                    [{new Date().toLocaleTimeString([], { hour12: false })}]
                  </span>
                  <span className={
                    log.type === 'danger' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-emerald-400' : 
                    'text-sky-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}