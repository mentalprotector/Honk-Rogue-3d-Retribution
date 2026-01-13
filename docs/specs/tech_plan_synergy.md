# Technical Plan: Synergy System Implementation

## 1. Overview
The Synergy System requires modifying the `showUpgradeMenu` function in `src/ui/menus.js` to replace flat random selection with a weighted random selection based on the player's existing tags.

## 2. Data Structure (`src/data/registry.js`)
Add `tags: string[]` to the `UPGRADES_REGISTRY` schema.
Example:
```javascript
{ id: 'knife', ..., tags: ['melee', 'physical', 'bleed'] }
```

## 3. Algorithm Implementation (`src/ui/menus.js`)

### A. Helper Function: `calculateWeights`
```javascript
function calculateWeights(pool, playerInventory) {
    // 1. Extract all tags from player's inventory
    const playerTags = new Set();
    playerInventory.forEach(item => item.tags.forEach(t => playerTags.add(t)));
    
    // 2. Map pool to objects with weight
    return pool.map(item => {
        let weight = 100;
        if (item.tags) {
            const matchCount = item.tags.filter(t => playerTags.has(t)).length;
            weight += matchCount * 50;
        }
        return { item, weight };
    });
}
```
*Note: Since `player` object might not store the full `registry` objects but just IDs or special flags (like `hasSwiftFeathers`), we might need to look up the tags for owned items using `UPGRADES_REGISTRY`.*

### B. Helper Function: `pickWeighted`
Standard weighted random picker.
```javascript
function pickWeighted(weightedPool) {
    const totalWeight = weightedPool.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * totalWeight;
    for (const entry of weightedPool) {
        r -= entry.weight;
        if (r <= 0) return entry.item;
    }
    return weightedPool[0].item;
}
```

### C. Logic Injection in `showUpgradeMenu`
Currently, `showUpgradeMenu` manually builds `choices` array based on level conditions (e.g., Level 1 always gives Weapon choices).
We need to hook into the "General Pool" generation (likely `fullPool` around line 93).

**Change:**
Instead of `const picked = pool[Math.floor(Math.random() * pool.length)]`, use:
```javascript
const weightedPool = calculateWeights(pool, player); // Logic to extract tags from player state
const picked = pickWeighted(weightedPool);
```

## 4. Slot Logic
*   **Slot 1 & 2:** Use `pickWeighted`.
*   **Slot 3:** Use standard random (for variety).

## 5. Execution Steps
1.  **Coder 1:** Update `src/data/registry.js` with tags for all items (Ref: `docs/specs/synergy_system_v1.md`).
2.  **Coder 2:** Refactor `src/ui/menus.js` to include the `calculateWeights` and `pickWeighted` helpers and apply them to the selection logic.
