# Upgrade Logic V2: Fair Loot Distribution

## 1. Problem Analysis
**Current State:**
- Logic resides in `src/ui/menus.js` (View coupled with Logic).
- **Critical Bug:** `getWeightedFromPool` only removes items if `maxLevel === 1`. This allows Multi-Level items (like "Flame Wake") to appear multiple times in a single hand (e.g., Slots 1, 2, and 3 are all "Flame Wake").
- **RNG:** Pure Weighted Random. Can lead to "Streaks" (seeing same unwanted item 5 times in a row) or "Starvation" (never seeing a desired weapon).

## 2. Core Requirements
1.  **Guaranteed Variety:** The 3 options presented in a single "Level Up" event MUST be unique (Distinct IDs).
2.  **Fairness:** A mechanism to prevent "Bad Luck" and "Repetition Fatigue".
3.  **Synergy:** Maintain the current Tag-based weighting system.

## 3. The Solution: "Smart Deck" System

We will move loot logic to `src/core/loot.js`.

### A. The "Hand" Generation Algorithm
To ensure 3 unique options, we strictly remove selected items from the temporary pool for the current hand.

```javascript
// Pseudo-code
function generateLootOptions(player, registry, count = 3) {
    let pool = registry.filter(u => !isMaxed(player, u));
    let options = [];
    
    // 1. Anti-Repetition (Fairness)
    // Reduce weight of items seen in the *previous* hand but skipped.
    applyFatigue(pool, player.lastSeenOptions); 

    for (let i = 0; i < count; i++) {
        if (pool.length === 0) break;
        
        // Recalculate weights (dynamic)
        let weightedPool = calculateWeights(pool, player);
        
        // Pick
        let picked = pickWeighted(weightedPool);
        
        // Add to Hand
        options.push(picked);
        
        // CRITICAL: Remove from temp pool to prevent duplicates in THIS hand
        pool = pool.filter(u => u.id !== picked.id);
    }
    
    return options;
}
```

### B. Fair RNG: The "Fatigue" System
Instead of a complex "Bag" (which conflicts with infinite scaling stats), we use **Selection Fatigue**.

*   **Rule:** If an Upgrade ID was presented in the *immediately preceding* Level Up and was **NOT** picked, its weight is multiplied by **0.2** (Heavy penalty) for the current roll.
*   **Result:** Players are unlikely to see the exact same 3 options twice in a row.
*   **Reset:** Fatigue clears after 1 turn of absence.

### C. Weighting Standard
Standardize the weight curve to ensure Rarity matters.

| Rarity Tier | Base Weight | Description |
|:-----------|:-----------:|:------------|
| **Common** | 100 | Stats, Basic Mods |
| **Uncommon**| 60 | Good Passives |
| **Rare** | 30 | Strong Weapons, Synergies |
| **Legendary**| 10 | Game-changing Aspects |

**Synergy Bonus:** +50 Weight per matching Tag.

## 4. Implementation Plan
1.  **Create `src/core/loot.js`**:
    *   `calculateWeights(pool, player)`
    *   `getUpgradeChoices(player, registry)`
2.  **Refactor `src/ui/menus.js`**:
    *   Remove inline logic.
    *   Call `loot.getUpgradeChoices()`.
3.  **Update Player State**:
    *   Add `player.lastSeenOptions = []` to track history for Fatigue system.

## 5. Edge Cases
*   **Pool < 3:** If only 1 or 2 valid upgrades remain, show only those.
*   **Forced Drops:** Boss chests might force specific rarities (handling in `loot.js` via options param).
