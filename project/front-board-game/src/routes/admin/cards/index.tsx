import { useState, useEffect } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { apiCards } from '@/services/apiCards'
import { GameCard } from '@/components/GameCard'
import type { ICardData, IDoorData } from '@munchkin/shared'

// Shadcn UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"

export const Route = createFileRoute('/admin/cards/')({
  beforeLoad: ({ context }) => {
    // Получаем данные о пользователе из контекста роутера
    const { user, isAuthenticated, isLoading } = context.auth

    // Если данные еще грузятся, ничего не делаем
    if (isLoading) return

    // Если не авторизован или роль не админ — редирект на главную
    if (!isAuthenticated || user?.role !== 'admin') {
      console.warn("Доступ запрещен: требуется роль администратора")
      throw redirect({
        to: '/',
      })
    }
  },
  component: RouteComponent,
})


function RouteComponent() {
  const [doors, setDoors] = useState<IDoorData[]>([])
  const [treasures, setTreasures] = useState<ICardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true)
        const [doorsData, treasuresData] = await Promise.all([
          apiCards.getAllDoors(),
          apiCards.getAllTreasures()
        ])
        setDoors(doorsData)
        setTreasures(treasuresData)
      } catch (error) {
        console.error("Ошибка при загрузке карточек:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Библиотека карточек</h1>
          <p className="text-muted-foreground">Управление всеми картами в базе данных</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/admin/cards/add"
              search={{ type: 'door' }}
            >
              <Plus className="mr-2 h-4 w-4" /> Добавить дверь
            </Link>
          </Button>

          <Button size="sm" asChild>
            <Link
              to="/admin/cards/add"
              search={{ type: 'treasure' }}
            >
              <Plus className="mr-2 h-4 w-4" /> Добавить сокровище
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="doors" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="doors">Двери ({doors.length})</TabsTrigger>
          <TabsTrigger value="treasures">Сокровища ({treasures.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="doors" className="mt-6">
        <div className="grid grid-cols-2 min-[500px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {doors.map((door) => (
              <Link 
                key={door._id} 
                to="/admin/cards/update/$id" 
                params={{ id: door._id }}
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <GameCard data={door} />
              </Link>
            ))}
            {doors.length === 0 && <EmptyState text="Дверей пока нет" />}
          </div>
        </TabsContent>

        <TabsContent value="treasures" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {treasures.map((treasure) => (
              <Link 
                key={treasure._id} 
                to="/admin/cards/update/$id" 
                params={{ id: treasure._id }}
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <GameCard data={treasure} />
              </Link>
            ))}
            {treasures.length === 0 && <EmptyState text="Сокровищ пока нет" />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}