// src/components/AvatarChangeModal.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiUser } from '@/services/apiUser';
import { UserAvatar } from './UserAvatar';
import { Loader2, Upload } from 'lucide-react';

interface AvatarChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Эта функция будет вызываться, чтобы запустить запрос к ApiUser.selectDefaultAvatar
    onAvatarSelect: (newAvatarPath: string) => void;
    // НОВЫЙ ПРОП: Обработчик для открытия модалки загрузки
    onUploadClick: () => void;
    username: string; // Имя пользователя для заглушки
}

const STATIC_AVATAR_PATH_PREFIX = '/public/avatars/';

export const AvatarChangeModal: React.FC<AvatarChangeModalProps> = ({ 
    isOpen, 
    onClose, 
    onAvatarSelect, 
    onUploadClick, // Принимаем новый проп
    username 
}) => {
    // ... (Остальная логика useState и useEffect остается без изменений) ...

    const [avatarFilenames, setAvatarFilenames] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Получение списка аватаров с сервера (логика useQuery перенесена сюда) ---
    useEffect(() => {
        if (!isOpen) {
            // Сбрасываем данные при закрытии для чистого открытия в следующий раз
            setAvatarFilenames(null);
            setError(null);
            return;
        }

        const fetchAvatars = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const filenames = await ApiUser.getAvailableAvatars();
                setAvatarFilenames(filenames);
            } catch (err) {
                // Предполагаем, что handleApiError выбрасывает объект с полем error.message
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const errorMessage = (err as any)?.error?.message || (err as Error)?.message || 'Неизвестная ошибка загрузки.';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvatars();
    }, [isOpen]); // Зависимость от isOpen: запрос выполняется при открытии модалки

    // --- Обработка выбора стандартного аватара ---
    const handleSelect = (filename: string) => {
        const pathForDb = `${STATIC_AVATAR_PATH_PREFIX}${filename}`;
        onAvatarSelect(pathForDb);
    };

    // --- Обработка клика по кнопке "Загрузить свой" ---
    const handleUploadClick = () => {
        onClose(); // Закрываем текущую модалку
        onUploadClick(); // Открываем модалку загрузки (будет реализовано в UserAvatar)
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Выбрать аватар</DialogTitle>
                    <DialogDescription>
                        Выберите один из стандартных аватаров или загрузите свой.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isLoading && (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Загрузка...
                        </div>
                    )}

                    {error && (
                        <p className="text-destructive text-center">Ошибка загрузки: {error}</p>
                    )}

                    {!isLoading && (
                        <div className="grid grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-2">
                            {/* --- КНОПКА "ЗАГРУЗИТЬ СВОЙ" (Avatar Style) --- */}
                            <button
                                onClick={handleUploadClick}
                                aria-label="Загрузить свой аватар"
                                // Оборачивающая кнопка имеет те же стили, что и кнопки стандартных аватаров
                                className="p-1 rounded-md transition-all hover:bg-primary/20 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary flex flex-col items-center justify-center"
                            >
                                {/* Имитация UserAvatar по размеру (w-16 h-16) */}
                                <div className="w-16 h-16 mx-auto 
                                               bg-muted text-muted-foreground rounded-full 
                                               flex items-center justify-center 
                                               border-2 border-dashed border-input 
                                               transition-colors"
                                >
                                    <Upload className="w-6 h-6" />
                                </div>
                                {/* Текст "Загрузить свой" удален */}
                            </button>
                            {/* --------------------------------- */}

                            {/* Список стандартных аватаров */}
                            {avatarFilenames && avatarFilenames.length > 0 && avatarFilenames.map((filename) => {
                                const relativePath = `${STATIC_AVATAR_PATH_PREFIX}${filename}`;

                                return (
                                    <button
                                        key={filename}
                                        onClick={() => handleSelect(filename)}
                                        className="p-1 rounded-md transition-all hover:bg-primary/20 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <UserAvatar
                                            imageUrl={relativePath}
                                            username={username}
                                            className="w-16 h-16 mx-auto"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Закрыть
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};