// src/components/AvatarUploadModal.tsx

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiUser } from '@/services/apiUser';
import { Upload, Loader2, RefreshCcw } from 'lucide-react'; // Используем RefreshCcw вместо X для отмены загрузки/кропа
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop'; // Импорт кроппера
import { getCroppedImage } from '@/utils/cropImage'; // Импорт функции обрезки

// Тип из react-easy-crop
interface Point { x: number; y: number }
interface Area { x: number; y: number; width: number; height: number }

interface AvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => Promise<void>; 
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null); // URL для кроппера
    const [isUploading, setIsUploading] = useState(false);
    
    // Состояния для react-easy-crop
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE_MB = 5;
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    const handleResetInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        setOriginalFile(null);
        setImageSrc(null);
        setIsUploading(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        handleResetInput();
        onClose();
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;

        if (selectedFile) {
            if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                toast.error(`Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE_MB}MB.`);
                setOriginalFile(null);
                handleResetInput();
                return;
            }

            if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
                toast.error('Неподдерживаемый формат. Допустимы: JPG, PNG, WEBP.');
                setOriginalFile(null);
                handleResetInput();
                return;
            }

            setOriginalFile(selectedFile);
            setImageSrc(URL.createObjectURL(selectedFile));
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } else {
            setOriginalFile(null);
            setImageSrc(null);
        }
        
        handleResetInput();
    };
    
    // Коллбэк, вызываемый react-easy-crop после каждого изменения области обрезки
    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) {
            toast.error('Сначала выберите и обрежьте изображение.');
            return;
        }

        setIsUploading(true);
        let croppedFile: File | null = null;

        try {
            // 1. Получение обрезанного Blob
            const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
            
            // 2. Преобразование Blob обратно в File (с именем исходного файла)
            croppedFile = new File([croppedBlob], originalFile?.name || 'cropped_avatar.jpeg', {
                type: 'image/jpeg'
            });

            // 3. Вызов API для загрузки
            const response = await ApiUser.changeAvatar(croppedFile); 

            toast.success(response.message || 'Аватар успешно загружен и установлен!');
            
            await onSuccess(); 
            
            handleClose(); 
        } catch (error) {
            toast.error('Ошибка при обрезке или загрузке аватара. Попробуйте снова.');
            console.error('Ошибка загрузки аватара:', error);
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] min-h-[450px]">
                <DialogHeader>
                    <DialogTitle>{imageSrc ? 'Обрезать и настроить' : 'Загрузить свой аватар'}</DialogTitle>
                    <DialogDescription>
                        {imageSrc 
                            ? 'Переместите и масштабируйте изображение, чтобы выбрать нужный фрагмент.'
                            : `Выберите изображение (JPG, PNG, WEBP) размером до ${MAX_FILE_SIZE_MB}MB.`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 flex flex-col items-center space-y-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={ALLOWED_MIME_TYPES.join(',')}
                        className="hidden"
                    />

                    {imageSrc ? (
                        // ----------------------------------------------------
                        // ЗОНА КРОППЕРА
                        // ----------------------------------------------------
                        <div className="relative w-full h-64 border-2 border-gray-300 rounded-lg">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1 / 1} // Соотношение сторон 1:1 для круга
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                cropShape="round" // Главное для круглой формы
                                showGrid={false}
                                restrictPosition={false}
                            />
                             {/* Ползунок масштабирования */}
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4/5 p-2 bg-background/80 rounded-lg">
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => {
                                        setZoom(Number(e.target.value));
                                    }}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
                                />
                            </div>
                            
                            {/* Кнопка отмены/сброса */}
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 z-10"
                                aria-label="Сбросить загрузку"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        // ----------------------------------------------------
                        // ЗОНА ВЫБОРА ФАЙЛА
                        // ----------------------------------------------------
                        <div className="w-32 h-32 flex items-center justify-center">
                            <Button 
                                variant="outline" 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center h-full w-full border-2 border-dashed border-gray-300 rounded-full"
                            >
                                <Upload className="w-6 h-6 mb-1" />
                                Выбрать файл
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex justify-between pt-4">
                    <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
                        Отмена
                    </Button>
                    <Button onClick={handleUpload} disabled={!imageSrc || isUploading || !croppedAreaPixels}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Загрузка...
                            </>
                        ) : (
                            'Обрезать и загрузить'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};