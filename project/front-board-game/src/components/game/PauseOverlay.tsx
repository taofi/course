// components/game/PauseOverlay.tsx
import { useEffect, useState } from 'react'
import { type IPlayerStats, PlayerActivity, GameStatus } from '@munchkin/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import { userCacheService } from '@/services/UserCacheService' //

interface PauseOverlayProps {
  status: GameStatus | undefined
  opponents: Record<string, IPlayerStats>
  me: IPlayerStats | null
}

export function PauseOverlay({ status, opponents, me }: PauseOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(120)
  // Состояние для хранения имен: { "userId": "Username" }
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({})

  // 1. Хук таймера
  useEffect(() => {
    if (status !== GameStatus.PAUSED) {
      if (secondsLeft !== 120) setSecondsLeft(120)
      return
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  // 2. Логика вычислений отсутствующих
  const offlinePlayers = Object.values(opponents).filter(
    (p) => p.activity === PlayerActivity.OFFLINE
  )
  
  if (me?.activity === PlayerActivity.OFFLINE) {
    offlinePlayers.push(me)
  }

  // 3. Хук для загрузки имен через UserCacheService
  useEffect(() => {
    if (status === GameStatus.PAUSED && offlinePlayers.length > 0) {
      const fetchNames = async () => {
        const nameMap: Record<string, string> = { ...playerNames }
        let changed = false

        for (const player of offlinePlayers) {
          if (!nameMap[player.id]) {
            try {
              // Используем сервис для получения деталей пользователя
              const details = await userCacheService.getById(player.id)
              nameMap[player.id] = details.username
              changed = true
            } catch (error) {
              nameMap[player.id] = `ID: ${player.id.slice(-4)}`
              changed = true
            }
          }
        }

        if (changed) setPlayerNames(nameMap)
      }

      fetchNames()
    }
  }, [offlinePlayers.length, status])

  const hasOfflinePlayers = offlinePlayers.length > 0

  if (status !== GameStatus.PAUSED) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl transition-all animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-destructive/50 shadow-2xl shadow-destructive/10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight uppercase">Игра приостановлена</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ожидание возвращения участников
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground text-center tracking-widest">
              Отсутствуют:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {hasOfflinePlayers ? (
                offlinePlayers.map((player) => (
                  <div 
                    key={player.id} 
                    className="px-4 py-1.5 bg-destructive/10 text-destructive rounded-md text-sm font-bold border border-destructive/20 shadow-sm"
                  >
                    {/* Выводим имя из кэша, если оно загрузилось, иначе ID */}
                    {playerNames[player.id] || `Загрузка...`}
                  </div>
                ))
              ) : (
                <span className="text-sm italic text-muted-foreground">Загрузка списка...</span>
              )}
            </div>
          </div>

          <div className="bg-muted/50 border rounded-xl p-6 text-center shadow-inner">
            <div className="text-5xl font-mono font-black text-foreground tracking-tighter">
              {formatTime(secondsLeft)}
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2">
              До авто-исключения и продолжения
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 py-2 text-xs font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="animate-pulse">Ожидание восстановления соединения...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}