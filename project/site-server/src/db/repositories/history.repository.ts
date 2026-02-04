import { History, IHistory } from "../models/history.model";
import { Types } from "mongoose";

export class HistoryRepository {
  async create(data: Partial<IHistory>): Promise<IHistory> {
    const history = new History(data);
    return history.save();
  }

  async findById(id: string | Types.ObjectId): Promise<IHistory | null> {
    return History.findById(id).populate("user");
  }

  async findByUser(userId: string | Types.ObjectId): Promise<IHistory[]> {
    return History.find({ user: userId }).populate("user");
  }

  async getAll(): Promise<IHistory[]> {
    return History.find().populate("user");
  }

  async delete(id: string | Types.ObjectId): Promise<IHistory | null> {
    return History.findByIdAndDelete(id);
  }
}
