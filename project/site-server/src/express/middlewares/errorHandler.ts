import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../../utils/CustomErrors';

const errorHandler = (err: BaseError, req: Request, res: Response, next: NextFunction): void => {
  // Если ошибка является экземпляром BaseError, используем её данные
  if (err instanceof BaseError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  } else {
    // Для необработанных ошибок возвращаем статус 500
    console.error('Unhandled Error:', err);
    res.status(500).json({
      error: {
        message: 'Internal Server Error',
        statusCode: 500,
      },
    });
  }
};

export default errorHandler;