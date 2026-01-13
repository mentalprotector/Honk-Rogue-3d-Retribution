import * as THREE from 'three';
import { CONFIG, ENEMY_TYPES } from '../data/config.js';

/**
 * Grass Grid Logic
 */
export function getGridIndex(x, z, limit, cellSize, gridCells) {
    const gx = Math.floor((x + limit) / cellSize);
    const gz = Math.floor((z + limit) / cellSize);
    if (gx < 0 || gx >= gridCells || gz < 0 || gz >= gridCells) return -1;
    return gz * gridCells + gx;
}

/**
 * Cuts grass in a specified range/angle
 */
export function cutGrassAt(pos, range, grassGrid, grassMesh, cellSize, getGridIndexFn, aimDir = null, dotLimit = 0.96) {
    const rangeSq = range * range;
    const mat4 = new THREE.Matrix4();
    const v3 = new THREE.Vector3();
    const v3Scale = new THREE.Vector3();
    const qRotation = new THREE.Quaternion();

    // Check cells in range
    for (let ox = -cellSize; ox <= cellSize; ox += cellSize) {
        for (let oz = -cellSize; oz <= cellSize; oz += cellSize) {
            const gIdx = getGridIndexFn(pos.x + ox, pos.z + oz);
            if (gIdx === -1) continue;

            const indices = grassGrid[gIdx];
            if (!indices) continue;

            for (let i = 0; i < indices.length; i++) {
                const grassIdx = indices[i];
                grassMesh.getMatrixAt(grassIdx, mat4);
                mat4.decompose(v3, qRotation, v3Scale);

                if (v3Scale.y < 0.2) continue;

                const dSq = pos.distanceToSquared(v3);
                if (dSq < rangeSq) {
                    if (aimDir) {
                        const toGrass = v3.clone().sub(pos).normalize();
                        if (aimDir.dot(toGrass) < dotLimit) continue;
                    }
                    v3Scale.set(v3Scale.x, 0.1, v3Scale.z);
                    mat4.compose(v3, qRotation, v3Scale);
                    grassMesh.setMatrixAt(grassIdx, mat4);
                    grassMesh.instanceMatrix.needsUpdate = true;
                }
            }
        }
    }
}

export function spawnLoot(scene, callbacks = {}) {
    const geo = new THREE.IcosahedronGeometry(0.8, 0);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xf1c40f, metalness: 0.8, roughness: 0.2, emissive: 0xf39c12, emissiveIntensity: 0.5
    });
    const loot = new THREE.Mesh(geo, mat);
    loot.position.set(0, 1.0, 0); 
    loot.userData = { time: 0 };
    scene.add(loot);
    if (callbacks.showMessage) callbacks.showMessage("GOLDEN EGG DROPPED!");
    return loot;
}

export function spawnWave(lvl, scene, player, enemies, ENEMY_TYPES, Enemy3DClass, callbacks = {}) {
    // Cleanup
    enemies.forEach(e => e.remove(scene));
    enemies.length = 0;
    
    const range = CONFIG.WORLD_SIZE / 2 - 2;
    const spawnEnemy = (type, x, z) => {
        const e = new Enemy3DClass(scene, x, z, type, callbacks.enemyCallbacks);
        if (lvl >= 6) {
            const scale = 1.0 + (lvl - 5) * 0.25; 
            e.maxHp = Math.ceil(e.maxHp * scale);
            e.hp = e.maxHp;
        }
        enemies.push(e);
        return e;
    };

    const getRandomPos = () => {
        let x, z, safe = false;
        let attempts = 0;
        const pPos = player.mesh.position;
        // console.log("SpawnWave DEBUG: Player at", pPos.x, pPos.z, "Range", range);
        do {
            x = (Math.random() - 0.5) * 2 * range;
            z = (Math.random() - 0.5) * 2 * range;
            const dx = x - pPos.x;
            const dz = z - pPos.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist > 6.0) safe = true;
            attempts++;
        } while (!safe && attempts < 50);
        
        if (!safe) {
            console.warn("SpawnWave: Forced spawn after 50 attempts. Character might overlap.");
        }
        return { x, z };
    };

    let stageTitle = "";
    if (lvl === 1) {
        stageTitle = "THE GARDEN: FLY INFESTATION";
        for(let i=0; i<5; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.FLY, p.x, p.z); }
    } else if (lvl === 2) {
        stageTitle = "THE GARDEN: RAT PROBLEM";
        for(let i=0; i<6; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.RAT, p.x, p.z); }
    } else if (lvl === 3) {
        stageTitle = "THE GARDEN: CAT PATROL";
        for(let i=0; i<4; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.CAT, p.x, p.z); }
    } else if (lvl === 4) {
        stageTitle = "THE GARDEN: ANTI-GOOSE";
        const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.ANTI_GOOSE, p.x, p.z);
    } else if (lvl === 5) {
        stageTitle = "BOSS: THE GARDENER";
        const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.HUMAN, p.x, p.z);
    } else if (lvl === 6) {
        stageTitle = "THE BACKYARD: TOAD SPRINGS";
        for(let i=0; i<6; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.SLIME, p.x, p.z); }
    } else if (lvl === 7) {
        stageTitle = "THE BACKYARD: MARSH TEAM";
        for(let i=0; i<4; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.SLIME, p.x, p.z); }
        for(let i=0; i<3; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.CAT, p.x, p.z); }
    } else if (lvl === 8) {
        stageTitle = "THE BACKYARD: THE SUPERVISOR";
        for(let i=0; i<4; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.SLIME, p.x, p.z); }
        const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.HUMAN, p.x, p.z);
    } else if (lvl === 9) {
        stageTitle = "THE BACKYARD: RAT SWARM!";
        for(let i=0; i<30; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.RAT, p.x, p.z); }
    } else if (lvl === 10) {
        stageTitle = "BOSS: THE RAGING BULL";
        const p = { x: 0, z: 8 }; spawnEnemy(ENEMY_TYPES.BULL, p.x, p.z);
    } else if (lvl === 11) {
        stageTitle = "THE DEEP WOODS: BOAR RUSH";
        for(let i=0; i<3; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.WILD_BOAR, p.x, p.z); }
        for(let i=0; i<8; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.RAT, p.x, p.z); }
    } else if (lvl === 12) {
        stageTitle = "THE DEEP WOODS: THE MENAGERIE";
        Object.keys(ENEMY_TYPES).forEach(key => {
            if (key !== 'BULL' && key !== 'ANTI_GOOSE') {
                const p = getRandomPos(); spawnEnemy(ENEMY_TYPES[key], p.x, p.z);
            }
        });
    } else if (lvl === 13) {
        stageTitle = "THE DEEP WOODS: PINE NEEDLE STORM";
        for(let i=0; i<50; i++) { const p = getRandomPos(); const e = spawnEnemy(ENEMY_TYPES.FLY, p.x, p.z); e.speed *= 1.2; }
        for(let i=0; i<10; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.MICRO_SLIME, p.x, p.z); }
        for(let i=0; i<3; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.ANTI_GOOSE, p.x, p.z); }
    } else if (lvl === 14) {
        stageTitle = "THE DEEP WOODS: BARRAGE OF THE ANCIENTS";
        for(let i=0; i<10; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.SLIME, p.x, p.z); }
        for(let i=0; i<3; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.HUMAN, p.x, p.z); }
        for(let i=0; i<2; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.WILD_BOAR, p.x, p.z); }
    } else if (lvl === 15) {
        stageTitle = "THE DEEP WOODS: THE ETERNAL HUNT";
        for(let i=0; i<8; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.WILD_BOAR, p.x, p.z); }
        for(let i=0; i<8; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.CAT, p.x, p.z); }
        for(let i=0; i<20; i++) { const p = getRandomPos(); spawnEnemy(ENEMY_TYPES.RAT, p.x, p.z); }
    } else if (lvl === 16) {
        stageTitle = "BOSS: THE FOREST TITAN";
        const p = { x: 0, z: 8 }; const e = spawnEnemy(ENEMY_TYPES.BULL, p.x, p.z);
        e.maxHp = 200; e.hp = 200; e.speed = 2.2;
        for(let i=0; i<4; i++) { const bp = getRandomPos(); spawnEnemy(ENEMY_TYPES.WILD_BOAR, bp.x, bp.z); }
    }
    
    const badge = document.getElementById('stage-badge');
    if (badge) badge.innerText = `STAGE ${lvl}`;
    if (callbacks.showMessage) callbacks.showMessage(stageTitle || `LEVEL ${lvl}`);

    return {};
}
