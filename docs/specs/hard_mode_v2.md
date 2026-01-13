# Hard Mode V2: Aggressive Evolution

**Concept:** Enemies are not just faster; they have **new abilities** that force player movement.

## 1. Enemy Updates

### 🟢 Fly (Kamikaze)
*   **Old:** Just flies and hits.
*   **New:** On death, pauses for 0.5s (flashing red) and **Explodes** in a 3x3 grid.
*   **Damage:** 10 (Explosion).
*   **Counterplay:** Kill it from range (Bow/Magic). Do not melee if low HP.

### 🐀 Rat (Leaper)
*   **Old:** Walks towards player.
*   **New:** If within exactly 2 tiles range, **Leaps** over the gap instantly dealing damage.
*   **Cooldown:** 4.0s.
*   **Counterplay:** Don't stand 2 tiles away. Close gap or run far.

## 2. Difficulty Scaling
*   Level 1: Only Speed buff.
*   Level 3: Rats gain Leap.
*   Level 5: Flies gain Explosion.

## 3. Feedback
*   **Explosion:** Yellow circular shockwave (canvas arc).
*   **Leap:** Trail effect behind Rat.
