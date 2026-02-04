// src/routes/auth.register.tsx (ИЗМЕНЕН)

import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
// Импортируем новый тип RegisterSuccessResponse
import type { RegisterRequest, ApiErrorResponse, RegisterSuccessResponse } from '@/types/authTypes'; 
import { useAuth } from '@/contexts/useAuth'; 

// Импорт компонентов Shadcn UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollText, ShieldAlert } from 'lucide-react'; 

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    login: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Ожидаем RegisterSuccessResponse
      const result: RegisterSuccessResponse = await register(formData);
      
      // Успех! Перенаправляем на страницу ввода кода верификации
      navigate({ 
        to: '/auth/verify', 
        search: { 
            login: result.user.login
        } 
      });

    } catch (err) {
      const apiError = err as ApiErrorResponse;
      const defaultError = 'Печати Проклятия! Регистрация не удалась. Возможно, это имя уже занято.';
      const errorMessage = apiError.error?.message || defaultError;
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 min-h-screen-auth">
      
      <Card className="w-full max-w-lg shadow-2xl border-primary/50">
        
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-heading text-primary tracking-wide flex justify-center items-center gap-2">
            <ScrollText className="w-6 h-6" /> Создание Нового Персонажа
          </CardTitle>
          <CardDescription className="text-muted-foreground italic">
            Заполните свиток, чтобы присоединиться к Гильдии и получить свой первый набор карт.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Поле "Имя и Фамилия" */}
            <div className="space-y-2">
              <Label htmlFor="name">Полное Имя (Персонаж/Игрок)</Label>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="Джон Доу"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Поле "Логин" */}
            <div className="space-y-2">
              <Label htmlFor="login">Имя Героя (Логин)</Label>
              <Input
                id="login"
                type="text"
                name="login"
                placeholder="Имя, которое увидят другие игроки"
                value={formData.login}
                onChange={handleChange}
                required
              />
            </div>

            {/* Поле "Email" */}
            <div className="space-y-2">
              <Label htmlFor="email">Магический Адрес (Email)</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Сюда придут важные послания"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Поле "Пароль" */}
            <div className="space-y-2">
              <Label htmlFor="password">Секретное Слово (Пароль)</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Секрет, который знают только вы"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Вывод ошибки */}
            {error && (
              <Alert variant="destructive" className="border-l-4 border-l-destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle className="font-heading">Препятствие на пути</AlertTitle>
                <AlertDescription className="font-sans">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Кнопка отправки */}
            <Button
              type="submit"
              className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.01]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Создание Персонажа...' : 'Завершить Создание Персонажа'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-0">
            <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                Уже есть персонаж? Войти
            </Link>
        </CardFooter>
      </Card>

    </div>
  );
}