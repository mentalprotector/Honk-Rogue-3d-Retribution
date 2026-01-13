# SPEC-005: Levels 13-16 Concepts

## World 3 Extension: The Deep Woods (Continued)

### Level 13: PINE NEEDLE STORM (Speed Swarm)
- **Concept:** A massive amount of small, fast enemies that overwhelm the player.
- **Composition:**
  - 50x Fly (Speed increased by 20% for this wave)
  - 10x Micro-Slime
  - 3x Anti-Goose (Acting as 'leaders' in the swarm)
- **Goal:** Test the player's AOE and movement capabilities.

### Level 14: BARRAGE OF THE ANCIENTS (Heavy Artillery)
- **Concept:** A mix of ranged spitters and high-HP bruisers.
- **Composition:**
  - 10x Slime (Spitters)
  - 3x Human (Rake wielders)
  - 2x Wild Boar (Charging through the chaos)
- **Goal:** Force the player to dodge projectiles while being chased by heavy hitters.

### Level 15: THE ETERNAL HUNT (The Gauntlet)
- **Concept:** A relentless pursuit by the most aggressive land animals.
- **Composition:**
  - 8x Wild Boar
  - 8x Cat (Leaping/Aggressive)
  - 20x Rat (Fodder)
- **Goal:** Pure survival against a high-density, high-aggression pack.

### Level 16: BOSS - THE FOREST TITAN
- **Concept:** The ultimate guardian of the Deep Woods.
- **Composition:**
  - 1x "Forest Titan" (Use BULL config, but with 200 HP and 2.2 Speed)
  - 4x Wild Boar (Bodyguards)
- **Victory Condition:** Game completion after Level 16.

## Technical Implementation Tasks
1. Update `spawnWave` in `src/utils/world.js` with these 4 levels.
2. Update `triggerNextLevel` and victory checks in `src/index.js` to Level 16.
