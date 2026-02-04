import { Schema, model, Document, Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IHistory extends Document {
  id: string;
  user: Types.ObjectId | string;
  action: string;
}

const HistorySchema = new Schema<IHistory>({
  id: { type: String, default: uuidv4 },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }
});

export const History = model<IHistory>("History", HistorySchema);
