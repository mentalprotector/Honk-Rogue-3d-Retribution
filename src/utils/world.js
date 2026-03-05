import * as THREE from 'three';
import { CONFIG, ENEMY_TYPES } from '../data/config.js';
import { LEVEL_CONFIG } from '../data/levels.js';

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
        return e;
    };

    const getRandomPos = () => {
        let x, z, safe = false;
        let attempts = 0;
        const pPos = player.mesh.position;
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

    const config = LEVEL_CONFIG[lvl];
    let stageTitle = `LEVEL ${lvl}`;

    if (config) {
        stageTitle = config.title;
        
        if (config.customSpawn && lvl === 12) {
            // Level 12 Special Logic (Menagerie)
            Object.keys(ENEMY_TYPES).forEach(key => {
                if (key !== 'BULL' && key !== 'ANTI_GOOSE' && key !== 'GARDENER') {
                    const p = getRandomPos(); 
                    const e = spawnEnemy(ENEMY_TYPES[key], p.x, p.z);
                    enemies.push(e);
                }
            });
        }
        
        if (config.spawns) {
            config.spawns.forEach(spawn => {
                const typeConfig = ENEMY_TYPES[spawn.type];
                if (!typeConfig) {
                    console.error(`SpawnWave: Unknown enemy type ${spawn.type}`);
                    return;
                }
                
                for (let i = 0; i < spawn.count; i++) {
                    let x, z;
                    if (spawn.pos) {
                        x = spawn.pos.x;
                        z = spawn.pos.z;
                    } else {
                        const p = getRandomPos();
                        x = p.x;
                        z = p.z;
                    }
                    
                    const e = spawnEnemy(typeConfig, x, z);
                    
                    // Apply overrides
                    if (spawn.speedMul) e.speed *= spawn.speedMul;
                    if (spawn.stats) {
                        Object.assign(e, spawn.stats);
                    }
                    
                    enemies.push(e);
                }
            });
        }
    }
    
    const badge = document.getElementById('stage-badge');
    if (badge) badge.innerText = `STAGE ${lvl}`;
    if (callbacks.showMessage) callbacks.showMessage(stageTitle);

    return {};
}
