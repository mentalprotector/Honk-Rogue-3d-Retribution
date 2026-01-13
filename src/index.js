import * as THREE from 'three';
import { CONFIG, ENEMY_TYPES, STATE_ENUM } from './data/config.js';
import { UPGRADES_REGISTRY } from './data/registry.js';
import { Engine } from './core/engine.js';
import { InputHandler3D } from './core/input.js';
import { STATE, setGameState, applyHitStop, applyShake } from './core/state.js';
import { playSound } from './utils/audio.js';
import { cutGrassAt, getGridIndex, spawnWave, spawnLoot } from './utils/world.js';
import { Player3D } from './entities/player.js';
import { Enemy3D } from './entities/enemy.js';
import { AttackVFX, DamageNumber, Particle, GroundEffect } from './entities/effects.js';
import { Projectile, FireZone } from './entities/zone.js';
import { showMessage, updateHUD } from './ui/hud.js';
import { setGameStateUI, showUpgradeMenu, toggleStatsPanel } from './ui/menus.js';

// --- INITIALIZATION ---
if (window.location.protocol === 'file:') {
    const errorMsg = "ERROR: ES Modules are blocked by CORS on file:// protocol. \n\nPlease run 'python scripts/dev_server.py' and open http://localhost:8080";
    console.error(errorMsg);
    alert(errorMsg);
    document.body.innerHTML = `<div style="color: white; background: #000; height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; font-family: sans-serif; padding: 20px;"><div><h1 style="color: #e74c3c;">CORS Error</h1><p>${errorMsg.replace('\n', '<br><br>')}</p></div></div>`;
}

const engine = new Engine();
const { scene, camera, renderer } = engine;
const clock = new THREE.Clock();

let enemies = [];
let projectiles = [];
let groundEffects = [];
let vfxList = [];
let loot = null;

// --- GRASS SYSTEM ---
const grassCount = 6000;
const grassGeo = new THREE.PlaneGeometry(0.15, 0.8, 1, 4);
grassGeo.translate(0, 0.4, 0); 

const grassVert = `
    precision mediump float;
    uniform float time;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 pos = position;
        vec4 worldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float wind = sin(time * 2.0 + worldPos.x * 0.5 + worldPos.z * 0.5);
        float bend = smoothstep(0.0, 1.0, pos.y);
        pos.x += wind * bend * 0.2;
        pos.z += cos(time * 1.5 + worldPos.x * 0.3) * bend * 0.1;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    }
`;
const grassFrag = `
    precision mediump float;
    varying vec2 vUv;
    uniform vec3 topColor;
    void main() {
        vec3 bottomColor = vec3(0.1, 0.2, 0.05);
        vec3 color = mix(bottomColor, topColor, vUv.y);
        gl_FragColor = vec4(color, 1.0);
    }
`;
const grassMat = new THREE.ShaderMaterial({
    vertexShader: grassVert, fragmentShader: grassFrag,
    uniforms: { time: { value: 0 }, topColor: { value: new THREE.Color(0x408030) } },
    side: THREE.DoubleSide
});
const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
grassMesh.receiveShadow = true; 
const grassDummy = new THREE.Object3D();
const gridCells = 20;
const cellSize = CONFIG.WORLD_SIZE / gridCells;
const grassGrid = Array.from({ length: gridCells * gridCells }, () => []);
const limit = CONFIG.WORLD_SIZE / 2;

for (let i = 0; i < grassCount; i++) {
    const x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
    const z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
    grassDummy.position.set(x, 0, z);
    grassDummy.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.5 + Math.random() * 0.8;
    grassDummy.scale.set(s, s, s);
    grassDummy.updateMatrix();
    grassMesh.setMatrixAt(i, grassDummy.matrix);
    const gIdx = getGridIndex(x, z, limit, cellSize, gridCells);
    if (gIdx !== -1) grassGrid[gIdx].push(i);
}
scene.add(grassMesh);

// --- WORLD ---
const islandSize = CONFIG.WORLD_SIZE + 4;
const ground = new THREE.Mesh(
    new THREE.BoxGeometry(islandSize, 2.0, islandSize),
    [
        new THREE.MeshStandardMaterial({ color: 0x3d2b1f }), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }),
        new THREE.MeshStandardMaterial({ color: 0x3e5f40 }), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }),
        new THREE.MeshStandardMaterial({ color: 0x3d2b1f }), new THREE.MeshStandardMaterial({ color: 0x3d2b1f })
    ]
);
ground.position.y = -1.0; ground.receiveShadow = true;
scene.add(ground);

// Stars
const starCount = 2000;
const stars = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), starCount);
const starDummy = new THREE.Object3D();
for (let i = 0; i < starCount; i++) {
    starDummy.position.set((Math.random()-0.5)*200, (Math.random()-0.5)*200, (Math.random()-0.5)*200);
    starDummy.updateMatrix(); stars.setMatrixAt(i, starDummy.matrix);
}
scene.add(stars);
scene.background = new THREE.Color(0x000033);

// --- PLAYER & INPUT ---
const playerCallbacks = {
    playSound, applyHitStop, applyShake, vfxList, AttackVFX, enemies,
            spawnFireZone: (pos, damage) => groundEffects.push(new FireZone(scene, pos, damage)),    spawnGroundEffect: (pos, config) => groundEffects.push(new GroundEffect(scene, pos, config)),
    spawnProjectile: (pos, vel, dmg, pierce, options = {}) => {
        const p = new Projectile(scene, pos, vel, dmg, pierce);
        Object.assign(p, options);
        projectiles.push(p); return p;
    },
    cutGrassAt: (pos, range, dir, dot) => cutGrassAt(THREE, pos, range, grassGrid, grassMesh, cellSize, (x,z)=>getGridIndex(x,z,limit,cellSize,gridCells), dir, dot),
    onGameOver: () => changeGameState(STATE_ENUM.GAMEOVER)
};
const player = new Player3D(scene, playerCallbacks);

const inputHandler = new InputHandler3D({
    onTogglePause: () => {
        if (STATE.gameState === STATE_ENUM.PLAYING) changeGameState(STATE_ENUM.PAUSED);
        else if (STATE.gameState === STATE_ENUM.PAUSED) changeGameState(STATE_ENUM.PLAYING);
    },
    onCycleZoom: () => {
        const idx = engine.cycleZoom();
        const btn = document.getElementById('btnZoom');
        if (btn) btn.innerText = idx === 0 ? "ZOOM: +" : "ZOOM: -";
        playSound('upgrade', 0.5);
    },
    onPlayerAttack: () => player.attack(),
    onPlayerDash: (vec, mousePos) => player.dash(vec, mousePos)
});
inputHandler.setupMobileButtons();

// --- ENGINE WRAPPERS ---
function changeGameState(newState) {
    const oldState = STATE.gameState;
    setGameState(newState);
    setGameStateUI(newState, STATE_ENUM);
    if (newState === STATE_ENUM.PLAYING && oldState !== STATE_ENUM.PLAYING) clock.getDelta();
}

function startNewGame() {
    STATE.level = 1;
    player.reset();
    player.mesh.position.set(0, 0, 0);
    player.invulnerable = false;
    updateHUD(player);
    initWave(STATE.level);
    changeGameState(STATE_ENUM.PLAYING);
}

function initWave(lvl) {
    const enemyCallbacks = {
        playSound, DamageNumber, Particle, vfxList, AttackVFX, player, projectiles, applyShake,
        Projectile, // For Spitters
        cutGrassAt: (pos, range) => cutGrassAt(pos, range, grassGrid, grassMesh, cellSize, (x,z)=>getGridIndex(x,z,limit,cellSize,gridCells))
    };
    spawnWave(lvl, scene, player, enemies, ENEMY_TYPES, Enemy3D, { showMessage, enemyCallbacks });
}

function triggerNextLevel() {
    // Clear screen fade
    const fade = document.getElementById('screen-fade');
    if (fade) fade.style.opacity = '0';

    if (STATE.level >= 16) { changeGameState(STATE_ENUM.VICTORY); return; }

    STATE.level++;
    if (STATE.level === 6) {
        scene.background = new THREE.Color(0x3e2723);
        ground.material[2].color.setHex(0x2d1a12);
        grassMat.uniforms.topColor.value.setHex(0x8d6e63);
        showMessage("WELCOME TO WORLD 2: THE BACKYARD");
    } else if (STATE.level === 11) {
        scene.background = new THREE.Color(0x1b5e20);
        ground.material[2].color.setHex(0x3e2723);
        grassMat.uniforms.topColor.value.setHex(0x2e7d32);
        showMessage("WELCOME TO WORLD 3: THE DEEP WOODS");
    }
    
    player.mesh.position.set(0, 0, -8); 
    player.mesh.lookAt(0, 0, 8);
    player.invulnerable = false; // Remove transition invulnerability
    
    initWave(STATE.level);
    
    // Show start message after a small delay to let fade finish
    setTimeout(() => {
        showMessage(`LEVEL ${STATE.level} START`);
    }, 500);
}

function startTransitionSequence() {
    player.invulnerable = true;
    let count = 3;
    showMessage(`NEXT ROOM IN ${count}...`);
    playSound('honk', 1.0);

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            showMessage(`NEXT ROOM IN ${count}...`);
            playSound('honk', 1.0 + (3-count)*0.2);
        } else {
            clearInterval(interval);
            const fade = document.getElementById('screen-fade');
            if (fade) fade.style.opacity = '1';
            setTimeout(() => triggerNextLevel(), 600);
        }
    }, 1000);
}

// --- MAIN LOOP ---
function animate() {
    requestAnimationFrame(animate);
    if (STATE.gameState !== STATE_ENUM.PLAYING) {
        engine.render(); return;
    }

    let dt = clock.getDelta();
    if (dt > 0.1) dt = 0.1;

    if (STATE.hitStopTimer > 0) {
        STATE.hitStopTimer -= dt; engine.render(); return;
    }

    const inputVec = inputHandler.getVector();
    player.update(dt, clock.getElapsedTime(), inputVec, inputHandler.isAttackPressed);

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update(dt, player.mesh.position, camera, enemies);
        if (e.hp <= 0 && !e.isExploding) {
            if (player.hasCombustion && e.activeEffects && e.activeEffects.some(ef => ef.type === 'burn')) {
                const cLevel = player.upgradeLevels['combustion'] || 1;
                const range = 2.5 + (cLevel - 1) * player._getInc('combustion');
                vfxList.push(new AttackVFX(scene, e.mesh.position, e.mesh.position.clone().add(new THREE.Vector3(0,0,1)), range, Math.PI*2, 0xe67e22));
                enemies.forEach(nearby => {
                    if (nearby !== e && nearby.mesh.position.distanceToSquared(e.mesh.position) < range * range) {
                        nearby.takeDamage(15, 0xe67e22);
                    }
                });
                playSound('hit', 0.5);
            }

            if (e.config.name === 'Slime') {
                for(let j=0; j<3; j++) {
                    const angle = (j / 3) * Math.PI * 2;
                    const ms = new Enemy3D(scene, e.mesh.position.x + Math.cos(angle)*0.5, e.mesh.position.z + Math.sin(angle)*0.5, ENEMY_TYPES.MICRO_SLIME, e.callbacks);
                    enemies.push(ms);
                }
            }
            e.remove(scene); enemies.splice(i, 1);
            if (enemies.length === 0) {
                playSound('honk', 2.5);
                if (STATE.level >= 16) changeGameState(STATE_ENUM.VICTORY);
                else loot = spawnLoot(scene, { showMessage });
            }
        }
    }

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update(dt, scene, vfxList, Particle, (pos, rng) => cutGrassAt(pos, rng, grassGrid, grassMesh, cellSize, (x,z)=>getGridIndex(x,z,limit,cellSize,gridCells)));
        if (p.life <= 0) {
            if (p.isMagic) p.explode(scene, enemies, vfxList, AttackVFX);
            p.remove(scene); projectiles.splice(i, 1); continue;
        }
        if (p.isEnemy) {
            if (p.mesh.position.distanceToSquared(player.mesh.position) < 1.44 && !player.invulnerable && !player.isDashing) {
                player.takeDamage(p.damage); p.remove(scene); projectiles.splice(i, 1);
            }
        } else {
            for (let j = 0; j < enemies.length; j++) {
                const e = enemies[j];
                const hitRadius = e.config.hitRadius || 1.0;
                if (p.mesh.position.distanceToSquared(e.mesh.position) < hitRadius * hitRadius && !e.invulnerable && !p.hitList.includes(e)) {
                    if (p.isMagic) { p.explode(scene, enemies, vfxList, AttackVFX); p.remove(scene); projectiles.splice(i, 1); break; }
                    let finalDmg = p.damage;
                    if (p.critVsFrozen && e.hasEffect && e.hasEffect('freeze') && Math.random() < 0.5) finalDmg *= 2;
                    if (p.sniperLevel > 0) {
                         const dist = p.startPos.distanceTo(e.mesh.position);
                         finalDmg *= (1 + dist * 0.05 * p.sniperLevel);
                    }
                    e.takeDamage(finalDmg); e.invulnerable = true;
                    if (p.onHit) p.onHit(e);
                    setTimeout(() => { if(e) e.invulnerable = false; }, 200);
                    p.hitList.push(e);
                    if (!p.pierce) { p.remove(scene); projectiles.splice(i, 1); break; }
                }
            }
        }
    }

        // Hazards & VFX
        for (let i = groundEffects.length - 1; i >= 0; i--) {
            if (groundEffects[i].update(dt, enemies)) { groundEffects[i].remove(scene); groundEffects.splice(i, 1); }
        }
        for (let i = vfxList.length - 1; i >= 0; i--) {
            if (vfxList[i].update(dt)) { vfxList[i].remove(scene); vfxList.splice(i, 1); }
        }
    
                // Loot
                if (loot) {
                    loot.userData.time += dt; loot.rotation.y += dt * 2; loot.rotation.z = Math.sin(loot.userData.time * 3) * 0.2;
                    loot.position.y = 1.0 + Math.sin(loot.userData.time * 3) * 0.3;
                    if (player.mesh.position.distanceTo(new THREE.Vector3(loot.position.x, 0, loot.position.z)) < 1.5) {
                        scene.remove(loot); loot = null;
                        showUpgradeMenu(player, STATE.level, UPGRADES_REGISTRY, {
                            playSound, THREE,
                            onTransitionStart: () => startTransitionSequence(),
                            onUpgradeSelected: () => {
                                updateHUD(player);
                            }
                        });
                    }
                }
        
            // Camera & Lights
            const camTarget = player.mesh.position.clone().add(new THREE.Vector3(20, 20, 20));
            camera.position.lerp(camTarget, 0.1); camera.lookAt(player.mesh.position);
            if (STATE.shakeTime > 0) {
                STATE.shakeTime -= dt;
                camera.position.x += (Math.random()-0.5)*STATE.shakeIntensity; camera.position.y += (Math.random()-0.5)*STATE.shakeIntensity; camera.position.z += (Math.random()-0.5)*STATE.shakeIntensity;
                STATE.shakeIntensity *= 0.9;
            }
            engine.dirLight.position.set(player.mesh.position.x + 10, 20, player.mesh.position.z + 5);
            engine.dirLight.target.position.copy(player.mesh.position); engine.dirLight.target.updateMatrixWorld();
        
            grassMat.uniforms.time.value = clock.getElapsedTime();
            updateOffscreenIndicator(player, enemies, loot, camera);
            engine.render();
        }
function updateOffscreenIndicator(player, enemies, loot, camera) {
    const indicator = document.getElementById('offscreen-indicator');
    if (!indicator) return;
    let targetPos = null; let targetType = "enemy";
    if (enemies.length > 0) {
        let minDist = Infinity;
        enemies.forEach(e => { const d = player.mesh.position.distanceTo(e.mesh.position); if (d < minDist) { minDist = d; targetPos = e.mesh.position.clone(); } });
        targetType = "enemy";
    } else if (loot) { targetPos = loot.position.clone(); targetType = "loot"; }

    if (targetPos) {
        const screenPos = targetPos.clone().project(camera);
        if (Math.abs(screenPos.x) > 0.9 || Math.abs(screenPos.y) > 0.9) {
            indicator.style.display = 'block';
            const svg = indicator.querySelector('svg');
            if (svg) svg.style.fill = (targetType === "enemy") ? "#e74c3c" : "#f1c40f";
            const pad = 40; const hw = window.innerWidth / 2; const hh = window.innerHeight / 2;
            let x = screenPos.x * hw; let y = -screenPos.y * hh;
            const ratio = Math.min((hw - pad) / Math.abs(x), (hh - pad) / Math.abs(y));
            x *= ratio; y *= ratio;
            indicator.style.left = (hw + x - 25) + 'px'; indicator.style.top = (hh + y - 25) + 'px';
            indicator.style.transform = `rotate(${Math.atan2(y, x) + Math.PI / 2}rad)`;
        } else indicator.style.display = 'none';
    } else indicator.style.display = 'none';
}

// UI Listeners
document.getElementById('btn-start').onclick = () => startNewGame();
document.getElementById('btn-resume').onclick = () => changeGameState(STATE_ENUM.PLAYING);
document.getElementById('btn-restart').onclick = () => startNewGame();
const btnStats = document.getElementById('btnStats');
if (btnStats) btnStats.onclick = () => toggleStatsPanel(player);

// Start
window.addEventListener('mousemove', (e) => inputHandler.updateMouse(e, camera));
changeGameState(STATE_ENUM.MENU);
animate();
