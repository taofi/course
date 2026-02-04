// src/routes/index.tsx

import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '../contexts/useAuth';

// Импорт компонентов Shadcn UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Импорт новых секций
import { HeroSection } from '@/components/HeroSection'; // Предполагаем, что вы создали этот файл
import { LobbyList } from '@/components/LobbyList'; // Предполагаем, что вы создали этот файл

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function AuthStatusCard({ isAuthenticated, user, isLoading }: ReturnType<typeof useAuth>) {
  let statusContent;
  let statusVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  let statusTitle = "Статус Героя";

  if (isLoading) {
    statusVariant = "secondary";
    statusTitle = "Загрузка...";
    statusContent = (
      <p className="text-sm">Ожидание ответа от Древнего Сервера...</p>
    );
  } else if (isAuthenticated && user) {
    statusVariant = "default";
    statusTitle = "Авторизация Успешна! ";
    statusContent = (
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <p className="font-semibold text-lg">
            Добро пожаловать, <span className="text-primary">{user.name || user.login}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            {user.email}
          </p>
          <Badge variant="default" className="bg-primary/80 hover:bg-primary">
            Готов к Приключениям
          </Badge>

        </div>
        <Link to="/lobbies/create">
          <Button>Создать лобби</Button>
        </Link>
      </div>

    );
  } else {
    statusVariant = "destructive";
    statusTitle = "Надо Войти";
    statusContent = (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Чтобы присоединиться к битве, войдите или зарегистрируйтесь.
        </p>
        <Link to="/auth/login">
          <Button>Войти</Button>
        </Link>
        <Link to="/auth/register">
          <Button variant="outline">Создать Персонажа</Button>
        </Link>
      </div>
    );
  }

  // Имитируем свиток или важный документ
  return (
    <Card className="border-l-4 border-l-primary/70 mb-8 shadow-md">
      <CardHeader className="py-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Badge variant={statusVariant} className="text-sm">
            {statusTitle}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {statusContent}
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  const authProps = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">

      {/* 1. HERO СЕКЦИЯ */}
      <HeroSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ЛЕВАЯ КОЛОНКА (Статус и Навигация) */}
        <div className="lg:col-span-1">
          {/* Статус Авторизации */}
          <AuthStatusCard {...authProps} />

          {/* Дополнительная Навигация (в стилистике "Карта") */}
          <Card className="mt-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Карта Приключений</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Link to="/cards">
                  <Button variant="outline" className="w-full justify-start text-lg border-primary/50 hover:bg-secondary">
                    Библиотека карточек
                  </Button>
                </Link>
                <Link to="/rules">
                  <Button variant="outline" className="w-full justify-start text-lg border-primary/50 hover:bg-secondary">
                    Справочник Правил
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ПРАВАЯ КОЛОНКА (Лобби) */}
        <div className="lg:col-span-2">
          {/* 3. СПИСОК ЛОББИ */}
          <LobbyList />
        </div>
      </div>
    </div>
  );
}