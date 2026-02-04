export interface GameSessionResponse {
    success: boolean;
    data: {
        id: string;
        password: string;
        participantsId: string[];
    };
}

export interface GameAccessResponse {
    success: boolean;
    data: {
        gameId: string;
        password: string;
        isWatcher: boolean;
    };
}