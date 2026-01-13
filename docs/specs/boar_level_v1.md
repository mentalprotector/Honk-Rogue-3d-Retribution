# SPEC-004: Wild Boar & Level 11

## Core Concept
Extend the game into World 3 (The Deep Woods) starting with Level 11. Introduce the **Wild Boar**, an enemy that uses a non-stopping charge mechanic that requires precise positioning rather than just staying away.

## 1. Wild Boar Enemy Design

### Stats
- **Name:** Wild Boar
- **HP:** 30
- **Speed:** 1.2 (Base) / 8.0 (Charging)
- **Color:** `0x5d4037` (Dark Brown)
- **Scale:** 1.4
- **Shape:** `box` (Custom boar mesh with tusks)
- **HitRadius:** 1.5
- **Collision:** Damage 2 per hit.

### AI: 'Wild Charge'
The Boar does not follow the standard attack loop. It follows a sequence:
1. **Idle/Seek:** Moves slowly toward the player for 2-4 seconds.
2. **Wind-up (Telegraph):**
   - Duration: 1.5s
   - Behavior: Stops moving. Shakes intensely. Flashes Red/Orange.
   - Targeting: Locks a direction toward `Player.Position + RandomOffset(-0.7, 0.7)`. This "near-miss" targeting makes the charge harder to predict by just standing still.
3. **Charge:**
   - Duration: 2.5s
   - Behavior: Moves at high speed in the locked direction.
   - **Unique Mechanic:** Does NOT stop when hitting world boundaries. If it hits a wall, it simply continues sliding/pushing against it or "passes through" (visually staying at the edge but completing the timer).
   - Collision: Deals damage and high knockback to player on contact.
4. **Rest (Stunned):**
   - Duration: 2.0s
   - Behavior: Stops. Lowers head. Emits steam particles (`0xaaaaaa`).

## 2. Level 11: The Deep Woods

### Visual Transition
- **Background:** `0x1b5e20` (Deep Forest Green)
- **Ground Color:** `0x3e2723` (Dark Soil)
- **Grass Color:** `0x2e7d32` (Pine Green)

### Wave Composition
- **Stage Title:** "THE DEEP WOODS: BOAR RUSH"
- **Enemies:**
  - 3x Wild Boar
  - 8x Rat (Fast fodder to distract during charges)

## 3. Technical Implementation Tasks
1. **Registry:** Add `WILD_BOAR` to `ENEMY_TYPES` in `src/data/config.js`.
2. **Visuals:** Implement `Wild Boar` mesh in `Enemy3D._initVisuals`.
3. **AI:** Add `charge` state logic to `Enemy3D.updateAI`.
4. **World:** Update `spawnWave` in `src/utils/world.js` to handle Level 11.
5. **Progression:** Update `triggerNextLevel` in `src/index.js` to allow Level 11 (change victory condition to Level 15).
