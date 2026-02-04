import { ICardData, IDoorData } from "@munchkin/shared";
import { CardRepository } from "@src/db/repositories/card.repository";
import { DoorsRepository } from "@src/db/repositories/doors.repository";

export class CardLibraryService {
    constructor(
        private cardRepo: CardRepository,
        private doorsRepo: DoorsRepository
    ) {}

    // Методы для сокровищ (Card)
    async addTreasure(data: Partial<ICardData>) { return await this.cardRepo.create(data); }
    async updateTreasure(id: string, data: Partial<ICardData>) { return await this.cardRepo.update(id, data); }
    async deleteTreasure(id: string) { return await this.cardRepo.delete(id); }
    async getAllTreasures() { return await this.cardRepo.findAll(); } 
    async getTreasureById(id: string) { return await this.cardRepo.findByUuid(id); }


    // Методы для дверей (Doors)
    async addDoor(data: Partial<IDoorData>) { return await this.doorsRepo.create(data as any); }
    async updateDoor(id: string, data: Partial<IDoorData>) { return await this.doorsRepo.update(id, data as any); }
    async deleteDoor(id: string) { return await this.doorsRepo.delete(id); }
    async getAllDoors() { return await this.doorsRepo.findAll(); }
    async getDoorById(id: string) { return await this.doorsRepo.findByUuid(id); }
}