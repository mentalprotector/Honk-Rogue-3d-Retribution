export const CONFIG = {
    WORLD_SIZE: 22,
    COLORS: {
        GRASS: 0x4caf50,
        BG: 0x2c3e50
    }
};

export const ENEMY_TYPES = {
    FLY: { name: 'Fly', hp: 1, speed: 2.5, color: 0x000000, scale: 0.3, yOffset: 1.5, shape: 'sphere', hitRadius: 0.4 },
    RAT: { name: 'Rat', hp: 2, speed: 2.0, color: 0x7f8c8d, scale: 0.5, yOffset: 0.25, shape: 'box', hitRadius: 0.6 },
    CAT: { name: 'Cat', hp: 5, speed: 1.5, color: 0xe67e22, scale: 0.8, yOffset: 0.4, shape: 'box', hitRadius: 0.8 },
    ANTI_GOOSE: { name: 'Anti-Goose', hp: 8, speed: 1.8, color: 0x95a5a6, scale: 1.0, yOffset: 0.5, shape: 'goose', hitRadius: 1.0 },
    HUMAN: { name: 'Human', hp: 50, speed: 1.5, color: 0xffccaa, scale: 2.0, yOffset: 1.0, shape: 'cylinder', hitRadius: 1.2 },
    GARDENER: { name: 'The Gardener', hp: 60, speed: 1.3, color: 0xffccaa, scale: 2.2, yOffset: 1.0, shape: 'cylinder', hitRadius: 1.5 },
    SLIME: { name: 'Slime', hp: 6, speed: 1.2, color: 0x2ecc71, scale: 1.0, yOffset: 0.5, shape: 'sphere', hitRadius: 1.0 },
    SPITTER_PLANT: { name: 'Spitter Plant', hp: 3, speed: 0, color: 0x27ae60, scale: 0.8, yOffset: 0.4, shape: 'box', hitRadius: 0.8 },
    MICRO_SLIME: { name: 'Micro-Slime', hp: 2, speed: 2.0, color: 0x2ecc71, scale: 0.4, yOffset: 0.2, shape: 'sphere', hitRadius: 0.4 },
    BULL: { name: 'Bull', hp: 120, speed: 1.8, color: 0xf39c12, scale: 3.0, yOffset: 1.5, shape: 'box', hitRadius: 3.5 },
    WILD_BOAR: { name: 'Wild Boar', hp: 30, speed: 1.2, color: 0x5d4037, scale: 1.4, yOffset: 0.5, shape: 'box', hitRadius: 1.5 }
};

export const STATE_ENUM = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAMEOVER: 3,
    LEVELUP: 4
};

export const BALANCE = {
    PLAYER: {
        BASE_HP: 10,
        BASE_SPEED: 45.0,
        FRICTION: 10.0,
        INVULNERABLE_TIME: 1000,
        DASH: {
            DURATION: 0.2,
            COOLDOWN: 2.5,
            POWER: 20.0,
            POWER_UPGRADED: 26.0
        },
        WEAPONS: {
            PECK: { CD: 0.7, DMG: 1, RANGE: 2.0, ANGLE: 0.52 },
            KNIFE: { CD: 0.8, DMG: 3, RANGE: 2.0, BLEED_TIME: 3.0 },
            BAT: { CD: 1.6, DMG: 5, RANGE: 3.0, ANGLE: Math.PI },
            SHURIKEN: { CD: 1.2, DMG: 3, SPEED: 12.0 },
            GRIMOIRE: { CD: 0.8, DMG: 4, CHARGE_TIME: 1.2 },
            MOLTEN_BREATH: { CD: 1.0, DMG: 2, RANGE: 3.5 },
            ICICLE_SPIT: { CD: 0.5, DMG: 2, SPEED: 15.0 },
            VOID_ORB: { CD: 2.0, DMG: 8, SPEED: 4.0 }
        }
    },
    ENEMIES: {
        FRICTION: 5.0,
        DEFAULT_ATTACK_WINDUP: 0.6,
        DEFAULT_ATTACK_COOLDOWN: 1.5
    }
};
