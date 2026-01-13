import * as THREE from 'three';
import { createArcMesh } from '../utils/math.js';

export class AttackVFX {
    constructor(scene, position, target, range, angle, color = 0xffffff, maxLife = 0.15) {
        this.life = 0;
        this.maxLife = maxLife; 
        this.mesh = createArcMesh(range, angle, color, 0.8);
        
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; 
        
        // Point towards target
        if (target) {
            this.mesh.lookAt(target.x, this.mesh.position.y, target.z);
        }
        
        scene.add(this.mesh);
    }
    update(dt) {
        this.life += dt;
        const progress = this.life / this.maxLife;
        this.mesh.material.opacity = 0.8 * (1 - progress);
        this.mesh.scale.setScalar(0.8 + progress * 0.4);
        return this.life >= this.maxLife;
    }
    remove(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

export class GroundEffect {
    constructor(scene, position, typeConfig) {
        // typeConfig: { type: 'fire', duration: 3.0, radius: 1.5, damage: 1, tickRate: 0.5, color: 0xff4400, onEnter: (e)=>{}} 
        this.scene = scene;
        this.config = typeConfig;
        this.life = 0;
        this.tickTimer = 0;
        
        const geo = new THREE.CylinderGeometry(typeConfig.radius, typeConfig.radius, 0.1, 16);
        const mat = new THREE.MeshBasicMaterial({ 
            color: typeConfig.color || 0xffffff, 
            transparent: true, 
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.05; // Just above ground
        
        scene.add(this.mesh);
        
        // Optional particles
        this.particles = [];
    }

    update(dt, enemies) {
        this.life += dt;
        this.tickTimer += dt;
        
        // Pulse effect
        this.mesh.material.opacity = 0.4 + Math.sin(this.life * 10) * 0.1;

        // Collision & Tick Logic
        if (this.tickTimer >= (this.config.tickRate || 0.5)) {
            this.tickTimer = 0;
            if (enemies) {
                enemies.forEach(e => {
                    const distSq = this.mesh.position.distanceToSquared(e.mesh.position);
                    const r = this.config.radius + (e.config.hitRadius || 0.5);
                    if (distSq < r * r) {
                        // Apply Effects
                        if (this.config.damage) e.takeDamage(this.config.damage, this.config.color);
                        if (this.config.applyStatus) {
                            if (this.config.applyStatus === 'burn' && e.addEffect) e.addEffect('burn', 3.0, { tick: 0 });
                            if (this.config.applyStatus === 'freeze' && e.applyFreeze) e.applyFreeze(2.0);
                            if (this.config.applyStatus === 'slow' && e.applyStun) e.applyStun(0.1); 
                        }
                    }
                });
            }
        }
        
        return this.life >= this.config.duration;
    }

    remove(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}export class DamageNumber {
    constructor(scene, text, position, color = 0xffffff) {
        this.life = 0;
        this.maxLife = 0.8;
        this.position = position.clone();
        this.velocity = new THREE.Vector3((Math.random()-0.5)*2, 4 + Math.random()*2, (Math.random()-0.5)*2);
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = 'Bold 60px Arial';
        ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 80);
        
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        this.sprite = new THREE.Sprite(mat);
        this.sprite.position.copy(this.position);
        this.sprite.scale.set(1.5, 1.5, 1.5);
        scene.add(this.sprite);
    }
    update(dt) {
        this.life += dt;
        const progress = this.life / this.maxLife;
        this.velocity.y -= 9.8 * dt; // Gravity
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        this.sprite.position.copy(this.position);
        this.sprite.material.opacity = 1 - progress;
        return this.life >= this.maxLife;
    }
    remove(scene) {
        scene.remove(this.sprite);
        if(this.sprite.material.map) this.sprite.material.map.dispose();
        this.sprite.material.dispose();
    }
}

export class Particle {
    constructor(scene, position, color = 0xf1c40f) {
        this.THREE = THREE;
        this.life = 0;
        this.maxLife = 0.4 + Math.random()*0.3;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.mesh.position.copy(position);
        this.velocity = new THREE.Vector3(
            (Math.random()-0.5)*10,
            Math.random()*8,
            (Math.random()-0.5)*10
        );
        scene.add(this.mesh);
    }
    update(dt) {
        this.life += dt;
        this.velocity.y -= 15 * dt; // Gravity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        this.mesh.scale.setScalar(1 - (this.life/this.maxLife));
        return this.life >= this.maxLife;
    }
    remove(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
