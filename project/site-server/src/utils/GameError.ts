/**
 * Базовый класс для всех игровых ошибок
 */
export class GameError extends Error {
    public readonly code: string;
    public readonly status: number;

    constructor(message: string, code: string, status: number = 400) {
        super(message);
        this.name = "GameError";
        this.code = code;
        this.status = status;
        
        // Необходимо для корректной работы instanceof в TypeScript
        Object.setPrototypeOf(this, GameError.prototype);
    }
}

/**
 * Ошибки, связанные с правилами игры (например, нельзя надеть две брони)
 */
export class GameRuleError extends GameError {
    constructor(message: string, code: string = 'RULE_VIOLATION') {
        super(message, code, 400);
        this.name = "GameRuleError";
    }
}

export class GameResourceError extends GameError {
    constructor(message: string, code: string = 'RESOURCE_NOT_FOUND') {
        super(message, code, 404);
        this.name = "GameResourceError";
    }
}

/**
 * Непредвиденные ошибки (ошибки базы данных, Redis или программные сбои)
 */
export class UnexpectedGameError extends GameError {
    constructor(message: string = "Произошла непредвиденная ошибка", code: string = 'INTERNAL_SERVER_ERROR') {
        super(message, code, 500);
        this.name = "UnexpectedGameError";
    }
}