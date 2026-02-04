import { validateOrReject, ValidationError } from "class-validator";
import { ValidationError as CustomValidationError } from "../../utils/CustomErrors";

export default class BaseRepository {
    /**
     * Метод для валидации DTO с использованием class-validator.
     * Если валидация не проходит, выбрасывается ValidationError с сообщениями.
     * 
     * @param dto - объект для валидации
     * @throws CustomValidationError
     */
    protected async validateDto(dto: object): Promise<void> {
        try {
            await validateOrReject(dto);
        } catch (errors) {
            const messages = this.processValidationErrors(errors as ValidationError[]);
            throw new CustomValidationError(messages.join(", "));
        }
    }

    /**
     * Метод для обработки ошибок валидации class-validator.
     * Преобразует ValidationError в массив строк с сообщениями об ошибках.
     * 
     * @param errors - массив ValidationError
     * @returns массив строк с сообщениями об ошибках
     */
    private processValidationErrors(errors: ValidationError[]): string[] {
        const readableErrors: string[] = [];

        errors.forEach(error => {
            if (error.constraints) {
                // Извлекаем все сообщения об ошибках из constraints
                Object.values(error.constraints).forEach(message => {
                    readableErrors.push(message);
                });
            }
            // Рекурсивный обход для вложенных объектов
            if (error.children && error.children.length > 0) {
                readableErrors.push(...this.processValidationErrors(error.children));
            }
        });

        return Array.from(new Set(readableErrors)); // Убираем дубликаты
    }
}
