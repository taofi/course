import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { confirmResetPassword } from '@/services/apiAuth';

type SearchParams = { email?: string };

export const Route = createFileRoute('/auth/confirm-reset')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    email: search.email as string,
  }),
  component: ConfirmResetPage,
});

function ConfirmResetPage() {
  const { email } = Route.useSearch();
  const [formData, setFormData] = useState({
    email: email || '',
    code: '',
    newPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await confirmResetPassword(formData);
      navigate({ to: '/auth/login' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Древняя магия не сработала. Проверьте код.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 min-h-screen-auth">
      <Card className="w-full max-w-md shadow-2xl border-primary/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-heading text-primary tracking-wide">
            Новое Слово
          </CardTitle>
          <CardDescription className="text-muted-foreground italic">
            Введите код из свитка и придумайте новое секретное слово.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Код Восстановления</Label>
              <Input
                id="code"
                placeholder="6-значный код"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новое Секретное Слово</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Минимум 6 знаков"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-l-4 border-l-destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Ошибка Сброса</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/30"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Обряд Смены...' : 'Сменить и Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}