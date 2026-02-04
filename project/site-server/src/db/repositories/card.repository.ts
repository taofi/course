import { CardModel, Card as ICardDocument } from "../models/card.model";
import BaseRepository from "./base.repository";
import { ICardData } from '@munchkin/shared';

export class CardRepository extends BaseRepository {
    
    async create(data: Partial<ICardData>): Promise<ICardData> {
        const newCard = new CardModel(data);
        const savedCard = await newCard.save();
        return savedCard.toJSON();
    }

    async findByUuid(id: string): Promise<ICardData | null> {
        return await CardModel.findById(id).exec();
    }

    async findAll(): Promise<ICardData[]> {
        return await CardModel.find().exec();
    }

    async update(id: string, updateData: Partial<ICardData>): Promise<ICardData | null> {
        return await CardModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).exec();
    }

    async delete(id: string): Promise<boolean> {
        const result = await CardModel.findByIdAndDelete(id).exec();
        return result !== null;
    }

    async findBigItems(): Promise<ICardData[]> {
        return await CardModel.find({ size: "Big" }).exec(); 
    }
}