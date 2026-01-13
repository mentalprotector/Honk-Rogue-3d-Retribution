# Technical Plan: Balance Config Refactor

## 1. Overview
Centralize all gameplay-affecting constants into `src/data/config.js` under a new `BALANCE` object. This allows designers to tweak values without searching through logic files.

## 2. Config Schema (`src/data/config.js`)
Add the following export:
```javascript
export const BALANCE = {
    PLAYER: {
        BASE_HP: 10,
        BASE_SPEED: 45.0,
        FRICTION: 10.0,
        INVULNERABLE_TIME: 1000, // ms
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
            GRIMOIRE: { CD: 0.8, DMG: 4, CHARGE_TIME: 1.2 }
        }
    },
    ENEMIES: {
        FRICTION: 5.0,
        DEFAULT_ATTACK_WINDUP: 0.6,
        DEFAULT_ATTACK_COOLDOWN: 1.5
    }
};
```

## 3. Refactor Points

### A. `src/entities/player.js`
1.  Import `BALANCE` from `../data/config.js`.
2.  Constructor:
    - `this.speed = BALANCE.PLAYER.BASE_SPEED;`
    - `this.maxHp = BALANCE.PLAYER.BASE_HP;`
    - `this.friction = BALANCE.PLAYER.FRICTION;`
    - `this.dashCooldownMax = BALANCE.PLAYER.DASH.COOLDOWN;`
3.  `attack()` method:
    - Replace hardcoded cooldowns with `BALANCE.PLAYER.WEAPONS[key].CD`.
    - Replace hardcoded damage with `BALANCE.PLAYER.WEAPONS[key].DMG`.
4.  `dash()` method:
    - Use `BALANCE.PLAYER.DASH.POWER`.

### B. `src/entities/enemy.js`
1.  Import `BALANCE`.
2.  Constructor:
    - `this.friction = BALANCE.ENEMIES.FRICTION;`
    - `this.attackDuration = BALANCE.ENEMIES.DEFAULT_ATTACK_WINDUP;`

## 4. Execution Steps
1.  **Refactorer:** Update `src/data/config.js` to include `BALANCE`.
2.  **Refactorer:** Apply changes to `src/entities/player.js`.
3.  **Refactorer:** Apply changes to `src/entities/enemy.js`.
