import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { CardRace, CardClass, CardType, CardSize, ICardData } from '@munchkin/shared';

// Теперь интерфейс напрямую использует структуру из shared, так как там тоже _id
export interface Card extends ICardData, Document {
  _id: string;
}

const CardSchema = new Schema<Card>({
  _id: { 
    type: String, 
    default: () => uuidv4() 
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  bonus: { type: Number, default: 0 },
  race: { type: String, enum: Object.values(CardRace) },
  class: { type: String, enum: Object.values(CardClass) },
  type: { type: String, enum: Object.values(CardType), required: true },
  size: { type: String, enum: Object.values(CardSize) },
  price: { type: Number, default: 0 },
  action: [{
    _id: false,
    name: { type: String, required: true },
    params: { type: Schema.Types.Mixed, default: {} }
  }]
}, {
      timestamps: true,
    versionKey: false, 
    id: false, 
    toJSON: {
      virtuals: false, 
      transform: (_, ret) => {
        return ret;
      }
    }
});

export const CardModel = model<Card>("Card", CardSchema);