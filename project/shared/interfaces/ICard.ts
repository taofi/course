import { CardRace, CardClass, CardType, CardSize, DoorType, type ICardAction} from '../enums';

export interface ICardData {
    _id: string;
    name: string;
    description: string;
    imageUrl?: string;
    bonus?: number;
    race?: CardRace;
    class?: CardClass;
    type: CardType;
    size?: CardSize;
    price: number;
    action: ICardAction[];
}


export interface IDoorData {
    _id: string;
    name: string;
    description: string;
    imageUrl?: string;
    level?: number;
    treasure?: number;
    race?: CardRace;
    type: DoorType;
    action: ICardAction[];
}
