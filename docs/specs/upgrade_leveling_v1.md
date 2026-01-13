# SPEC-004: Upgrade Leveling System

## 1. Overview
To increase long-term progression and build depth, all upgrades can now be leveled up. Selecting a duplicate upgrade in the selection menu will increase its **Level** instead of being blocked.

## 2. Global Rules
- **Initial Level:** 1.
- **Max Level:** 5 (Default for most), 10 for basic Stats.
- **Stat Scaling:** Bonuses are **Incremental (Additive)** based on the base value to ensure linear growth and avoid exponential power creep.
- **UI:** The level must be clearly displayed on the upgrade card.

## 3. Leveling Tables

### 3.1 Basic Stats
| ID | Name | Primary Stat | Level 1 | Increment (per Level) | Max Level |
|----|------|--------------|---------|-----------------------|-----------|
| `hp` | Golden Egg | Max HP | +1 HP | +1 HP | 10 |
| `spd` | Coffee | Speed | +10% | +10% (Flat) | 5 |
| `dash_cd` | Energy Drink | Dash CD | -0.5s | -0.25s | 5 |

### 3.2 Weapons (Base Power)
Weapon leveling increases the core damage output or reduces cooldowns.
| ID | Name | Stat | Level 1 | Increment |
|----|------|------|---------|-----------|
| `knife` | Serrated Beak | Bleed DoT | 1.0 / tick | +0.5 / tick |
| `bat` | Baseball Bat | Damage | 5 | +2 |
| `shuriken` | Shuriken | Damage | 3 | +1 |
| `grimoire` | Grimoire | Magic Dmg | 4 | +2 |
| `molten_breath`| Molten Breath | Fire Dmg | 2 | +1 |
| `icicle_spit` | Icicle Spit | Ice Dmg | 2 | +1 |
| `void_orb` | Void Orb | Void Dmg | 8 | +3 |

### 3.3 Passives (Buffs)
| ID | Name | Stat | Level 1 | Increment |
|----|------|------|---------|-----------|
| `iron_beak` | Iron Beak | Melee Bonus | +2 | +2 |
| `glass_cannon` | Glass Cannon | Dmg Multi | +30% | +10% |
| `swift_feathers`| Swift Feathers | Dash Power | +30% | +15% |
| `echo` | Echo | Double Chance | 20% | +10% |
| `rhythm_strike`| Rhythm Strike | Crit Multi | 3x | +0.5x |

### 3.4 Dash Mods
Dash mods increase their secondary effects (damage, duration, or range).
| ID | Name | Stat | Level 1 | Increment |
|----|------|------|---------|-----------|
| `dash_fire` | Flame Wake | Burn Dmg | 0.5 / tick | +0.5 / tick |
| `dash_angry` | Angry Dash | Explosion Dmg | 2 | +2 |
| `dash_ice` | Ice Dash | Freeze Dur | 3.0s | +0.5s |
| `blink` | Blink | Range | 8.0 | +2.0 |

## 4. UI/UX Requirements
1. **Level Badge:** A small tag (e.g., `Lv. 2`) next to the upgrade name.
2. **Growth Preview:** The card description should update to show the current vs next state. 
   - *Example:* "Damage: 5 -> **7**"
3. **Selection Logic:** 
   - Already owned upgrades must be prioritized (or at least allowed) in the selection pool until they reach Max Level.
   - If an upgrade is at Max Level, it should no longer appear in the pool.

## 5. Technical Implementation Guidance
- **State Store:** `player.collectedUpgrades` should be an object/map: `{ upgradeId: level }`.
- **Registry Update:** No need to duplicate registry entries. Logic should use `level` as a multiplier for the increment.
- **Formula:** `FinalValue = BaseValue + (Level - 1) * Increment`.
