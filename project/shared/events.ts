export const SocketEvents = {
    CLIENT: {
        PLAY_CARD: 'client:play_card',
        EQUIP_ITEM: 'client:equip_item',
        END_TURN: 'client:end_turn'
    },
    SERVER: {
        GAME_UPDATE: 'server:game_update',
        PLAYER_STATS_UPDATE: 'server:player_stats_update',
        ACTION_LOG: 'server:action_log', // сообщение в чат игры
        ERROR: 'server:error',
        INVENTORY_UPDATE : 'server:inventory_update',
    }
};