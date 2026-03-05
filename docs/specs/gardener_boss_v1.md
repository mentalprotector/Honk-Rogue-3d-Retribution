# Design Spec: The Gardener Boss (Level 5)

## 1. Overview
Transform the Level 5 Boss from a generic Human into a unique encounter "The Gardener". He controls the arena with summoned plants and wide area attacks.

## 2. Stats
*   **HP:** 60 (vs Human 50).
*   **Speed:** 1.3 (Slightly slower than Human).
*   **Scale:** 2.2 (Larger).
*   **HitRadius:** 1.5.

## 3. Abilities

### A. Summon Spitter Plant (Cooldown: 6s)
*   **Trigger:** Player distance > 4.0.
*   **Effect:** Spawns a static `Plant Turret` at a random position near the player (within 5 units).
*   **Turret Stats:**
    *   **Name:** "Spitter Plant"
    *   **HP:** 3 (One-hit kill for most weapons).
    *   **Behavior:** Shoots standard projectile (like Slime) every 2s.
    *   **Model:** Small green sphere/box on the ground.
    *   **Cap:** Max 3 active plants at a time.

### B. Rake Sweep (Cooldown: 3s)
*   **Trigger:** Player distance < 3.5.
*   **Telegraph:** 0.8s (Holds rake horizontally, flashes Orange).
*   **Effect:** Wide cone attack (Angle 120 degrees, Range 3.5).
*   **Damage:** 1 + Knockback (Force 15.0).

### C. Phase 2 (HP < 50%)
*   **Enrage:** "Get off my lawn!"
*   **Visual:** Red Emissive Pulse.
*   **Effect:** Speed +20%. Plant Cooldown reduced to 4s.

## 4. Implementation Steps
1.  **Config:** Add `GARDENER` to `src/data/config.js` (copy Human but tweak stats). Add `SPITTER_PLANT` to `config.js` (Static, low HP).
2.  **World:** Update `src/utils/world.js` to spawn `GARDENER` instead of `HUMAN` at Level 5.
3.  **AI (Enemy3D):**
    *   Add `Gardener` logic in `updateAI`.
    *   Manage `plantCooldown` and `activePlants` list (filter dead ones).
    *   Implement `Spitter Plant` logic (Simple turret AI).
