import { 
    ICardAction, 
    CardActionType, 
    DynamicValue, 
    ICardData, 
    IDoorData 
} from '@munchkin/shared';
import { CardRepository } from '@src/db/repositories/card.repository';
import { DoorsRepository } from '@src/db/repositories/doors.repository';
import { gameDispatcher } from './game.dispatcher';
import logger from '@src/utils/logger';
import { ValidationError } from '@src/utils/CustomErrors';

export class ActionDispatcher {
    private cardRepository = new CardRepository();
    private doorsRepository = new DoorsRepository();

    /**
     * Обработка эффектов карты Сокровищ
     */
    public async resolveCardEffects(cardId: string, gameId: string, targetUserId: string): Promise<void> {
        const card = await this.cardRepository.findByUuid(cardId);
        if (!card) throw new ValidationError(`Карта ${cardId} не найдена`);
        logger.info(`[ActionDispatcher] Resolving card ${cardId}`);
        
        await this.processActions(card, gameId, targetUserId);
    }

    /**
     * Обработка эффектов карты Дверей (Монстры, Проклятия)
     */
    public async resolveDoorEffects(doorId: string, gameId: string, targetUserId: string): Promise<void> {
        const door = await this.doorsRepository.findByUuid(doorId);
        if (!door) throw new ValidationError(`Дверь ${doorId} не найдена`);
        await this.processActions(door, gameId, targetUserId);
    }

    /**
     * Общий цикл обработки действий для любого типа карты
     */
    private async processActions(card: ICardData | IDoorData, gameId: string, targetUserId: string) {
        const actions = card.action || [];
        logger.info(`[ActionDispatcher] Resolving card ${JSON.stringify(actions)}`);
        
        for (const action of actions) {
            try {
                const actionToProcess = JSON.parse(JSON.stringify(action)) as unknown as ICardAction;
                
                this.resolveDynamicParams(actionToProcess, card);

                await gameDispatcher.applyCardEffect(gameId, targetUserId, actionToProcess);

            } catch (error: any) {
                logger.error(`[ActionDispatcher] Error: ${error.message}`);
            }
        }
    }

    /**
     * Type Guard для безопасного вычисления параметров
     */
    private resolveDynamicParams(action: ICardAction, card: ICardData | IDoorData): void {
        if (action.name === CardActionType.GiveBonus) {
            const { amount } = action.params;
            
            if (typeof amount === 'string') {
                action.params.amount = this.calculateValue(amount as DynamicValue, card);
            }
        }
    }

    private calculateValue(value: DynamicValue, card: ICardData | IDoorData): number {
        switch (value) {
            case "card_bonus":
                return (card as ICardData).bonus || 0;
            case "card_level":
                return (card as IDoorData).level || 0;
            default:
                return 0;
        }
    }
}

export const actionDispatcher = new ActionDispatcher();