import { UPGRADES_REGISTRY } from '../data/registry.js';

function calculateWeights(pool, player) {
    const playerTags = new Set();
    if (player.upgradeLevels) {
        for (const id in player.upgradeLevels) {
            const u = UPGRADES_REGISTRY.find(up => up.id === id);
            if (u && u.tags) u.tags.forEach(t => playerTags.add(t));
        }
    }

    return pool.map(item => {
        let weight = 100;
        if (item.tags) {
            const matchCount = item.tags.filter(t => playerTags.has(t)).length;
            weight += matchCount * 50;
        }
        return { item, weight };
    });
}

function pickWeighted(weightedPool) {
    if (weightedPool.length === 0) return null;
    const totalWeight = weightedPool.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * totalWeight;
    for (const entry of weightedPool) {
        r -= entry.weight;
        if (r <= 0) return entry.item;
    }
    return weightedPool[0].item;
}

export function setGameStateUI(newState, STATE_ENUM, options = {}) {
    const uiMenu = document.getElementById('menu-overlay');
    const uiTitle = document.getElementById('menu-title');
    const uiSub = document.getElementById('menu-subtitle');
    const btnStart = document.getElementById('btn-start');
    const btnResume = document.getElementById('btn-resume');
    const btnRestart = document.getElementById('btn-restart');

    if (!uiMenu) return;

    uiMenu.style.display = 'none';
    if (btnStart) btnStart.style.display = 'none';
    if (btnResume) btnResume.style.display = 'none';
    if (btnRestart) btnRestart.style.display = 'none';

    if (newState === STATE_ENUM.MENU) {
        uiMenu.style.display = 'flex';
        if (uiTitle) uiTitle.innerText = "HONK ROGUE";
        if (uiSub) uiSub.innerText = "The 5h Gemini Challenge";
        if (btnStart) {
            btnStart.style.display = 'block';
            btnStart.innerText = "START GAME";
        }
    } 
    else if (newState === STATE_ENUM.PAUSED) {
        uiMenu.style.display = 'flex';
        if (uiTitle) uiTitle.innerText = "PAUSED";
        if (uiSub) uiSub.innerText = "5h Challenge Edition";
        if (btnResume) btnResume.style.display = 'block';
        if (btnRestart) btnRestart.style.display = 'block';
    }
    else if (newState === STATE_ENUM.GAMEOVER) {
        uiMenu.style.display = 'flex';
        if (uiTitle) uiTitle.innerText = "YOU DIED";
        if (uiSub) uiSub.innerText = "The Goose has fallen.";
        if (btnRestart) btnRestart.style.display = 'block';
    }
    else if (newState === STATE_ENUM.VICTORY) {
        uiMenu.style.display = 'flex';
        if (uiTitle) uiTitle.innerText = "VICTORY!";
        if (uiSub) uiSub.innerText = "WINNER WINNER CHICKEN DINNER";
        if (btnRestart) btnRestart.style.display = 'block';
    }
}

export function showUpgradeMenu(player, level, UPGRADES_REGISTRY, callbacks = {}) {
    const uiUpgrade = document.getElementById('upgrade-overlay');
    const cardsContainer = document.getElementById('cards-container');
    if (!uiUpgrade || !cardsContainer) return;

    uiUpgrade.style.display = 'flex';
    cardsContainer.innerHTML = '';
    if (callbacks.playSound) callbacks.playSound('upgrade');

    const choices = [];
    
    // Helper to pick N items using weighted logic
    const getWeightedFromPool = (pool, count = 1) => {
        const selected = [];
        let currentPool = [...pool];
        for(let i=0; i<count; i++) {
            if (currentPool.length === 0) break;
            const weighted = calculateWeights(currentPool, player);
            const picked = pickWeighted(weighted);
            if (picked) {
                selected.push(picked);
                // Only remove from pool if it's a one-time upgrade OR if we want to force variety
                // To allow 'duplicate drops' (multiple cards of same upgrade), we only filter if maxLevel is 1
                if (picked.maxLevel === 1) {
                    currentPool = currentPool.filter(u => u.id !== picked.id);
                }
            }
        }
        return selected;
    };

    const isMaxed = (u) => {
        const currentLevel = player.upgradeLevels[u.id] || 0;
        return currentLevel >= (u.maxLevel || 1);
    };

    const fullPool = UPGRADES_REGISTRY.filter(u => !isMaxed(u));

    if (level <= 5) {
        const dashPool = fullPool.filter(u => u.type === 'dash_mod');
        const statPool = fullPool.filter(u => u.type === 'stat');
        const passivePool = fullPool.filter(u => u.type === 'passive');

        if (level === 1) {
            const knife = fullPool.find(u => u.id === 'knife');
            if (knife) choices.push(knife);
            choices.push(...getWeightedFromPool(dashPool, 1));
            choices.push(...getWeightedFromPool(statPool, 1));
        } else if (level === 2) {
            const bat = fullPool.find(u => u.id === 'bat');
            if (bat) choices.push(bat);
            choices.push(...getWeightedFromPool(dashPool, 1));
            choices.push(...getWeightedFromPool(statPool, 1));
        } else if (level === 3) {
            const shuriken = fullPool.find(u => u.id === 'shuriken');
            if (shuriken) choices.push(shuriken);
            choices.push(...getWeightedFromPool(dashPool, 1));
            choices.push(...getWeightedFromPool(statPool, 1));
        } else if (level === 4) {
            const grimoire = fullPool.find(u => u.id === 'grimoire');
            if (grimoire) choices.push(grimoire);
            choices.push(...getWeightedFromPool(passivePool, 1));
            choices.push(...getWeightedFromPool(statPool, 1));
        } else if (level === 5) {
            const aspects = fullPool.filter(u => u.type === 'aspect' && u.weapon === player.weapon);
            choices.push(...aspects.slice(0, 3));
        }
        
        // Fill remaining slots
        while (choices.length < 3) {
            const filler = getWeightedFromPool(fullPool.filter(u => !choices.find(c => c.id === u.id)), 1)[0];
            if (filler) choices.push(filler);
            else break;
        }
    } else {
        let replacementsOffered = 0;
        const pool = fullPool.filter(u => {
            if (choices.find(c => c.id === u.id)) return false;
            
            // Limit replacements (swapping weapons/aspects) to 1 per menu
            const isWeaponSwap = u.type === 'weapon' && player.weapon !== 'peck' && u.id !== player.weapon;
            const isAspectSwap = u.type === 'aspect' && player.aspect && u.id !== player.aspect;
            const isDashSwap = u.type === 'dash_mod' && player.dashMod && u.id !== player.dashMod;
            const isSwap = isWeaponSwap || isAspectSwap || isDashSwap;

            if (isSwap && replacementsOffered >= 1) return false;
            if (isSwap) replacementsOffered++;
            
            // Aspect filtering: only show aspects for the current weapon
            if (u.type === 'aspect' && u.weapon !== player.weapon) return false;
            
            return true;
        });

        // Pick 3 Weighted
        const picked = getWeightedFromPool(pool, 3);
        choices.push(...picked);
    }

    choices.slice(0, 3).forEach((u, index) => {
        const card = document.createElement('div');
        card.className = "glass-panel upgrade-card";
        const iconMap = {
            'knife': '🔪', 'bat': '🏏', 'shuriken': '🌟', 'grimoire': '📖',
            'sstar_multi': '🔱', 'sstar_pierce': '🏹',
            'knife_machete': '⚔️', 'knife_kukri': '🧪',
            'bat_stun': '💫', 'bat_knockback': '🔨',
            'peck_frenzy': '⚡', 'peck_behemoth': '🦅',
            'grimoire_speed': '⏳', 'grimoire_power': '💀',
            'dash_pierce': '💨', 'dash_fire': '🔥', 'dash_angry': '💢', 'dash_ice': '❄️', 'razor_wind': '🩸', 'glacial_path': '⛸️',
            'swift_feathers': '🪶', 'iron_beak': '🦾', 'blood_scent': '🐺', 'exsanguinate': '💉', 'combustion': '💥',
            'shatter': '🔨', 'ice_armor': '🛡️',
            'molten_breath': '🐲', 'icicle_spit': '🧊', 'void_orb': '🔮',
            'blink': '✨', 'momentum_dash': '⏩',
            'rhythm_strike': '🥁', 'glass_cannon': '🍷', 'echo': '🔊', 'sniper': '🎯',
            'hp': '🥚', 'spd': '☕', 'dash_cd': '🥤'
        };
        const cardIcon = iconMap[u.id] || '✨';
        const currentLevel = player.upgradeLevels[u.id] || 0;
        
        let replacesText = "";
        const isSwap = (u.type === 'weapon' && player.weapon !== 'peck' && u.id !== player.weapon) ||
                       (u.type === 'aspect' && player.aspect && u.id !== player.aspect) ||
                       (u.type === 'dash_mod' && player.dashMod && u.id !== player.dashMod);
        
        if (isSwap) {
            let currentName = "Unknown";
            if (u.type === 'weapon') currentName = UPGRADES_REGISTRY.find(item => item.id === player.weapon)?.name || player.weapon;
            if (u.type === 'aspect') currentName = UPGRADES_REGISTRY.find(item => item.id === player.aspect)?.name || player.aspect;
            if (u.type === 'dash_mod') currentName = UPGRADES_REGISTRY.find(item => item.id === player.dashMod)?.name || player.dashMod;
            replacesText = `<div style="color: #ff7675; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase;">⚠️ REPLACES: ${currentName}</div>`;
        }

        const levelBadge = `<div style="position: absolute; top: 10px; right: 10px; background: ${u.color}; color: black; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">Lv. ${currentLevel + 1}</div>`;
        
        let scalingText = "";
        if (u.scaling) {
            const inc = u.scaling.increment;
            const stat = u.scaling.stat;
            let currentVal = 0;
            let nextVal = 0;
            
            if (u.id === 'hp') {
                currentVal = currentLevel;
                nextVal = currentLevel + 1;
            } else if (u.id === 'spd') {
                currentVal = currentLevel * 10;
                nextVal = (currentLevel + 1) * 10;
            } else if (u.id === 'dash_cd') {
                if (currentLevel === 0) {
                    currentVal = 0;
                    nextVal = 0.5;
                } else {
                    currentVal = 0.5 + (currentLevel - 1) * 0.25;
                    nextVal = currentVal + 0.25;
                }
            } else if (u.type === 'weapon') {
                const baseMap = { 'knife': 3, 'bat': 5, 'shuriken': 3, 'grimoire': 4, 'molten_breath': 2, 'icicle_spit': 2, 'void_orb': 8 };
                const base = baseMap[u.id] || 0;
                if (currentLevel === 0) {
                    currentVal = 0;
                    nextVal = base;
                } else {
                    currentVal = base + (currentLevel - 1) * inc;
                    nextVal = currentVal + inc;
                }
            } else {
                currentVal = inc * currentLevel;
                nextVal = currentVal + inc;
            }

            const unit = (u.id === 'spd') ? '%' : (u.id === 'dash_cd' ? 's' : '');
            
            if (currentLevel === 0) {
                scalingText = `<div style="color: ${u.color}; font-size: 12px; margin-top: 10px; font-weight: bold; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px;">` +
                              `${stat.toUpperCase()}: ${nextVal}${unit}</div>`;
            } else {
                scalingText = `<div style="color: ${u.color}; font-size: 12px; margin-top: 10px; font-weight: bold; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px;">` +
                              `${stat.toUpperCase()}: ${currentVal}${unit} &rarr; <span style="color:#fff">${nextVal}${unit}</span></div>`;
            }
        } else {
            scalingText = `<div style="color: ${u.color}; font-size: 11px; margin-top: 10px; opacity: 0.8;">One-time Upgrade</div>`;
        }

        card.style.cssText = `
            width: 220px; height: 320px; border: 2px solid ${u.color};
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 25px; cursor: pointer; 
            transform: scale(0.5); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            text-align: center; pointer-events: auto; position: relative;
        `;
        
        setTimeout(() => { card.style.transform = 'scale(1)'; card.style.opacity = '1'; }, index * 150);

        card.innerHTML = `
            ${levelBadge}
            <div style="font-size: 60px; margin-bottom: 20px; filter: drop-shadow(0 0 15px ${u.color}88);">${cardIcon}</div>
            <h3 style="color: ${u.color}; margin: 0 0 12px 0; font-size: 22px;">${u.name}</h3>
            <p style="color: #eee; font-size: 14px; line-height: 1.4; margin: 0;">${u.desc}</p>
            ${scalingText}
            ${replacesText}
        `;
        
        card.onclick = (e) => { e.stopPropagation(); selectUpgrade(u, card, player, UPGRADES_REGISTRY, callbacks); };
        cardsContainer.appendChild(card);
    });

    // Add Skip Button
    const oldSkip = uiUpgrade.querySelector('.skip-button');
    if (oldSkip) oldSkip.remove();

    const skipBtn = document.createElement('button');
    skipBtn.className = "glass-panel skip-button";
    skipBtn.style.cssText = `
        margin-top: 50px; padding: 12px 30px; font-size: 16px; 
        color: #ff7675; border: 2px solid #ff7675; background: rgba(255,118,117,0.1);
        pointer-events: auto; font-family: 'Luckiest Guy', cursive;
    `;
    skipBtn.innerText = "SKIP UPGRADE (CONTINUE)";
    skipBtn.onclick = () => {
        if (callbacks.playSound) callbacks.playSound('click');
        uiUpgrade.style.display = 'none';
        if (callbacks.onTransitionStart) callbacks.onTransitionStart();
    };
    uiUpgrade.appendChild(skipBtn);
}

export function selectUpgrade(u, selectedCardElement, player, UPGRADES_REGISTRY, callbacks = {}) {
    if (selectedCardElement) {
        selectedCardElement.style.transform = 'scale(1.2)';
        selectedCardElement.style.opacity = '0';
        const container = selectedCardElement.parentElement;
        if (container) {
            Array.from(container.children).forEach(child => {
                if (child !== selectedCardElement) {
                    child.style.transform = 'scale(0.5)';
                    child.style.opacity = '0';
                }
            });
        }
    }

    setTimeout(() => {
        player.addUpgrade(u.id, callbacks);

        document.getElementById('upgrade-overlay').style.display = 'none';
        if (callbacks.onTransitionStart) callbacks.onTransitionStart();
        if (callbacks.onUpgradeSelected) callbacks.onUpgradeSelected();
    }, 500);
}

export function toggleStatsPanel(player) {
    const panel = document.getElementById('stats-panel');
    const list = document.getElementById('stats-list');
    if (!panel || !list) return;

    if (panel.style.display === 'flex') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'flex';
        renderStatsList(player, list);
    }
}

function renderStatsList(player, container) {
    container.innerHTML = '';

    // 1. Active Equipment
    const activeSection = document.createElement('div');
    activeSection.style.marginBottom = '15px';

    const getUpgrade = (id) => UPGRADES_REGISTRY.find(u => u.id === id);

    const weapon = getUpgrade(player.weapon) || { name: 'Peck', color: '#f1c40f' };
    const aspect = player.aspect ? getUpgrade(player.aspect) : null;
    const dashMod = player.dashMod ? getUpgrade(player.dashMod) : null;

    const addActive = (label, item) => {
        if (!item) return;
        const level = player.upgradeLevels[item.id] || 1;
        const div = document.createElement('div');
        div.style.marginBottom = '8px';
        div.innerHTML = `<div style="color:#aaa; font-size:9px; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">${label}</div>` +
                        `<div style="color:${item.color || 'white'}; font-weight:bold; font-size:14px;">${item.name} <span style="font-size: 10px; opacity: 0.7;">Lv.${level}</span></div>`;
        activeSection.appendChild(div);
    };

    addActive('Active Weapon', weapon);
    if (aspect) addActive('Current Aspect', aspect);
    if (dashMod) addActive('Dash Mutation', dashMod);

    container.appendChild(activeSection);

    // 2. Passives & Stats
    const passives = [];
    for (const [id, level] of Object.entries(player.upgradeLevels)) {
        const u = getUpgrade(id);
        if (!u) continue;
        if (u.type === 'weapon' || u.type === 'aspect' || u.type === 'dash_mod') continue;
        passives.push({ ...u, level });
    }

    if (passives.length > 0) {
        const passTitle = document.createElement('div');
        passTitle.style.color = '#aaa';
        passTitle.style.fontSize = '9px';
        passTitle.style.textTransform = 'uppercase';
        passTitle.style.letterSpacing = '1px';
        passTitle.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        passTitle.style.marginBottom = '8px';
        passTitle.style.paddingBottom = '4px';
        passTitle.innerText = 'Passives & Stats';
        container.appendChild(passTitle);

        passives.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.marginBottom = '5px';
            row.innerHTML = `<span style="color: ${item.color || 'white'}; font-size: 12px;">${item.name}</span><span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">Lv.${item.level}</span>`;
            container.appendChild(row);
        });
    } else if (!aspect && !dashMod && weapon.name === 'Peck') {
        container.innerHTML += '<div style="color: #666; font-style: italic; font-size: 12px;">No mutations yet...</div>';
    }
}
