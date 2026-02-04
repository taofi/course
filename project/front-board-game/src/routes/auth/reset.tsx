import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { forgotPassword } from '@/services/apiAuth';

export const Route = createFileRoute('/auth/reset')({
  component: ResetRequestPage,
});

function ResetRequestPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
      // Успех! Переходим к вводу кода
      navigate({ to: '/auth/confirm-reset', search: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось отправить вестника на эту почту.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 min-h-screen-auth">
      <Card className="w-full max-w-md shadow-2xl border-primary/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-heading text-primary tracking-wide">
            Восстановление
          </CardTitle>
          <CardDescription className="text-muted-foreground italic">
            Укажите вашу магическую почту, и мы пришлем свиток для восстановления доступа.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Ваша Почта</Label>
              <Input
                id="email"
                type="email"
                placeholder="hero@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-l-4 border-l-destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/30 transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправляем Вестника...' : 'Получить Свиток'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Вспомнили слово? Вернуться назад
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}