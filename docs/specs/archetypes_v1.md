# Design Spec: Archetypes V1 (Class Diversity Update)

## 1. Overview
To increase replayability, we are introducing 5 distinct "Archetypes" or "Builds". These are not hard-coded classes selected at start, but rather *synergistic collections of Upgrades, Weapons, and Abilities* that players can draft into.

## 2. The 5 Archetypes

### A. The Bleedmaster (Hit & Run / DOT)
Focuses on applying Damage Over Time (DOT) and kiting.
*   **Core Mechanic:** **Bleed**. Enemies take X damage per second for Y seconds. Stacks up to 5 times.
*   **Weapon (Upgrade):** **Serrated Beak**. Melee attacks have 50% chance to apply Bleed.
*   **Dash Upgrade:** **Razor Wind**. Dashing through enemies applies Bleed.
*   **Synergy Upgrade:** **Blood Scent**. +10% Movement Speed for every bleeding enemy within 10 units.
*   **Finisher Upgrade:** **Exsanguinate**. Deal instant damage equal to remaining Bleed damage on target.

### B. The Frost Lord (Control / Crowd Management)
Focuses on slowing enemies and creating safety zones.
*   **Core Mechanic:** **Chill** (Slows movement by 30%) -> **Freeze** (Stops movement for 2s).
*   **Weapon (Upgrade):** **Icicle Spit**. Ranged projectile. Applies Chill.
*   **Dash Upgrade:** **Glacial Path**. Leaves a trail of ice for 3s. Enemies on ice are Chilled.
*   **Synergy Upgrade:** **Shatter**. +50% Crit Chance against Frozen enemies.
*   **Defense Upgrade:** **Ice Armor**. Reduce incoming damage by 15%. If hit, attacker is Frozen.

### C. The Pyro-Trailblazer (Area Denial / AOE)
Focuses on painting the floor with damage zones.
*   **Core Mechanic:** **Burn**. High DOT, short duration. Spreads to nearby enemies on death.
*   **Weapon (Upgrade):** **Molten Breath**. Cone attack. Ignites enemies.
*   **Dash Upgrade:** **Flame Wake**. Leaves a fire trail dealing 10 DPS.
*   **Synergy Upgrade:** **Oil Slick**. Enemies take +50% Fire Damage.
*   **AOE Upgrade:** **Combustion**. Burning enemies explode on death (Radius 2.0, 15 Dmg).

### D. The Combo Dynamo (High APM / Scaling)
Focuses on attacking continuously without getting hit.
*   **Core Mechanic:** **Combo Counter**. Increments on hit, resets on taking damage or 2s inactivity.
*   **Weapon (Upgrade):** **Frenzy Peck**. Attack speed increases by 1% per Combo (Max +50%).
*   **Dash Upgrade:** **Momentum Dash**. Dash cooldown reduced by 0.1s for every 10 Combo hits.
*   **Synergy Upgrade:** **Rhythm Strike**. Every 10th hit deals triple damage.
*   **Risk Upgrade:** **Glass Cannon**. +30% Damage, but taking damage resets Combo to -10 (Debuff).

### E. Magic Artillery (Ranged / Nuke)
Focuses on long-range destruction but weak close-range defense.
*   **Core Mechanic:** **Mana / Cooldowns**. Heavy reliance on Active Ability cooldown management.
*   **Weapon (Upgrade):** **Void Orb**. Slow moving, passes through walls, high damage.
*   **Dash Upgrade:** **Blink**. Instant teleport (no travel time), longer cooldown.
*   **Synergy Upgrade:** **Echo**. Projectiles have 20% chance to duplicate.
*   **Passive Upgrade:** **Sniper**. +5% Damage for every unit of distance from target.

## 3. Implementation Strategy (Tech Preview)

### Status Effect System
We need a unified `StatusEffect` class in `src/entities/effects.js`.
*   `type`: 'bleed', 'burn', 'chill', 'freeze'.
*   `duration`: seconds.
*   `tickRate`: how often it procs.
*   `onTick(entity)`: logic.
*   `onEnd(entity)`: cleanup.

### Tagging System (For Synergy)
All upgrades in `registry.js` must have a `tags` array:
*   `['bleed', 'physical', 'melee']`
*   `['ice', 'control', 'ranged']`
*   `['fire', 'aoe']`

This enables the future **Synergy Drop System** (REQ-0112-003710-368) to weigh drops properly.
