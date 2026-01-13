# Design Spec: Synergy Drop System V1

## 1. Overview
The Synergy System aims to make builds feel more cohesive by increasing the probability of finding upgrades that "match" the player's current loadout. Instead of pure RNG, the game acts as a "Dungeon Master", nudging the player towards completing their build.

## 2. Tag Taxonomy
Every upgrade in `UPGRADES_REGISTRY` will be assigned one or more tags.

### Core Tags
*   `#melee` (Close range, physical)
*   `#ranged` (Projectiles)
*   `#magic` (Spells, elemental)
*   `#physical` (Kinetic damage)
*   `#dash` (Movement abilities)

### Effect Tags
*   `#speed` (Movement or Attack speed)
*   `#bleed` (DoT)
*   `#fire` (Burn)
*   `#ice` (Slow/Freeze)
*   `#poison` (Toxic)
*   `#control` (Stun, Knockback)
*   `#aoe` (Area of Effect)
*   `#crit` (Critical hits)
*   `#defense` (HP, Armor)

## 3. Tag Mapping (Existing Items)

| ID | Name | Tags |
| :--- | :--- | :--- |
| `knife` | Knife | `melee`, `physical`, `bleed` |
| `bat` | Baseball Bat | `melee`, `physical`, `aoe`, `control` |
| `shuriken` | Shuriken | `ranged`, `physical` |
| `grimoire` | Grimoire | `ranged`, `magic` |
| `grimoire_speed` | Chronos Page | `magic`, `speed` |
| `grimoire_power` | Void Ink | `magic`, `aoe` |
| `sstar_multi` | S-Star: Multi | `ranged`, `aoe` |
| `sstar_pierce` | S-Star: Pierce | `ranged`, `aoe` |
| `knife_machete` | Knife: Machete | `melee`, `crit`, `bleed` |
| `knife_kukri` | Knife: Kukri | `melee`, `poison` |
| `bat_stun` | Bat: Heavy | `melee`, `control` |
| `bat_knockback` | Bat: Impact | `melee`, `control` |
| `peck_frenzy` | Peck: Frenzy | `melee`, `speed` |
| `peck_behemoth` | Peck: Behemoth | `melee`, `crit` |
| `dash_pierce` | Piercing Dash | `dash`, `physical` |
| `dash_fire` | Fire Dash | `dash`, `fire`, `magic` |
| `dash_angry` | Angry Dash | `dash`, `control`, `physical` |
| `dash_ice` | Ice Dash | `dash`, `ice`, `magic`, `control` |
| `swift_feathers` | Swift Feathers | `dash`, `speed` |
| `iron_beak` | Iron Beak | `melee`, `physical` |
| `hp` | Golden Egg | `defense` |
| `spd` | Coffee | `speed` |
| `dash_cd` | Energy Drink | `dash`, `speed` |

## 4. The Synergy Algorithm

### A. Synergy Score Calculation
For every potential drop `Candidate`:
1.  Start with `Weight = 100`.
2.  Iterate through `Player.inventory`.
3.  For each `OwnedItem`, find shared tags with `Candidate`.
4.  For each shared tag: `Weight += 50`.

**Example:**
*   Player has `Coffee` (#speed).
*   Candidate `Swift Feathers` (#dash, #speed).
*   Shared: `#speed`.
*   Final Weight: 100 + 50 = 150.

**Diminishing Returns (Optional):**
To prevent hard-locking into one archetype, cap the bonus weight at +300% (400 total).

### B. Slot Allocation Strategy
The upgrade screen presents 3 choices.

*   **Slot 1 (The Synergy Slot):**
    *   Pool: All eligible upgrades.
    *   Selection: **Weighted Random** using Synergy Scores.
    *   *Result:* Highly likely to be relevant.

*   **Slot 2 (The Hybrid Slot):**
    *   Pool: All eligible upgrades.
    *   Selection: **Weighted Random** (Synergy Scores * 0.5 bias).
    *   *Result:* Mix of relevant and random.

*   **Slot 3 (The Wildcard Slot):**
    *   Pool: All eligible upgrades.
    *   Selection: **Pure Flat Random** (Weight = 100 for all).
    *   *Result:* Ensures the player can pivot to new builds.

## 5. Implementation Notes
*   Modify `src/data/registry.js` to include the `tags` array.
*   Update the `LevelUp` logic (likely in `engine.js` or `state.js`) to implement the weighting function.
*   Debug Tool: Log the weights to console when rolling. `Console: "Rolling Slot 1: Feathers (150), Knife (100)..."`
