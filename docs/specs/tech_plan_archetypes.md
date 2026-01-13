# Technical Plan: Archetypes & Status Effects

## 1. Overview
This plan details the architectural changes required to support the 5 new Archetypes (Bleed, Frost, Fire, Combo, Magic). The core challenge is abstracting hardcoded status logic into a flexible system and adding support for persistent Ground Effects.

## 2. Status Effect System Refactor
**Current:** `Enemy3D` has hardcoded fields (`bleedTime`, `freezeTime`, `stunTime`).
**New:** Introduce a generic `StatusEffect` interface.

### A. Data Structure
```javascript
// src/data/status_registry.js
export const STATUS_TYPES = {
    BLEED: 'bleed',
    BURN: 'burn',
    CHILL: 'chill',
    FREEZE: 'freeze',
    STUN: 'stun'
};

// In Enemy3D class
this.activeEffects = []; // Array of { type, duration, tickTimer, stacks, sourceId, value }
```

### B. Logic Update (`Enemy3D.updateStatusEffects`)
Replace the if-else block with a loop:
1.  Iterate `this.activeEffects`.
2.  Decrease `duration`. Remove if <= 0.
3.  Handle `tickTimer` for DoTs (Bleed, Burn).
4.  Apply passive modifiers (e.g., Chill = Speed * 0.7) by recalculating stats at start of frame or dynamically.

### C. Implementation Detail
*   **Bleed:** Stacks intensity or duration? Spec says "Stacks up to 5 times". New stacks refresh duration.
*   **Burn:** On death, check for 'burn' effect -> Spawn GroundEffect (Explosion) or spread to neighbors.

## 3. Ground Effect System
New system to handle AOE zones (Fire Trail, Ice Patch).

### A. New Class: `GroundEffect` (`src/entities/effects.js`)
```javascript
export class GroundEffect {
    constructor(scene, x, z, config) {
        // config: { type: 'fire_trail', duration: 3.0, radius: 1.0, damage: 10, interval: 0.5 }
        this.mesh = ...; // Visual representation
    }
    update(dt, enemies) {
        // Check collision with enemies
        // Apply Status Effect or Damage
    }
}
```

### B. Integration
*   **GameState:** Add `groundEffects` array.
*   **GameLoop:** Call `ge.update(dt, enemies)` for each effect.

## 4. Upgrade & Synergy System
To support "Tags" and "Triggers":

### A. Registry Update (`src/data/registry.js`)
Add `tags` to every upgrade.
```javascript
{
    id: 'knife',
    name: 'Serrated Beak',
    tags: ['bleed', 'melee', 'physical'],
    ...
}
```

### B. Player Stats (`src/entities/player.js`)
Expand `this.stats` (or `this.modifiers`) to track:
*   `bonusDamageVsBleeding`
*   `bonusCritVsFrozen`
*   `onKillExplode`

### C. Damage Pipeline
Refactor damage application.
**Current:** Direct `enemy.takeDamage(1)`.
**New:**
```javascript
// src/utils/combat.js or Player method
function calculateDamage(source, target, baseDamage, tags) {
    let dmg = baseDamage;
    if (target.hasStatus('bleed') && source.stats.bonusDamageVsBleeding) ...
    if (target.hasStatus('freeze') && source.stats.bonusCritVsFrozen) ...
    return dmg;
}
```

## 5. Implementation Phases
1.  **Phase 1 (Core):** Refactor `Enemy3D` to use `activeEffects` array. Implement Bleed/Burn/Freeze logic in this new system.
2.  **Phase 2 (Ground):** Implement `GroundEffect` class and integrate into Game Loop.
3.  **Phase 3 (Content):** Implement the 5 Archetype Upgrades in `registry.js` using the new systems.
