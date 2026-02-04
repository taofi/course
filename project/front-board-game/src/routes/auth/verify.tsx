// src/routes/auth.verify-email.tsx

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/useAuth'; // Предполагаем, что resendVerificationCode есть в useAuth
import type { ApiErrorResponse } from '@/types/authTypes';

// Импорт компонентов Shadcn UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailOpen, ShieldAlert, CheckCircle, RotateCw } from 'lucide-react';


export const Route = createFileRoute('/auth/verify')({
    component: VerifyEmailPage,
    validateSearch: (search: Record<string, unknown>): { login: string;  } => {
        if (typeof search.login !== 'string' ) {
            throw new Error('Необходимы логин и email для верификации');
        }
        return search as { login: string; };
    },
})

function VerifyEmailPage() {
    const { login } = Route.useSearch();

    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- НОВЫЕ СОСТОЯНИЯ ДЛЯ ПОВТОРНОЙ ОТПРАВКИ ---
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    // Предполагаем, что useAuth предоставляет обе функции
    const { verifyEmail, resendVerificationCode } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Ограничение ввода 6 цифрами
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setResendMessage(null); // Очищаем сообщение о повторной отправке при попытке верификации
        setIsSubmitting(true);

        try {
            if (code.length !== 6) {
                setError('Код должен состоять из 6 цифр.');
                return;
            }

            // Вызов метода верификации из контекста
            await verifyEmail({ login, code });

            // Успех! Перенаправляем на Панель Героя.
            navigate({ to: '/profile' });

        } catch (err) {
            const apiError = err as ApiErrorResponse;
            const defaultError = 'Неверный код или истек срок действия.';
            const errorMessage = apiError.error?.message || defaultError;
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ПОВТОРНОЙ ОТПРАВКИ ---
    const handleResend = async () => {
        setError(null);
        setResendMessage(null);
        setIsResending(true);

        try {
            const result = await resendVerificationCode({ login });

            setResendMessage(result.message || 'Новый код подтверждения успешно отправлен!');
        } catch (err) {
            const apiError = err as ApiErrorResponse;
            const errorMessage = apiError.error?.message || 'Не удалось повторно отправить код. Попробуйте позже.';
            setError(errorMessage);
        } finally {
            setIsResending(false);
        }
    };


    return (
        <div className="flex justify-center items-center py-12 px-4 min-h-screen-auth">
            <Card className="w-full max-w-lg shadow-2xl border-green-500/50">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-heading text-green-600 tracking-wide flex justify-center items-center gap-2">
                        <MailOpen className="w-6 h-6" /> Подтверждение Магического Адреса
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Мы отправили 6-значный код подтверждения на почту. Введите код ниже, чтобы завершить регистрацию.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="code">Код Подтверждения</Label>
                            <Input
                                id="code"
                                type="text"
                                name="code"
                                placeholder="Введите 6-значный код"
                                value={code}
                                onChange={handleChange}
                                required
                                maxLength={6}
                                className="text-center text-xl font-mono tracking-widest"
                            />
                        </div>

                        {/* Вывод ошибки верификации */}
                        {error && (
                            <Alert variant="destructive" className="border-l-4 border-l-destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle className="font-heading">Ошибка Верификации</AlertTitle>
                                <AlertDescription className="font-sans">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Вывод сообщения об успешной повторной отправке */}
                        {resendMessage && (
                            <Alert className="border-l-4 border-l-green-500">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle>Успешно</AlertTitle>
                                <AlertDescription>
                                    {resendMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Кнопка отправки */}
                        <Button
                            type="submit"
                            className="w-full py-6 text-lg font-semibold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-[1.01] bg-green-600 hover:bg-green-700"
                            disabled={isSubmitting || code.length !== 6 || isResending}
                        >
                            {isSubmitting ? 'Проверка кода...' : 'Подтвердить и Войти'}
                            {!isSubmitting && <CheckCircle className='w-5 h-5 ml-2' />}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center pt-0">
                    <p className="text-sm text-muted-foreground">
                        Не получили код? Проверьте спам или
                        {/* Кнопка повторной отправки */}
                        <Button
                            variant="link"
                            type="button"
                            onClick={handleResend}
                            disabled={isSubmitting || isResending}
                            className="p-0 h-auto text-primary hover:text-primary/80 disabled:opacity-50"
                        >
                            {isResending ? (
                                <span className='flex items-center'>
                                    <RotateCw className="w-4 h-4 mr-1 animate-spin" /> Повторная отправка...
                                </span>
                            ) : (
                                'повторите отправку'
                            )}
                        </Button>
                        .
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}