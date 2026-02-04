import { GameResult, IGameResult } from "../models/gameResult.model";
import BaseRepository from "./base.repository";

export class GameResultRepository extends BaseRepository {
    /**
     * Создать новую запись о результате игры
     * @param data - частичные данные модели IGameResult
     */
    async create(data: Partial<IGameResult>): Promise<IGameResult> {
        const newResult = new GameResult(data);
        return await newResult.save();
    }

    /**
     * Найти результат игры по внутреннему MongoDB ID
     * @param id - ObjectId в формате строки
     */
    async findById(id: string): Promise<IGameResult | null> {
        return await GameResult.findById(id).exec();
    }

    /**
     * Найти результат игры по UUID (поле id в схеме)
     * @param uuid - строковый UUID
     */
    async findByUuid(uuid: string): Promise<IGameResult | null> {
        return await GameResult.findOne({ id: uuid }).exec();
    }

    /**
     * Получить список всех результатов игр
     */
    async findAll(): Promise<IGameResult[]> {
        return await GameResult.find().exec();
    }

    /**
     * Найти все игры конкретного игрока
     * @param userId - ID пользователя
     */
    async findByPlayer(userId: string): Promise<IGameResult[]> {
        return await GameResult.find({ players: userId }).exec();
    }

    /**
     * Обновить данные результата игры
     * @param id - ObjectId
     * @param updateData - обновляемые поля
     */
    async update(id: string, updateData: Partial<IGameResult>): Promise<IGameResult | null> {
        return await GameResult.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        ).exec();
    }

    /**
     * Удалить запись о результате игры
     * @param id - ObjectId
     */
    async delete(id: string): Promise<boolean> {
        const result = await GameResult.findByIdAndDelete(id).exec();
        return result !== null;
    }
}