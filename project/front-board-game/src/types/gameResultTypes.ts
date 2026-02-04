export interface IGameResult {
    id: string;        // UUID игры
    players: string[]; // Массив ID пользователей
    start: string;     // ISO Дата начала
    end: string;       // ISO Дата окончания
    logFile: string;   // Путь к логам
    result: string;    // ID победителя
  }