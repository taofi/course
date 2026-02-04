import { CardRepository } from "@src/db/repositories/card.repository";
import { RedisService } from "../services/redis.service";
import { ICardData, IDoorData } from "@munchkin/shared";
import { DoorsRepository } from "@src/db/repositories/doors.repository";

export interface IInitialDecks {
    doors: IDoorData[];
    treasures: ICardData[];
}

export class DeckInitializationService {
    constructor(
        private cardRepo: CardRepository,
        private doorsRepo: DoorsRepository,
    ) {}

    /**
     * Основная функция инициализации колод для игры
     * @param totalDoorsCount Общее число карт в колоде дверей на выходе
     * @param doorsDistribution Распределение типов (например, { 'Monster': 0.7, 'Race': 0.3 })
     */
    async initializeGameDecks(): Promise<IInitialDecks> {
        // 1. Получаем все уникальные карты из БД
        const allDbDoors = await this.doorsRepo.findAll();
        const allDbTreasures = await this.cardRepo.findAll();

        // 2. Перемешиваем и возвращаем
        return {
            doors: this.shuffle(allDbDoors),
            treasures: this.shuffle(allDbTreasures)
        };
    }
    
    /**
     * Перемешивание массива 
     */
    private shuffle<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j]!, newArray[i]!];
        }
        return newArray;
    }

}