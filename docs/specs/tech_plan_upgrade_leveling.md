# TECH-004: Upgrade Leveling Implementation Plan

## 1. Data Structure Updates

### 1.1 Registry (`src/data/registry.js`)
Extend `UPGRADES_REGISTRY` items with a `scaling` property.
```javascript
{
    id: 'spd',
    // ... existing fields
    maxLevel: 5,
    scaling: {
        stat: 'permanentSpeedMul',
        increment: 0.1,
        type: 'add' // additive increment
    }
}
```

### 1.2 Player State (`src/entities/player.js`)
- Replace `this.collectedUpgrades = []` with `this.upgradeLevels = {}` (Key: upgrade ID, Value: level).
- Update `this.reset()` to clear `upgradeLevels`.

## 2. Logic Changes

### 2.1 Applying Upgrades
Implement a centralized `addUpgrade(id)` method in `Player3D`.
1. **Level Check:** Increment `this.upgradeLevels[id]`.
2. **Binary Flag:** Set `this.has[UpgradeName] = true` if level === 1.
3. **Stat Scaling:**
   - If the upgrade has a `scaling` config, apply the increment.
   - Formula: `CurrentStatValue += scaling.increment`.
4. **Specific Logic:** Use a switch or lookup table for complex upgrades (e.g., weapon damage, dash duration).

### 2.2 Upgrade Selection Pool (`src/ui/menus.js`)
Refactor the pool generation logic:
1. **Filtering:** 
   - Exclude upgrades where `upgradeLevels[id] >= maxLevel`.
   - Allow duplicates (already owned) to appear in the pool.
2. **Weighting (Optional):** Give a slight weight boost to already owned upgrades to encourage specialized builds.

### 2.3 UI Rendering
Update `showUpgradeMenu` to pass the current level to the UI generator.
- **Badge:** Display `Lv. ${level + 1}` if owned.
- **Comparison:** Show `Stat: X -> Y`.

## 3. Performance Considerations
- **Memory:** `upgradeLevels` is a small object, negligible impact.
- **Stat Recalculation:** Perform stat recalculations only on upgrade selection, not in the game loop.
- **UI:** The preview calculation must be efficient (pre-calculated or cached).

## 4. Test Cases
- **Case 1:** Select 'Coffee' twice. Speed should be 1.0 -> 1.1 -> 1.2.
- **Case 2:** Select 'Golden Egg' at Level 10. It should no longer appear in the pool.
- **Case 3:** Reset game. All levels should return to 0/empty.
