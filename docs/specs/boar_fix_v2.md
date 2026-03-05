# Boar AI Fix & Overhaul V2

## 1. Issue Analysis
**Bug:** The Boar's `charging` state logic returns `true`, which forces an early exit from the `update()` loop. Consequently, `updatePhysics()` is never called, and the calculated velocity is never applied to the mesh position.
**Result:** The Boar freezes in place during the charge (playing the animation but not moving).

**Fix:** Explicitly apply velocity to position inside the `charging` block, OR allow fall-through to a custom physics handler. Preferred: Explicit movement in the block to avoid `updatePhysics` steering logic (which seeks player).

## 2. New Behavior: "Gore" (Normal Attack)
Currently, the Boar only has a "Charge" special attack. It needs a basic melee attack when close to the player.

### "Gore" Specs
*   **Trigger:** `distToPlayer < 2.0` AND `attackCooldown <= 0`.
*   **Telegraph:** 0.4s (Red flash).
*   **Execution:** 0.2s Lunge (High speed short burst).
*   **Damage:** 1 HP.
*   **Cooldown:** 1.5s.
*   **Visual:** Small "hop" forward.

## 3. Aggro & State Machine Refinement
The Boar should actively chase the player when not charging, rather than just idling.

### Revised State Machine
1.  **CHASE (Default):**
    *   Behavior: Move towards player at `speed` (1.2).
    *   Transitions:
        *   If `dist < 2.0` AND `cd <= 0` -> **GORE**.
        *   If `dist > 6.0` AND `timer > 3.0` -> **CHARGE_WINDUP**.

2.  **GORE (Attack):**
    *   `gore_winding` (0.4s): Stop moving. Look at player. Flash Red.
    *   `gore_thrust` (0.2s): Move forward 2.0 units instantly (Lunge). Deal Damage if hit.
    *   Transition -> **CHASE** (set `attackCooldown` = 1.5).

3.  **CHARGE (Special):**
    *   `winding` (0.8s): Same as current.
    *   `charging` (2.5s): High speed (22.0). **FIX MOVEMENT HERE.**
    *   `rest` (1.5s): Stunned/Tired after charge.
    *   Transition -> **CHASE**.

## 4. Implementation Details (Coder Instructions)
In `src/entities/enemy.js` (Wild Boar section):

1.  **Variable Init:** Ensure `attackCooldown` is tracked.
2.  **Movement Fix:**
    ```javascript
    // Inside 'charging' state
    this.velocity.copy(this.chargeDir).multiplyScalar(22.0);
    this.mesh.position.add(this.velocity.clone().multiplyScalar(dt)); // <--- ADD THIS
    ```
3.  **Logic Update:**
    Replace the old `idle` logic with the new **CHASE** logic.
    *   Use `updatePhysics` (return `false`) for CHASE state to get free seeking behavior?
    *   **Better:** Keep custom logic. If `state === 'chase'`, set `this.speed = this.config.speed` and return `false` to let `updatePhysics` handle the seeking/steering.

### Pseudo-Code
```javascript
if (state === 'chase') {
   this.speed = this.config.speed;
   // Trigger Gore
   if (dist < 2.0 && this.attackCooldown <= 0) {
       this.state = 'gore_winding'; this.timer = 0; return true;
   }
   // Trigger Charge
   if (dist > 6.0 && this.chargeTimer > 3.0) {
       this.state = 'winding'; this.timer = 0; return true;
   }
   return false; // Fallthrough to updatePhysics (Seek)
}
```
