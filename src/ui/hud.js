export function showMessage(text) {
    const el = document.getElementById('stage-notification');
    if (!el) return;
    el.innerText = text;
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -50%) scale(1)';
    
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%, -50%) scale(0.5)';
    }, 2000);
}

export function updateHUD(player) {
    const bar = document.getElementById('hp-bar-current');
    const txt = document.getElementById('hp-text');
    if (bar && txt) {
        const pct = Math.max(0, Math.min(1, player.hp / player.maxHp)) * 100;
        bar.style.width = pct + '%';
        txt.innerText = `${Math.ceil(player.hp)}/${player.maxHp}`;
    }
    
    const sIcons = document.getElementById('status-icons');
    if (sIcons) {
        let html = '';
        // Dynamic Buffs Only
        if (player.combo > 0) html += `<span style="color:#e67e22; margin-right:5px">🔥${player.combo}</span>`;
        
        // Check for temporary speed boost (Blood Scent)
        if (player.isSpeedBoosted) {
            html += '<span style="color:#2ecc71; margin-right:5px">⚡</span>';
        }
        
        // Defensive Buffs (Temporary)
        if (player.invulnerable && player.hp > 0) html += '<span style="color:#ecf0f1; margin-right:5px">🛡️</span>';

        sIcons.innerHTML = html;
    }
}
