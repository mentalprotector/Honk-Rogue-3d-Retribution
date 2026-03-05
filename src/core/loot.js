import { UPGRADES_REGISTRY } from '../data/registry.js';

/**
 * Smart Deck Loot System
 * Implements "Upgrade Logic V2" from docs/specs/upgrade_logic_v2.md
 */

/**
 * Calculates the drop weight for an upgrade item based on player state and synergies.
 * @param {Object} item - The upgrade item from registry.
 * @param {Object} player - The player entity.
 * @param {Set} playerTags - Pre-calculated set of tags the player already has.
 * @returns {number} The calculated weight.
 */
function calculateWeight(item, player, playerTags) {
    // 1. Base Weight by Type/Rarity inference
    // Standardize the weight curve to ensure Rarity matters.
    let weight = 100; // Default Common
    
    if (item.type === 'weapon') weight = 30; // Rare
    else if (item.type === 'aspect') weight = 10; // Legendary
    else if (item.type === 'passive') weight = 60; // Uncommon
    else if (item.type === 'stat') weight = 100; // Common
    else if (item.type === 'dash_mod') weight = 40; // Rare-ish

    // 2. Synergy Bonus: +50 Weight per matching Tag
    if (item.tags && playerTags.size > 0) {
        const matchCount = item.tags.filter(t => playerTags.has(t)).length;
        weight += matchCount * 50;
    }

    // 3. Weapon Specificity: Bonus for aspects matching current weapon
    if (item.type === 'aspect' && item.weapon === player.weapon) {
        weight += 200; // Massive boost to ensure weapon pathing feels intentional
    }

    // 4. Fatigue System (Anti-Repetition)
    // If the item was seen in the immediately preceding Level Up and was NOT picked,
    // its weight is multiplied by 0.2 (Heavy penalty).
    if (player.lastSeenOptions && player.lastSeenOptions.includes(item.id)) {
        weight *= 0.2; 
    }

    return Math.max(1, weight);
}

/**
 * Picks a random item from a weighted pool.
 * @param {Array<{item: Object, weight: number}>} weightedPool 
 * @returns {Object|null} The selected item.
 */
function pickWeighted(weightedPool) {
    if (weightedPool.length === 0) return null;
    
    const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
    let r = Math.random() * totalWeight;
    
    for (const entry of weightedPool) {
        r -= entry.weight;
        if (r <= 0) return entry.item;
    }
    return weightedPool[weightedPool.length - 1].item;
}

/**
 * Checks if an upgrade is fully maxed out for the player.
 * @param {Object} player 
 * @param {Object} u 
 * @returns {boolean}
 */
function isMaxed(player, u) {
    const currentLevel = player.upgradeLevels[u.id] || 0;
    return currentLevel >= (u.maxLevel || 1);
}

/**
 * Generates a list of upgrade choices for the Level Up menu.
 * @param {Object} player - The player entity.
 * @param {number} level - Current player level (for unlocks).
 * @param {number} count - Number of choices to return (default 3).
 * @returns {Array<Object>} Array of selected upgrade items.
 */
export function getUpgradeChoices(player, level, count = 3) {
    // 0. Pre-calculate Player Tags for synergy efficiency
    const playerTags = new Set();
    if (player.upgradeLevels) {
        for (const id in player.upgradeLevels) {
            const u = UPGRADES_REGISTRY.find(up => up.id === id);
            if (u && u.tags) {
                u.tags.forEach(t => playerTags.add(t));
            }
        }
    }

    // 1. Filter Valid Pool
    let pool = UPGRADES_REGISTRY.filter(u => {
        // Check Max Level
        if (isMaxed(player, u)) return false;

        // Check Min Level Requirement (rarity[0] is used as min unlock level)
        if (u.rarity && level < u.rarity[0]) return false;

        // Aspects: MUST match current weapon
        if (u.type === 'aspect' && u.weapon !== player.weapon) return false;

        return true;
    });

    const options = [];

    // Helper to pick N unique items from a specific sub-pool
    // ENSURES UNIQUENESS: Removed items are filtered from main pool to prevent duplicates in THIS hand
    const pickUnique = (subPool, n, useWeights = true) => {
        for (let i = 0; i < n; i++) {
            if (subPool.length === 0) break;
            
            let weighted;
            if (useWeights) {
                weighted = subPool.map(u => ({ item: u, weight: calculateWeight(u, player, playerTags) }));
            } else {
                weighted = subPool.map(u => ({ item: u, weight: 100 })); // Flat weight for Wildcard slots
            }
            
            const picked = pickWeighted(weighted);
            if (picked) {
                options.push(picked);
                // CRITICAL: Remove from pool to prevent duplicates in this hand
                pool = pool.filter(u => u.id !== picked.id);
                subPool = subPool.filter(u => u.id !== picked.id);
            }
        }
    };

    // --- Progression Guard (Levels 1-5) ---
    // Ensuring basic kit is offered early
    if (level === 1) {
        const knife = pool.find(u => u.id === 'knife');
        if (knife) {
            options.push(knife);
            pool = pool.filter(u => u.id !== 'knife');
        }
    } else if (level === 2) {
        const bat = pool.find(u => u.id === 'bat');
        if (bat) {
            options.push(bat);
            pool = pool.filter(u => u.id !== 'bat');
        }
    } else if (level === 3) {
        const shuriken = pool.find(u => u.id === 'shuriken');
        if (shuriken) {
            options.push(shuriken);
            pool = pool.filter(u => u.id !== 'shuriken');
        }
    } else if (level === 4) {
        const grimoire = pool.find(u => u.id === 'grimoire');
        if (grimoire) {
            options.push(grimoire);
            pool = pool.filter(u => u.id !== 'grimoire');
        }
    } else if (level === 5) {
        // Guaranteed Aspect slot for weapon diversity
        const aspects = pool.filter(u => u.type === 'aspect');
        pickUnique(aspects, 1);
    }
    
    // --- Fill Remaining Slots ---
    const remaining = count - options.length;
    if (remaining > 0) {
        // Rule: At least 1 slot should be a "Wildcard" (Flat weights) to prevent RNG traps
        const weightedSlots = Math.max(0, remaining - 1);
        const wildcardSlots = remaining - weightedSlots;
        
        pickUnique(pool, weightedSlots, true);  // Smart Slots (Synergy + Fatigue)
        pickUnique(pool, wildcardSlots, false); // Wildcard Slot (Pure Random)
    }

    // Update Player's History for Fatigue System
    // We update it here with current options. 
    // In menus.js, the picked option will be removed from this list.
    player.lastSeenOptions = options.map(u => u.id);

    return options;
}
