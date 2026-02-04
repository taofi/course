// Этот файл - пример, который вы должны реализовать
// с помощью React Query, SWR или просто useState/useEffect.

import { useState, useEffect } from 'react';
import { apiLobby } from '@/services/apiLobby';
import type { LobbyDetails } from '@/types/lobbyTypes'; 

export const useLobbies = () => {
    const [lobbies, setLobbies] = useState<LobbyDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLobbies = async () => {
            try {
                setIsLoading(true);
                const data = await apiLobby.getAll(); // Вызов API
                setLobbies(data);
                setError(null);
            } catch (err: any) {
                // В apiLobby уже есть handleApiError, так что здесь можно просто поймать
                setError(err.message || "Не удалось загрузить список лобби.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLobbies();
        // В реальном приложении здесь можно добавить интервал или WebSocket для обновления
    }, []);

    return { lobbies, isLoading, error };
};