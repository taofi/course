// src/components/UserAvatar.tsx 

import React, { useState, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIcon, Camera, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/services/apiService';
import { AvatarChangeModal } from './AvatarChangeModal';
import { AvatarUploadModal } from './AvatarUploadModal';
import { useAuth } from '@/contexts/useAuth'; // Должен быть обернут в AuthProvider
import { ApiUser } from '@/services/apiUser';
import toast from 'react-hot-toast';

interface UserAvatarProps {
    imageUrl?: string | null;
    username: string;
    className?: string;
    isEditable?: boolean; // Флаг для включения режима редактирования
}

// ... getInitials остается без изменений ...
const getInitials = (name: string): string => {
    if (!name) return '??';
    const parts = name.split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};


export const UserAvatar: React.FC<UserAvatarProps> = ({ imageUrl, username, className, isEditable = false }) => {

    
    const { fetchCurrentUser } = useAuth();

    const [imageLoadError, setImageLoadError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    React.useEffect(() => {
        setImageLoadError(false);
    }, [imageUrl]);

    const handleError = useCallback(() => {
        setImageLoadError(true);
    }, []);



    // НОВАЯ ЛОГИКА: Обработчик успешной загрузки из AvatarUploadModal
    const handleUploadSuccess = async () => {
        // Логика isUpdating здесь не нужна, она внутри модалки загрузки
        // Просто обновляем данные пользователя после успешной загрузки
        await fetchCurrentUser();
    };

    // НОВАЯ ЛОГИКА: Обработчик открытия модалки загрузки
    const handleOpenUploadModal = () => {
        setIsUploadModalOpen(true);
    };

    // --- ЛОГИКА ОБРАБОТКИ ВЫБОРА АВАТАРА И API ЗАПРОС ---
    const handleAvatarSelect = async (newAvatarPath: string) => {
        setIsUpdating(true);

        try {
            const response = await ApiUser.selectDefaultAvatar(newAvatarPath);

            toast.success(response.message || "Аватар успешно установлен.");
            await fetchCurrentUser();

            setIsModalOpen(false);

        } catch (error) {
            toast.error("Ошибка при смене аватара. Попробуйте снова.");
            console.error("Ошибка смены аватара:", error);
        } finally {
            setIsUpdating(false);
        }
    };
    // --- КОНЕЦ ЛОГИКИ ОБРАБОТКИ ВЫБОРА АВАТАРА И API ЗАПРОС ---


    // --- ЛОГИКА ФОРМИРОВАНИЯ ПОЛНОГО URL ---
    const fullImageUrl = useMemo(() => {
        if (!imageUrl) return null;

        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }

        const base = API_BASE_URL.replace(/\/$/, '');
        const path = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;

        return `${base}/${path}`;
    }, [imageUrl]);
    // --- КОНЕЦ ЛОГИКИ ФОРМИРОВАНИЯ ПОЛНОГО URL ---

    const fallbackInitials = useMemo(() => getInitials(username), [username]);

    const showFallback = !fullImageUrl || imageLoadError;

    // --- Общий контент для Avatar (Изображение и Заглушка) ---
    const avatarContent = (
        <>
            {!showFallback && (
                <AvatarImage
                    src={fullImageUrl!}
                    alt={`Аватар пользователя ${username}`}
                    onError={handleError}
                />
            )}

            <AvatarFallback>
                {username ? fallbackInitials : <UserIcon className="w-6 h-6" />}
            </AvatarFallback>
        </>
    );

    // 1. Если режим редактирования ВЫКЛЮЧЕН, возвращаем простую аватарку.
    if (!isEditable) {
        return (
            <Avatar className={`${className} border bg-muted`}>
                {avatarContent}
            </Avatar>
        );
    }

    // 2. Если режим редактирования ВКЛЮЧЕН, возвращаем интерактивную обертку.
    return (
        <>
            <div
                // ВАЖНО: className должен содержать классы размера (w-XX h-XX)
                className={`relative cursor-pointer rounded-full transition-shadow border bg-muted ${className} ${isHovered ? 'shadow-lg ring-2 ring-primary/50' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => {
                    if (!isUpdating) {
                        setIsModalOpen(true);
                    }
                }}
            >
                {/* Внутренний компонент Avatar занимает всю площадь обертки */}
                <Avatar className="w-full h-full">
                    {avatarContent}
                </Avatar>

                {/* Оверлей при наведении */}
                {isHovered && !isUpdating && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                )}
                {/* Оверлей при загрузке */}
                {isUpdating && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center transition-opacity">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                )}
            </div>

            <AvatarChangeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAvatarSelect={handleAvatarSelect}
                onUploadClick={handleOpenUploadModal} // ПЕРЕДАЕМ НОВЫЙ ОБРАБОТЧИК
                username={username}
            />

            {/* Модальное окно загрузки собственного аватара */}
            <AvatarUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleUploadSuccess} // ПЕРЕДАЕМ ОБРАБОТЧИК УСПЕХА
            />
        </>
    );
};