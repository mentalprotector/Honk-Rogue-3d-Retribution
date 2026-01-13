# TECH-004: Wild Boar Implementation Plan

## 1. Data Model Changes
- **File:** `src/data/config.js`
- **Action:** Add `WILD_BOAR` entry to `ENEMY_TYPES`.
  ```javascript
  WILD_BOAR: { name: 'Wild Boar', hp: 30, speed: 1.2, color: 0x5d4037, scale: 1.4, yOffset: 0.5, shape: 'box', hitRadius: 1.5 }
  ```

## 2. Visuals (Enemy3D)
- **File:** `src/entities/enemy.js`
- **Method:** `_initVisuals()`
- **Implementation:** 
  - Create a sturdy box-shaped body.
  - Add two tusks (white cones) in front of the head.
  - Add a small tail.
  - Ensure it's added to `this.parts` for walk animations.

## 3. AI State Machine (Enemy3D)
- **File:** `src/entities/enemy.js`
- **Method:** `updateAI()`
- **States:**
  - `idle`: Move toward player using `this.speed`. Transition to `winding` if `distToPlayer < 10` after 2-4s.
  - `winding`: 
    - Duration: 1.5s
    - Behavior: Set `this.speed = 0`. Lock in `this.chargeDir = normalize(player.pos + offset - boar.pos)`.
    - Visuals: Intensify emissive red and jitter `this.mesh`.
  - `charge`:
    - Duration: 2.5s
    - Behavior: `this.velocity.copy(this.chargeDir).multiplyScalar(22.0)`.
    - Boundary Logic: Do NOT check for wall hits to exit state. The existing `updatePhysics` will clamp position, making the boar "slide" along walls.
  - `rest`:
    - Duration: 2.0s
    - Behavior: `this.speed = 0`. Visual feedback (steam particles).

## 4. Level Extension
- **File:** `src/index.js`
- **Method:** `triggerNextLevel()`
- **Change:** Increase Victory level from 10 to 15.
- **Visuals:** Add conditional for `STATE.level === 11` to update world colors to "Deep Woods" theme.
  - Background: `0x1b5e20`
  - Ground: `0x3e2723`
  - Grass: `0x2e7d32`

- **File:** `src/utils/world.js`
- **Method:** `spawnWave()`
- **Change:** Add case for `lvl === 11`.
  - 3x `ENEMY_TYPES.WILD_BOAR`
  - 8x `ENEMY_TYPES.RAT`

## 5. Performance & Safety
- Use `Math.atan2` for efficient direction calculation during wind-up.
- Ensure `this.timer` is used for state transitions to avoid creating new `Date` objects.
- Reuse `this.velocity` vector for charge movement.
