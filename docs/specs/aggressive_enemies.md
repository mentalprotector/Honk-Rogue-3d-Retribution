# Game Design Spec: Aggressive Enemies (Hard Mode)

**Objective:** Increase game difficulty by making enemy behaviors more proactive and threatening, rather than just increasing HP buffers.

## 1. Core Mechanics Changes

### 1.1. Movement Speed & Aggro
Current enemies feel sluggish. We will boost base speeds but add "Warning" states.

| Enemy Type | Old Speed | New Speed | Behavior Change |
| :--- | :--- | :--- | :--- |
| **Fly** | 1.0 | **1.8** | **Erratic Flight:** Changes direction every 0.5s (was linear). Harder to hit with arrows. |
| **Rat** | 1.2 | **2.0** | **Pack Mentality:** If 2+ Rats are within range, Speed increases to **2.5**. |
| **AntiGoose** | 1.5 | **1.8** | **Dash Attack:** When within 4 tiles, charges instantly to player position (Cooldown: 3s). |
| **Bull Boss** | 0.8 | **1.0** | **Rage Phase:** Below 50% HP, Speed becomes **1.5** and attacks leave a poison trail. |

### 1.2. Attack Frequency
Enemies currently wait too long between attacks.

*   **Global Attack Cooldown:** Reduced from 2.0s -> **1.2s**.
*   **Telegraphing:** Wind-up animation time reduced by 30% (from 0.6s -> 0.4s). Player must react faster.

## 2. New AI States

To support this, `Enemy3D` needs a state machine update:

*   **STATE_CHASE:** Default. Pathfinds to player.
*   **STATE_PREP:** (New) Pauses for 0.4s before a Dash or Special Attack. Displays a "!" icon.
*   **STATE_DASH:** (AntiGoose only) Moves at 3x speed in a straight line. Ignores collisions with other enemies.

## 3. Edge Cases & Constraints

*   **Stunlock:** To prevent unfair deaths, if Player takes damage, they get **0.5s Invulnerability**.
*   **Performance:** The "Pack Mentality" check for Rats must use a spatial grid lookup, NOT `O(N^2)` distance checks every frame.
*   **Visuals:** Aggressive enemies should have slightly redder tint or particles.

## 4. Acceptance Criteria
1.  Fly movement is non-linear (jittery).
2.  AntiGoose performs Dash attack when close.
3.  Player dies significantly faster if standing still (approx 5s vs old 10s).
