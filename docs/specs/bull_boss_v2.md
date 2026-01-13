# Design Spec: Bull Boss V2 (The Raging Bull)

## 1. Overview
The current Bull Boss is a "damage sponge" with a predictable, easily avoidable charge. The V2 update aims to make him a relentless, aggressive threat that demands active positioning and timing from the player.

## 2. Core Behavior Changes

### A. Improved "Raging Charge"
*   **Old Behavior:** Long windup -> Linear Dash -> Cooldown.
*   **New Behavior (Tracking):**
    *   **Windup:** Reduced from 1.5s to **0.8s**. Visuals: Flashes RED faster.
    *   **Tracking:** During the first 0.2s of the dash, the Bull *turns towards the player* (rotational speed 2.0 rad/s). This means you can't just side-step early; you must dodge *as* he charges.
    *   **Wall Impact:** If he hits a wall, he is **Stunned** for 2.0s (Reward for baiting). If he misses and hits nothing, he slides to a stop and turns around instantly (0.5s recovery).

### B. New Ability: "Thunder Stomp" (Close Range)
*   **Trigger:** If Player is within **3.5 units** and Bull is not charging.
*   **Windup:** 0.6s (Raises front legs).
*   **Effect:** slams ground, creating a shockwave.
*   **Hitbox:** Radial AOE (Radius 4.0).
*   **Damage:** 1 Damage + **Knockback** (pushes player away 5 units).
*   **Cooldown:** 3.0s.

## 3. Stats Adjustments

| Stat | Old Value | New Value | Reason |
| :--- | :--- | :--- | :--- |
| **HP** | 100 | **120** | Slight buff to compensate for player power creep. |
| **Speed** | 1.2 | **1.8** | Needs to close gaps faster. |
| **Charge Speed** | 15.0 | **22.0** | Harder to outrun. |
| **Turn Speed** | Slow | **Fast** | Snappier movement. |

## 4. AI Logic Loop
1.  **Check Distance:**
    *   `< 3.5 units` & `Stomp CD Ready` -> **Prepare Stomp**.
    *   `> 3.5 units` & `Charge CD Ready` -> **Prepare Charge**.
2.  **Otherwise:** Move towards player (Pathfinding/Direct).

## 5. Visual Cues
*   **Charge Windup:** Flash Red + "snorting" particle effect (if feasible).
*   **Stomp Windup:** Flash Orange or raise model Y slightly.
*   **Stunned:** Stars particle effect above head.
