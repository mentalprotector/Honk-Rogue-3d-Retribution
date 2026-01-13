import * as THREE from 'three';
import { CONFIG } from '../data/config.js';

export class FireZone {
    constructor(scene, position, damage = 0.5) {
        this.THREE = THREE;
        this.life = 0;
        this.maxLife = 3.0; 
        this.position = position.clone();
        this.tick = 0;
        this.damage = damage;

        // --- FLAME INSTANCED MESH (SHADER BASED) ---
        const flameCount = 12;
        const flameGeo = new THREE.PlaneGeometry(0.3, 0.45);
        flameGeo.translate(0, 0.225, 0); // Pivot at bottom
        
        const flameVert = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            }
        `;
        const flameFrag = `
            varying vec2 vUv;
            uniform float opacity;
            void main() {
                // Vertical gradient: Yellow (bottom) -> Red (top)
                vec3 yellow = vec3(1.0, 0.8, 0.2);
                vec3 red = vec3(0.5, 0.0, 0.0);
                vec3 color = mix(yellow, red, vUv.y);
                
                // Fade alpha at top and with life
                float alpha = (1.0 - vUv.y) * opacity;
                gl_FragColor = vec4(color, alpha);
            }
        `;
        
        this.flameMat = new THREE.ShaderMaterial({
            vertexShader: flameVert,
            fragmentShader: flameFrag,
            uniforms: {
                opacity: { value: 0.6 }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.mesh = new THREE.InstancedMesh(flameGeo, this.flameMat, flameCount);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.01;
        
        const dummy = new THREE.Object3D();
        for(let i=0; i<flameCount; i++) {
            const angle = (i / flameCount) * Math.PI * 2;
            const r = 0.2 + Math.random() * 0.4;
            dummy.position.set(Math.cos(angle)*r, 0, Math.sin(angle)*r);
            dummy.rotation.y = Math.random() * Math.PI;
            const s = 0.7 + Math.random() * 0.9;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }
        
        scene.add(this.mesh);
    }

    update(dt, enemies) {
        this.life += dt;
        this.tick += dt;

        const dummy = new THREE.Matrix4();
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        for(let i=0; i<this.mesh.count; i++) {
            this.mesh.getMatrixAt(i, dummy);
            dummy.decompose(pos, quat, scale);
            // Flicker and slight sway
            const flicker = 0.9 + Math.sin(this.life * 15 + i) * 0.15;
            const sway = Math.sin(this.life * 10 + i) * 0.05;
            
            const obj = new THREE.Object3D();
            obj.position.copy(pos);
            obj.quaternion.copy(quat);
            obj.rotation.x = sway;
            obj.scale.set(scale.x, scale.y * flicker, scale.z);
            obj.updateMatrix();
            this.mesh.setMatrixAt(i, obj.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        
        // Update uniform opacity
        this.flameMat.uniforms.opacity.value = 0.6 * (1 - this.life / this.maxLife);

        if (this.tick >= 0.5) {
            this.tick = 0;
            enemies.forEach(e => {
                const dx = this.position.x - e.mesh.position.x;
                const dz = this.position.z - e.mesh.position.z;
                const distSq = dx*dx + dz*dz;
                const range = 1.2 + (e.config.hitRadius || 0);
                
                if (distSq < range * range) {
                    e.takeDamage(this.damage, 0xff4400);
                    if (e.applyBleed) e.applyBleed(0.5, 0xe67e22); // Burn tick
                }
            });
        }
        return this.life >= this.maxLife;
    }

    remove(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.flameMat.dispose();
    }
}

export class Projectile {
    constructor(scene, pos, velocity, damage, pierce = false) {
        this.THREE = THREE;
        this.damage = damage;
        this.pierce = pierce;
        this.velocity = velocity;
        this.hitList = []; // Track enemies already hit if piercing
        this.life = 2.0; // Seconds to live
        this.startPos = pos.clone();
        this.trailTimer = 0;
        this.isMagic = false; // For grimoire
        this.isEnemy = false;

        const starShape = new THREE.Shape();
        const spikes = 4;
        const outer = 0.3;
        const inner = 0.1;
        for(let i=0; i<spikes*2; i++){
            const r = (i%2 === 0) ? outer : inner;
            const a = (i / (spikes*2)) * Math.PI * 2;
            if(i===0) starShape.moveTo(Math.cos(a)*r, Math.sin(a)*r);
            else starShape.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.05, bevelEnabled: false });
        const starMat = new THREE.MeshStandardMaterial({ 
            color: 0xf1c40f, 
            metalness: 0.8, 
            emissive: 0xf1c40f, 
            emissiveIntensity: 0.5 
        });
        
        this.mesh = new THREE.Mesh(starGeo, starMat);
        this.mesh.rotation.x = Math.PI / 2; // Flat on plane
        this.mesh.position.copy(pos);
        
        scene.add(this.mesh);
    }

    explode(scene, enemies, vfxList, AttackVFXClass) {
        // Magic AOE Blast (Balanced)
        const range = 2.0; 
        vfxList.push(new AttackVFXClass(scene, this.mesh.position, this.mesh.position.clone().add(new THREE.Vector3(0,0,1)), range, Math.PI*2, 0x8e44ad));
        
        enemies.forEach(e => {
            const dx = this.mesh.position.x - e.mesh.position.x;
            const dz = this.mesh.position.z - e.mesh.position.z;
            const dSq = dx*dx + dz*dz;
            
            const hitRadius = e.config.hitRadius || 0.5;
            const hitLimit = range + hitRadius;
            if (dSq < hitLimit * hitLimit) {
                e.takeDamage(this.damage, 0x8e44ad);
                const p = e.mesh.position.clone().sub(this.mesh.position);
                p.y = 0;
                p.normalize().multiplyScalar(8); // Lower push
                e.velocity.add(p);
            }
        });
    }

    update(dt, scene, vfxList, ParticleClass, cutGrassFn) {
        this.life -= dt;
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        
        // BOUNDS CHECK (Walls)
        if (!this.pierce) {
            const limit = CONFIG.WORLD_SIZE / 2;
            if (Math.abs(this.mesh.position.x) > limit || Math.abs(this.mesh.position.z) > limit) {
                this.life = 0; 
            }
        }
        
        // FAST ROTATION
        this.mesh.rotation.z += dt * 20;
        
        // GOLD TRAIL
        this.trailTimer += dt;
        if (this.trailTimer > 0.05) {
            this.trailTimer = 0;
            const p = new ParticleClass(scene, this.mesh.position.clone(), 0xf1c40f);
            p.velocity.set(0,0,0); // Static trail pieces
            p.maxLife = 0.3;
            vfxList.push(p);
        }

        // CUT GRASS (Optimized)
        if (!this.isEnemy && cutGrassFn) {
            cutGrassFn(this.mesh.position, 1.0);
        }
    }

    remove(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
