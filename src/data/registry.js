export const UPGRADES_REGISTRY = [
    // Weapons (Replace Peck)
    { id: 'knife', name: 'Serrated Beak', type: 'weapon', rarity: [1, 5], desc: 'Melee. Causes BLEED (DoT).', color: '#bdc3c7', tags: ['melee', 'physical', 'bleed'], maxLevel: 5, scaling: { stat: 'bleedDmg', increment: 0.5 } },
    { id: 'bat', name: 'Baseball Bat', type: 'weapon', rarity: [1, 5], desc: 'Wide Swing AOE Damage.', color: '#8e44ad', tags: ['melee', 'physical', 'aoe', 'control'], maxLevel: 5, scaling: { stat: 'damage', increment: 2 } },
    { id: 'shuriken', name: 'Shuriken', type: 'weapon', rarity: [1, 5], desc: 'Ranged Projectile.', color: '#f1c40f', tags: ['ranged', 'physical'], maxLevel: 5, scaling: { stat: 'damage', increment: 1 } },
    { id: 'grimoire', name: 'Grimoire', type: 'weapon', rarity: [3, 5], desc: 'Charge up magic blast. Hold to cast.', color: '#9b59b6', tags: ['ranged', 'magic'], maxLevel: 5, scaling: { stat: 'damage', increment: 2 } },
    { id: 'molten_breath', name: 'Molten Breath', type: 'weapon', rarity: [3, 5], desc: 'Cone of Fire. Ignites enemies.', color: '#e67e22', tags: ['magic', 'fire', 'aoe'], maxLevel: 5, scaling: { stat: 'damage', increment: 1 } },
    { id: 'icicle_spit', name: 'Icicle Spit', type: 'weapon', rarity: [2, 5], desc: 'Fires icicles. Chills enemies.', color: '#3498db', tags: ['ranged', 'ice', 'control'], maxLevel: 5, scaling: { stat: 'damage', increment: 1 } },
    { id: 'void_orb', name: 'Void Orb', type: 'weapon', rarity: [4, 5], desc: 'Slow, wall-passing Orb of Death.', color: '#8e44ad', tags: ['ranged', 'magic', 'aoe'], maxLevel: 5, scaling: { stat: 'damage', increment: 3 } },
    
    // Aspects (Available after Level 5/Boss 1)
    { id: 'grimoire_speed', name: 'Chronos Page', type: 'aspect', weapon: 'grimoire', desc: '-0.3s charge time.', color: '#8e44ad', tags: ['magic', 'speed'], maxLevel: 5, scaling: { stat: 'chargeTimeBonus', increment: 0.1 } },
    { id: 'grimoire_power', name: 'Void Ink', type: 'aspect', weapon: 'grimoire', desc: '+50% magic damage.', color: '#2c3e50', tags: ['magic', 'aoe'], maxLevel: 5, scaling: { stat: 'damageMul', increment: 0.2 } },
    { id: 'sstar_multi', name: 'S-Star: Multi', type: 'aspect', weapon: 'shuriken', desc: 'Fire 3 stars in a spread.', color: '#f39c12', tags: ['ranged', 'aoe'], maxLevel: 1 },
    { id: 'sstar_pierce', name: 'S-Star: Pierce', type: 'aspect', weapon: 'shuriken', desc: 'Stars fly through enemies.', color: '#e67e22', tags: ['ranged', 'aoe'], maxLevel: 1 },
    { id: 'knife_machete', name: 'Knife: Machete', type: 'aspect', weapon: 'knife', desc: 'Huge range and crit chance.', color: '#95a5a6', tags: ['melee', 'crit', 'bleed'], maxLevel: 1 },
    { id: 'knife_kukri', name: 'Knife: Kukri', type: 'aspect', weapon: 'knife', desc: 'Slower but deals POISON.', color: '#2ecc71', tags: ['melee', 'poison'], maxLevel: 1 },
    { id: 'bat_stun', name: 'Bat: Heavy', type: 'aspect', weapon: 'bat', desc: 'Stuns every 4th hit (0.5s).', color: '#34495e', tags: ['melee', 'control'], maxLevel: 5, scaling: { stat: 'stunDuration', increment: 0.25 } },
    { id: 'bat_knockback', name: 'Bat: Impact', type: 'aspect', weapon: 'bat', desc: 'Extreme knockback force.', color: '#d35400', tags: ['melee', 'control'], maxLevel: 5, scaling: { stat: 'knockbackForce', increment: 10 } },
    { id: 'peck_frenzy', name: 'Peck: Frenzy', type: 'aspect', weapon: 'peck', desc: 'Insane attack speed.', color: '#e74c3c', tags: ['melee', 'speed'], maxLevel: 5, scaling: { stat: 'frenzySpeed', increment: 0.1 } },
    { id: 'peck_behemoth', name: 'Peck: Behemoth', type: 'aspect', weapon: 'peck', desc: 'One-shot potential damage.', color: '#c0392b', tags: ['melee', 'crit'], maxLevel: 1 },

    // Dash Mods (Mutually Exclusive)
    { id: 'dash_pierce', name: 'Piercing Dash', type: 'dash_mod', desc: 'Damages enemies along the path.', color: '#ecf0f1', tags: ['dash', 'physical'], maxLevel: 5, scaling: { stat: 'dashDmg', increment: 1 } },
    { id: 'dash_fire', name: 'Flame Wake', type: 'dash_mod', desc: 'Leaves a burning fire trail.', color: '#e67e22', tags: ['dash', 'fire', 'magic'], maxLevel: 5, scaling: { stat: 'dashDmg', increment: 0.5 } },
    { id: 'dash_angry', name: 'Angry Dash', type: 'dash_mod', desc: '2 DMG + STUN at end of dash.', color: '#e74c3c', tags: ['dash', 'control', 'physical'], maxLevel: 5, scaling: { stat: 'dashDmg', increment: 2 } },
    { id: 'dash_ice', name: 'Ice Dash', type: 'dash_mod', desc: 'Freezes enemies at start point.', color: '#3498db', tags: ['dash', 'ice', 'magic', 'control'], maxLevel: 5, scaling: { stat: 'freezeDuration', increment: 0.5 } },
    { id: 'glacial_path', name: 'Glacial Path', type: 'dash_mod', desc: 'Leaves an ice trail. Chills enemies.', color: '#00ffff', tags: ['dash', 'ice', 'control'], maxLevel: 5, scaling: { stat: 'freezeDuration', increment: 0.5 } },
    { id: 'razor_wind', name: 'Razor Wind', type: 'dash_mod', desc: 'Dash applies BLEED to enemies.', color: '#c0392b', tags: ['dash', 'bleed', 'physical'], maxLevel: 5, scaling: { stat: 'dashDmg', increment: 0.5 } },
    { id: 'blink', name: 'Blink', type: 'dash_mod', desc: 'Instant teleport.', color: '#9b59b6', tags: ['dash', 'magic'], maxLevel: 5, scaling: { stat: 'blinkRange', increment: 2.0 } },
    { id: 'momentum_dash', name: 'Momentum', type: 'dash_mod', desc: '-CD based on Combo.', color: '#f1c40f', tags: ['dash', 'speed'], maxLevel: 5, scaling: { stat: 'momentumCD', increment: 0.05 } },

    // Buffs
    { id: 'swift_feathers', name: 'Swift Feathers', type: 'passive', rarity: [1, 10], desc: 'Dash: Longer range + Faster CD.', color: '#3498db', tags: ['dash', 'speed'], maxLevel: 5, scaling: { stat: 'dashSpeed', increment: 0.15 } },
    { id: 'iron_beak', name: 'Iron Beak', type: 'passive', rarity: [1, 10], desc: '+2 Damage to all Melee.', color: '#7f8c8d', tags: ['melee', 'physical'], maxLevel: 5, scaling: { stat: 'damage', increment: 2 } },
    { id: 'blood_scent', name: 'Blood Scent', type: 'passive', rarity: [3, 8], desc: '+Speed for bleeding enemies nearby.', color: '#880000', tags: ['speed', 'bleed'], maxLevel: 5, scaling: { stat: 'speedBonus', increment: 0.05 } },
    { id: 'exsanguinate', name: 'Exsanguinate', type: 'passive', rarity: [5, 10], desc: 'Melee hits pop Bleed for instant DMG.', color: '#7f0000', tags: ['melee', 'bleed', 'crit'], maxLevel: 1 },
    { id: 'combustion', name: 'Combustion', type: 'passive', rarity: [3, 8], desc: 'Burning enemies explode on death.', color: '#e67e22', tags: ['fire', 'aoe'], maxLevel: 5, scaling: { stat: 'aoeRange', increment: 0.5 } },
    { id: 'shatter', name: 'Shatter', type: 'passive', rarity: [4, 9], desc: '+50% Crit Chance vs Frozen.', color: '#00ffff', tags: ['ice', 'crit'], maxLevel: 1 },
    { id: 'ice_armor', name: 'Ice Armor', type: 'passive', rarity: [4, 9], desc: '-15% Dmg taken. Freeze attacker.', color: '#bdc3c7', tags: ['defense', 'ice'], maxLevel: 5, scaling: { stat: 'defense', increment: 0.05 } },
    { id: 'rhythm_strike', name: 'Rhythm Strike', type: 'passive', rarity: [3, 8], desc: 'Every 10th hit = 3x DMG.', color: '#e74c3c', tags: ['melee', 'crit'], maxLevel: 5, scaling: { stat: 'critMulti', increment: 0.5 } },
    { id: 'glass_cannon', name: 'Glass Cannon', type: 'passive', rarity: [4, 9], desc: '+30% Dmg. Hit resets Combo.', color: '#c0392b', tags: ['crit', 'physical'], maxLevel: 5, scaling: { stat: 'damageMul', increment: 0.1 } },
    { id: 'echo', name: 'Echo', type: 'passive', rarity: [4, 9], desc: '20% chance to duplicate projectiles.', color: '#3498db', tags: ['ranged', 'magic'], maxLevel: 5, scaling: { stat: 'procChance', increment: 0.1 } },
    { id: 'sniper', name: 'Sniper', type: 'passive', rarity: [3, 8], desc: '+Dmg at long range.', color: '#2ecc71', tags: ['ranged', 'physical'], maxLevel: 5, scaling: { stat: 'damageMul', increment: 0.15 } },

    // Stats
    { id: 'hp', name: 'Golden Egg', type: 'stat', rarity: [1, 10], desc: '+1 Max HP & Heal 25%.', color: '#f1c40f', tags: ['defense'], maxLevel: 10, scaling: { stat: 'maxHp', increment: 1 } },
    { id: 'spd', name: 'Coffee', type: 'stat', rarity: [1, 10], desc: 'Move Speed +10%.', color: '#d35400', tags: ['speed'], maxLevel: 5, scaling: { stat: 'speedMul', increment: 0.1 } },
    { id: 'dash_cd', name: 'Energy Drink', type: 'stat', rarity: [1, 10], desc: 'Dash Cooldown -0.5s.', color: '#00cec9', tags: ['dash', 'speed'], maxLevel: 5, scaling: { stat: 'dashCd', increment: 0.25 } }
];