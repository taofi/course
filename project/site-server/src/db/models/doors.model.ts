import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { CardRace, DoorType, IDoorData } from '@munchkin/shared';

export interface Doors extends IDoorData, Document {
  _id: string;
}

const DoorsSchema = new Schema<Doors>({
  _id: { 
    type: String, 
    default: () => uuidv4()
  },
  name: { 
    type: String, 
    required: [true, "Название карты обязательно"],
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  imageUrl: { type: String },
  level: { 
    type: Number, 
    default: 0 
  },
  treasure: { 
    type: Number, 
    default: 0 
  },
  race: { 
    type: String, 
    enum: Object.values(CardRace)
  },
  type: { 
    type: String, 
    enum: Object.values(DoorType),
    required: true 
  },
  // Упрощенная структура действий внутри массива
  action: [{
    _id: false,
    name: { type: String, required: true },
    params: { type: Schema.Types.Mixed, default: {} }
  }]
}, {
  timestamps: true,
  versionKey: false,
  id: false ,
  autoIndex: true
});


export const DoorsModel = model<Doors>("Doors", DoorsSchema);