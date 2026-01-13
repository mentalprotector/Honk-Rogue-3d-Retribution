# Tech Plan: Hard Mode V2 Implementation

**Status:** APPROVED with Constraints.

## 1. Class Changes

### `src/game/Enemy3D.js`
*   Add `this.type` property ('fly', 'rat', 'boss').
*   Update `updateAI()`:
    *   **Fly:** Add sinusoidal offset to position during movement.
    *   **Rat:** Add distance check. If `dist == 2`, trigger `leap()`.
*   Add `die()` override:
    *   If Fly, spawn `Explosion` object.

### `src/game/Explosion.js` (New)
*   Simple mesh (Sphere expanding).
*   One-time damage check in `update()` (Box collision with Player).
*   Self-destruct after 0.5s.

## 2. State Machine Updates
*   Add `STATE_LEAP` constant.
*   In `STATE_LEAP`: Disable pathfinding. Move linearly to target X,Z. Parabolic arc for Y.

## 3. Performance Guardrails
*   **Fly Pathing:** Do NOT recalc path every frame. Recalc every 1s. The sine wave is visual only.
*   **Explosion:** Use a single SphereGeometry for the shockwave instead of 100 particles to save draw calls.
