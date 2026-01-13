# Tech Plan: HonkRogue Monolith Decomposition

## 1. Directory Structure
```
honkrogue/
├── index.html          # Shell with UI and Script Loader
├── src/
│   ├── index.js        # Bootstrapper
│   ├── data/
│   │   ├── config.js   # CONFIG, ENEMY_TYPES
│   │   └── registry.js # UPGRADES_REGISTRY
│   ├── core/
│   │   ├── state.js    # Global STATE object & GameState transitions
│   │   ├── engine.js   # Three.js setup, scene, camera, lighting
│   │   ├── events.js   # Central EventEmitter
│   │   └── input.js    # InputHandler3D
│   ├── entities/
│   │   ├── player.js   # Player3D class
│   │   ├── enemy.js    # Enemy3D class
│   │   ├── effects.js  # AttackVFX, DamageNumber, Particle
│   │   └── zone.js     # FireZone, Projectile
│   ├── ui/
│   │   ├── hud.js      # HP bar, EXP bar, Timer updates
│   │   └── menus.js    # Start, Upgrade, Death menus logic
│   └── utils/
│       ├── math.js     # Vector math, intersection helpers
│       ├── audio.js    # playSound logic
│       └── world.js    # spawnWave, generateGrass, level progression
```

## 2. Communication Strategy
- **Central Event Hub:** A simple `EventEmitter` to decoupled entities.
  - `events.emit('enemy_died', enemyData)`
  - `events.emit('player_hit', damage)`
- **Global State:** A single source of truth for game variables (gold, level, time).

## 3. Migration Steps
1. **Preparation:** Create directory structure.
2. **Phase 1: Extraction (Low Risk):** Move Constants (Data) and Utils.
3. **Phase 2: Core Classes:** Extract `Player3D`, `Enemy3D`, etc.
4. **Phase 3: Engine Setup:** Extract Three.js initialization and `animate` loop.
5. **Phase 4: UI Logic:** Extract DOM manipulations.
6. **Phase 5: Integration:** Wire everything in `index.js`.

## 4. Extensibility
- **Meta-Progression:** Easily add `src/data/persistent.js`.
- **New Enemies:** Just add to `src/data/config.js` or create a new factory.
- **Multiple Characters:** `Player3D` becomes a base class.
