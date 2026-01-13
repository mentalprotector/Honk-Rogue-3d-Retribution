# DESIGN SPEC: Level Transition Overhaul

## Core Concept
Replace the manual portal interaction with an automated, high-feedback transition sequence that occurs after a player selects an upgrade. This streamlines the flow while providing clear "breathing room" for the player.

## Transition Flow Sequence
1. **Loot Pickup:** Player touches the loot box (as before).
2. **Upgrade Selection:** Player selects an upgrade from the menu (as before).
3. **Sequence Start (Immediate):**
    - The upgrade menu closes.
    - Play a "Success" or "Level Clear" jingle.
    - Display a large, centered UI message: **"LEVEL [X] COMPLETE"**.
    - Player becomes **invulnerable**.
    - Optional: Slow down time slightly (e.g., `dt * 0.5`) for dramatic effect.
4. **Orientation Delay (2.0s):**
    - The player remains in the current level for 2 seconds.
    - During this time, they can move around but cannot be harmed.
    - A screen overlay (black fade) begins to increase in opacity from `0.0` to `1.0` during the last `0.5s` of the delay.
5. **Level Jump:**
    - The `triggerNextLevel()` function is called.
    - World/Wave state is reset for the new level.
    - Screen overlay fades back to `0.0` over `0.5s`.
    - **"LEVEL [X+1] START"** message is shown.
    - Invulnerability is removed after the fade-in finishes.

## Removed Mechanics
- **Portals:** The `spawnPortal` function and `portal` related logic in `src/index.js` will be removed or deactivated.
- **Portal Interaction:** The distance check for portals in the main loop will be removed.

## Numeric Values
| Value | Old | New |
|-------|-----|-----|
| Transition Trigger | Portal Touch | Upgrade Selected |
| Post-Upgrade Delay | 0s | 2.0s |
| Invulnerability | False | True (during sequence) |
| Fade Duration | N/A | 0.5s |

## UI Requirements
- **Overlay:** A full-screen `div` with `background: black; opacity: 0; pointer-events: none; transition: opacity 0.5s;`.
- **Large Text:** Repurpose or create a new HUD element for high-visibility level announcements.

## Edge Cases
- **Last Level (10):** Instead of "Next Level", the sequence should trigger the "Victory" state immediately after the delay.
- **Dashing during fade:** Dash should be canceled or completed normally, but player should be centered in the new level regardless.
