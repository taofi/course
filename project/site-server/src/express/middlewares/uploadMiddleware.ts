import multer from 'multer';
import * as path from 'path';
import { Request } from 'express';
import { ValidationError } from '@src/utils/CustomErrors';
import fs from 'fs';
// Определение корневой директории для сохранения файлов
// В продакшене это часто делается через переменные окружения.
// Допустимые расширения файлов
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

const CARDS_IMG_DIR = path.join(process.cwd(), 'src', 'public', 'cards', 'img');

// Убедимся, что папка существует
if (!fs.existsSync(CARDS_IMG_DIR)) {
    fs.mkdirSync(CARDS_IMG_DIR, { recursive: true });
}

const cardStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(`[Multer] Попытка загрузки файла в папку карт: ${file.originalname}`);
        cb(null, CARDS_IMG_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const fullFileName = `card-${uniqueSuffix}${ext}`;
        
        console.log(`[Multer] Файл успешно переименован в: ${fullFileName}`);
        cb(null, fullFileName);
    }
});



interface AuthRequest extends Request {
    file?: Express.Multer.File;
    // Ожидаем, что AuthMiddleware добавляет объект user с полем id
    user?: { id: string }; 
}

/**
 * Конфигурация дискового хранилища Multer.
 */
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, path.join(process.cwd(), 'src', 'public', 'uploads', 'avatars')); 
    },
    
    // Определяем имя файла
    filename: (req: AuthRequest, file: Express.Multer.File, cb) => {
        // !!! КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Получаем ID из req.user
        const userId = req.user?.id; 

        if (!userId) {
             // Если ID нет, значит, authMiddleware не сработал или токен невалиден
             return cb(new Error("Неавторизованный запрос: ID пользователя отсутствует в токене."), ''); 
        }

        const ext = path.extname(file.originalname).toLowerCase();
        // Формируем новое имя: avatar-userId.расширение
        const newFileName = `avatar-${userId}${ext}`;
        
        cb(null, newFileName);
    }
});
/**
 * Фильтр для проверки типов файлов.
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // ЛОГ: проверяем, какой MIME-тип и расширение видит сервер
    console.log(`[Multer Filter] Проверка файла: ${file.originalname}, Тип: ${file.mimetype}`);

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        console.error(`[Multer Filter] Отказ: недопустимое расширение ${ext}`);
        cb(new ValidationError(`Недопустимый тип файла. Разрешены только: ${ALLOWED_EXTENSIONS.join(', ')}`));
    } else {
        console.log(`[Multer Filter] Файл принят`);
        cb(null, true);
    }
};

/**
 * Основной Multer Middleware для аватаров.
 * Ограничение: 5 MB.
 */

export const uploadAvatar = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 
    },
    fileFilter: fileFilter
});

export const 
uploadCardImage = multer({
    storage: cardStorage,
    limits: { fileSize:3 * 1024 * 1024 }, 
    fileFilter: fileFilter 
});


