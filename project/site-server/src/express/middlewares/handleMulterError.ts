import { ValidationError } from '@src/utils/CustomErrors';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * Вспомогательная функция для обработки ошибок Multer
 */
export const handleMulterError = (uploadMiddleware: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        uploadMiddleware(req, res, (err: any) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ValidationError('Файл слишком большой. Максимальный размер: 5 МБ.'));
                }
                return next(new ValidationError(`Ошибка загрузки: ${err.message}`));
            } else if (err) {
                return next(err);
            }
            next();
        });
    };
};
