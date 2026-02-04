// src/routes/admin/cards/add.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CardForm } from '@/components/CardForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

type CardSearch = {
  type: 'door' | 'treasure'
  fromId?: string 
}

export const Route = createFileRoute('/admin/cards/add')({
  validateSearch: (search: Record<string, unknown>): CardSearch => {
    return {
      type: (search.type as 'door' | 'treasure') || 'treasure',
      fromId: search.fromId as string | undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { type, fromId } = Route.useSearch()
  const navigate = useNavigate()

  return (
    <div className="container mx-auto py-6 space-y-4">
      {/* Кнопка назад */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate({ to: '/admin/cards' })} // Или history.back()
          className="gap-1 pl-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад к списку
        </Button>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-2">
          <CardTitle className="text-3xl font-bold">
            Конструктор: {type === 'door' ? 'Дверь' : 'Сокровище'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <CardForm initialMode={type} fromId={fromId} />
        </CardContent>
      </Card>
    </div>
  )
}