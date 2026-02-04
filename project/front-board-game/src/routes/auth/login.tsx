// src/routes/auth.login.tsx

import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import type { LoginRequest, ApiErrorResponse } from '@/types/authTypes';

// Импорт компонентов Shadcn UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';

const VERIFICATION_REQUIRED_MESSAGE = "Требуется подтверждение Email. Проверьте ваш почтовый ящик.";

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

function LoginPage() {
  const [formData, setFormData] = useState<LoginRequest>({
    login: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(formData); // Вызываем логин

      // Успех! Перенаправляем на Панель Героя
      navigate({ to: '/profile' });
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      const defaultError = 'Проклятие! Неверное имя Героя или секретное слово.';
      const errorMessage = apiError.error?.message || defaultError;
      console.log(errorMessage);
      // --- ДОБАВЛЕННАЯ ЛОГИКА ОБРАБОТКИ ОШИБКИ ВЕРИФИКАЦИИ ---
      if (errorMessage.includes(VERIFICATION_REQUIRED_MESSAGE)) {

        if (formData.login) {
          // Перенаправляем на страницу верификации, передавая логин и email
          navigate({
            to: '/auth/verify',
            search: { login: formData.login }
          });
          return; // Прерываем выполнение, чтобы избежать установки общей ошибки
        }
        // Если email не удалось извлечь, покажем пользователю общее сообщение с инструкцией.
      }
      // -------------------------------------------------------------

      // Если это другая ошибка или email не был предоставлен в ошибке, показываем Alert
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 min-h-screen-auth">
      <Card className="w-full max-w-md shadow-2xl border-primary/50">

        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-heading text-primary tracking-wide">
            Вход
          </CardTitle>
          <CardDescription className="text-muted-foreground italic">
            Введите ваше имя Героя и секретное слово, чтобы начать приключение.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Поле "Логин" */}
            <div className="space-y-2">
              <Label htmlFor="login">Имя Героя (Логин)</Label>
              <Input
                id="login"
                type="text"
                name="login"
                placeholder="Ваш никнейм или логин"
                value={formData.login}
                onChange={handleChange}
                required
              />
            </div>

            {/* Поле "Пароль" */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Секретное Слово (Пароль)</Label>
                <Link
                  to="/auth/reset"
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Забыли слово?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Не менее 6 символов"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Вывод ошибки (используем компонент Alert) */}
            {error && (
              <Alert variant="destructive" className="border-l-4 border-l-destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle className="font-heading">Ошибка Аутентификации</AlertTitle>
                <AlertDescription className="font-sans">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Кнопка отправки (стилизована золотым) */}
            <Button
              type="submit"
              className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.01]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Открываем Врата...' : 'Войти и Начать Поход'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center flex-col pt-0">
          <Link to="/auth/register" className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
            Нет персонажа? Создать нового
          </Link>
        </CardFooter>
      </Card>

    </div>
  );
}