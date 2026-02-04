import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IGameResult extends Document {
  id: string;
  players: string[]; // массив ссылок на пользователей
  start: Date;
  end: Date;
  logFile: string;
  result: string;
}

const GameResultSchema = new Schema<IGameResult>({
  id: { type: String, default: uuidv4 },
  players: [{ type: Schema.Types.ObjectId, ref: "User" }],
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  logFile: { type: String, required: true },
  result: { type: String, required: true }
});

export const GameResult = model<IGameResult>("GameResult", GameResultSchema);
