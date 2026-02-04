// src/routes/lobbies/create.tsx

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiLobby } from '@/services/apiLobby';
import { useState } from 'react';
import type { LobbyType } from '@/types/lobbyTypes'; // Импорт типа

// --- Компоненты shadcn/ui ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- ИСПРАВЛЕННАЯ СХЕМА ZOD ---
const createLobbySchema = z.object({
    name: z.string().min(3, {
        message: 'Название лобби должно содержать не менее 3 символов.',
    }).max(50, {
        message: 'Название лобби должно содержать не более 50 символов.',
    }),
    
    // Добавляем обязательное поле 'type'
    type: z.enum(['Casual', 'Ranked', 'Custom'] as [LobbyType, ...LobbyType[]]), 
    
    // Используем z.coerce.number() для прямого преобразования строки из Input в число
    maxPlayers: z.coerce.number().min(2, { message: 'Минимум 2 игрока.' }).max(10, { message: 'Максимум 10 игроков.' }),
    
    isPrivate: z.boolean().default(false),
    
    // Пароль опционален, трансформируем пустую строку в undefined
    password: z.string().optional().nullable().transform(val => (val?.trim() === "" ? undefined : val)), 
    
})
.superRefine((data, ctx) => {
    // Условная валидация: Пароль обязателен, если лобби приватное
    if (data.isPrivate && (!data.password || data.password.length < 4)) { 
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Пароль обязателен для приватного лобби (мин. 4 символа).',
            path: ['password'],
        });
    }
});


// Тип данных формы, выводимый из схемы Zod
type CreateLobbyFormValues = z.infer<typeof createLobbySchema>;

const defaultValues: CreateLobbyFormValues = {
    name: '',
    type: 'Casual',
    maxPlayers: 4,
    isPrivate: false,
    password: undefined,
};


export const Route = createFileRoute('/lobbies/create')({
    component: CreateLobbyPage,
});

/**
 * Страница создания нового лобби.
 */
function CreateLobbyPage() {
    const navigate = useNavigate({ from: '/lobbies/create' });
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CreateLobbyFormValues>({
        resolver: zodResolver(createLobbySchema),
        defaultValues,
        mode: "onChange",
    });

    const { isPrivate } = form.watch(); // Следим за значением isPrivate

    // Обработчик отправки формы
    const onSubmit = async (values: CreateLobbyFormValues) => {
        setIsSubmitting(true);
        
        // Данные для отправки. Пароль будет undefined, если isPrivate=false (благодаря Zod transform)
        const dataToSend = {
            ...values,
            // Обеспечиваем, что maxPlayers - число (хотя Zod coerce это уже сделал)
            maxPlayers: Number(values.maxPlayers), 
            // API требует password: string | undefined
            password: values.isPrivate ? values.password : undefined,
        };

        try {
            // Вызов API для создания лобби
            const newLobby = await apiLobby.create(dataToSend);
            
            toast({
                title: '✅ Лобби создано!',
                description: `Лобби "${newLobby.name}" успешно создано.`,
            });
            
            // Перенаправление на страницу созданного лобби
            navigate({ to: `/lobby/${newLobby.id}` }); 

        } catch (error: any) {
            const errorMessage = error.message || 'Произошла неизвестная ошибка при создании лобби.';

            toast({
                title: '❌ Ошибка создания лобби',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center items-start min-h-screen pt-12 ">
            <Card className="w-[450px]">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Создать Новое Лобби
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            {/* Поле Название Лобби */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Название Лобби</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Мое крутое лобби" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {/* Поле Тип Лобби (Select) */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Тип Лобби</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите тип игры" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Casual">Casual</SelectItem>
                                                <SelectItem value="Ranked">Ranked</SelectItem>
                                                <SelectItem value="Custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Поле Максимальное Количество Игроков */}
                            <FormField
                                control={form.control}
                                name="maxPlayers"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Макс. Игроков</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="4"
                                                min={3}
                                                max={4}
                                                {...field}
                                                // Важно: field.value должно быть строкой для Input, но мы передаем число, 
                                                // поэтому используем String() для совместимости, хотя Zod coerce это обрабатывает
                                                value={field.value.toString()} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Поле Приватное Лобби (Switch) */}
                            <FormField
                                control={form.control}
                                name="isPrivate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Приватное Лобби</FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                Если включено, потребуется пароль для входа.
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Поле Пароль (Отображается только для приватного лобби) */}
                            {isPrivate && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Пароль</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Мин. 4 символа" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            {/* Кнопка Создать */}
                            <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isValid}>
                                {isSubmitting ? 'Создание...' : 'Создать Лобби'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}