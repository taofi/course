import { DoorsModel, Doors } from "../models/doors.model";
import BaseRepository from "./base.repository";

export class DoorsRepository extends BaseRepository {
    
    async create(data: Partial<Doors>): Promise<Doors> {
        const newDoor = new DoorsModel(data);
        return await newDoor.save();
    }

    async findByUuid(id: string): Promise<Doors | null> {
        return await DoorsModel.findById(id).exec();
    }

    async findAll(): Promise<Doors[]> {
        return await DoorsModel.find().exec();
    }

    async update(id: string, updateData: Partial<Doors>): Promise<Doors | null> {
        return await DoorsModel.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        ).exec();
    }

    async delete(id: string): Promise<boolean> {
        const result = await DoorsModel.findByIdAndDelete(id).exec();
        return result !== null;
    }
}