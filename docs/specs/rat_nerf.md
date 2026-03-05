# Rat Enemy Nerf V1

## 1. Issue Analysis
**Problem:** Rats are "unavoidable". They jump instantly when in range (Instant Cast), and they predict player movement aggressively.
**Goal:** Give players reaction time and make the jump dodgable.

## 2. Mechanic Changes

### A. Add Telegraph (Windup)
Currently, `idle` -> `leaping`.
**New Flow:** `idle` -> `winding` (0.5s) -> `leaping`.

**Winding State:**
- Duration: 0.5s.
- Visual: Stop moving. Flash Red (Emissive).
- Action: Lock target position at START of winding (or end?).
  - *Decision:* Lock target at END of winding (just before jump). This rewards dodging *during* the telegraph.

### B. Nerf Predictive Aiming
Currently, `leapTarget = pos + velocity * 0.3`.
**Change:** Reduce prediction to `velocity * 0.1` or remove.
- *Decision:* `velocity * 0.15`. Slight prediction, but not perfect tracking.

### C. Jump Speed
Currently: `leapDuration = 0.6s`.
**Change:** `leapDuration = 0.7s`. (Slightly slower arc).

## 3. Implementation Plan (Coder Instructions)
In `src/entities/enemy.js` (Rat section):

1.  **State Machine:**
    - `idle`: If in range -> `winding`.
    - `winding`: Timer 0->0.5s. Flash Red. At end, set `leapStart`, `leapTarget`, switch to `leaping`.
    - `leaping`: Same as before (but use new duration).
    
2.  **Logic Update:**
    ```javascript
    if (state === 'idle') {
        // ...
        if (dist < 5.0 && dist > 1.5 && cd <= 0) {
            this.state = 'winding'; this.timer = 0;
        }
    }
    else if (state === 'winding') {
        this.speed = 0;
        // Visuals (Red Flash)
        if (this.timer > 0.5) {
             this.state = 'leaping'; 
             this.leapTime = 0; 
             this.leapDuration = 0.7; // Nerfed Speed
             this.leapStart = this.mesh.position.clone();
             // Nerfed Prediction
             const pred = this.callbacks.player.velocity.clone().multiplyScalar(0.15); 
             this.leapTarget = playerPosition.clone().add(pred).setY(this.config.yOffset);
             // ...
        }
    }
    ```
