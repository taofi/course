import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Layers, Gamepad2, LayoutDashboard } from "lucide-react"

export const Route = createFileRoute('/admin/')({
  // 1. ЗАЩИТА МАРШРУТА
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
  
  // 2. КОМПОНЕНТ СТРАНИЦЫ
  component: AdminMenu,
})

function AdminMenu() {
  const adminLinks = [
    {
      title: "Карточки",
      description: "Управление библиотекой дверей и сокровищ",
      href: "/admin/cards",
      icon: <Layers className="mr-2 h-4 w-4" />,
    },
    {
      title: "Пользователи",
      description: "Список игроков и управление ролями",
      href: "/admin/users",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
    {
      title: "Игры",
      description: "Мониторинг активных игровых сессий",
      href: "/admin/games",
      icon: <Gamepad2 className="mr-2 h-4 w-4" />,
    },
  ]

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-8">
        <LayoutDashboard className="mr-2 h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Панель администратора</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((link) => (
          <Card key={link.href} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                {link.icon}
                {link.title}
              </CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                {/* Важно: используем `to` как строку или объект. 
                  Если пути уже сгенерированы в routeTree, TS подскажет путь.
                */}
                <Link to={link.href as any}>Перейти в раздел</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}