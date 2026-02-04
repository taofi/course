import { PlayerActionType } from "./PlayerActionType";
import { GamePhase } from "./GamePhase"; // Импортируем ваш новый enum

export type PlayerAuthority = 'anyone' | 'current' | 'nobody';

export interface ActionPermission {
    action: PlayerActionType;
    allowedFor: PlayerAuthority;
}

export const PHASE_PERMISSIONS: Partial<Record<GamePhase, ActionPermission[]>> = {
    [GamePhase.TURN]: [
        { action: PlayerActionType.OpenDoor,  allowedFor: 'current' },
        { action: PlayerActionType.Equip,     allowedFor: 'current' },
        { action: PlayerActionType.UnEquip,     allowedFor: 'current' },
        { action: PlayerActionType.DropCard,  allowedFor: 'current' },
        { action: PlayerActionType.UseOtherCard,   allowedFor: 'current' } 
    ],
    [GamePhase.BATTLE]: [
        { action: PlayerActionType.Run,       allowedFor: 'current' },
        { action: PlayerActionType.AskHelp,   allowedFor: 'current' },
        { action: PlayerActionType.Help,      allowedFor: 'anyone'  }, 
        { action: PlayerActionType.UseCard,   allowedFor: 'anyone'  },
        { action: PlayerActionType.BuffMonster,   allowedFor: 'anyone'  },
        { action: PlayerActionType.BuffPlayer,   allowedFor: 'anyone'  },
        { action: PlayerActionType.Fight,   allowedFor: 'current'  },

    ],
    [GamePhase.LOOT]: [
        { action: PlayerActionType.TakeCard,  allowedFor: 'current' },
        { action: PlayerActionType.EndTurn,   allowedFor: 'current' },
        { action: PlayerActionType.DropCard,  allowedFor: 'current' },
        { action: PlayerActionType.EndTurn,  allowedFor: 'current' },
    ],
    [GamePhase.CHARITY]: [
        { action: PlayerActionType.DropCard,  allowedFor: 'current' },
        { action: PlayerActionType.EndTurn,   allowedFor: 'current' }
    ],
    [GamePhase.ENEMY_TURN]: [
        { action: PlayerActionType.UseCard,   allowedFor: 'anyone' }
    ],
    [GamePhase.DROP_CARDS]: [
        { action: PlayerActionType.DropCard,   allowedFor: 'current' }
    ]
};