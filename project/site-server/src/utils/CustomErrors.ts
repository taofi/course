export class BaseError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

// Ошибки Express / Валидация
export class ValidationError extends BaseError {
    constructor(message = "Validation failed") {
        super(message, 400);
    }
}

export class InvalidFormatError extends BaseError {
    constructor(message = "Invalid data format") {
        super(message, 400);
    }
}

export class RouteNotFoundError extends BaseError {
    constructor(message = "Route not found") {
        super(message, 404);
    }
}
export class NotFoundError extends BaseError {
    constructor(message = "Not found") {
        super(message, 404);
    }
}
export class CardNotFoundError extends BaseError {
    constructor(message = "Card not found") {
        super(message, 404);
    }
}


export class LobbyNotFoundError extends BaseError {
    constructor(message = "Lobby not found") {
        super(message, 404);
    }
}


export class TooManyRequestsError extends BaseError {
    constructor(message = "Too many requests") {
        super(message, 429);
    }
}

// Ошибки Аутентификации / Авторизации
export class InvalidCredentialsError extends BaseError {
    constructor(message = "Invalid credentials") {
        super(message, 401);
    }
}

export class TokenMissingError extends BaseError {
    constructor(message = "Token is missing") {
        super(message, 401);
    }
}

export class TokenExpiredError extends BaseError {
    constructor(message = "Token has expired") {
        super(message, 401);
    }
}

export class JsonWebTokenError extends BaseError {
    constructor(message = "Invalid token") {
        super(message, 401);
    }
}

export class ForbiddenError extends BaseError {
    constructor(message = "Access forbidden") {
        super(message, 403);
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message = "Unauthorized access") {
        super(message, 401);
    }
}

export class AuthError extends BaseError {
    constructor(message = "Authentication error") {
        super(message, 401);
    }
}



export class TokenError extends BaseError {
    constructor(message = "Token error") {
        super(message, 401);
    }
}

// Ошибки MongoDB
export class DuplicateKeyError extends BaseError {
    constructor(message = "Duplicate key error") {
        super(message, 400);
    }
}

export class CastError extends BaseError {
    constructor(message = "Invalid ID format") {
        super(message, 400);
    }
}

export class MongoNetworkError extends BaseError {
    constructor(message = "Database connection error") {
        super(message, 500);
    }
}

export class TopologyIsClosedError extends BaseError {
    constructor(message = "Database topology is closed") {
        super(message, 500);
    }
}

// Ошибки Redis
export class RedisConnectionError extends BaseError {
    constructor(message = "Redis connection error") {
        super(message, 500);
    }
}

export class RedisCommandError extends BaseError {
    constructor(message = "Redis command error") {
        super(message, 500);
    }
}

export class RefreshKeyNotFoundError extends BaseError {
    constructor(message = "Refresh token not found") {
        super(message, 401);
    }
}

// Общие Системные Ошибки
export class UnhandledPromiseRejection extends BaseError {
    constructor(message = "Unhandled promise rejection") {
        super(message, 500);
    }
}

export class UncaughtException extends BaseError {
    constructor(message = "Uncaught exception") {
        super(message, 500);
    }
}

export class InternalServerError extends BaseError {
    constructor(message = "Internal server error") {
        super(message, 500);
    }
}


