import * as THREE from 'three';
import { CONFIG, BALANCE, ENEMY_TYPES } from '../data/config.js';

export class Enemy3D {
    constructor(scene, x, z, typeConfig, callbacks = {}) {
        this.THREE = THREE;
        this.scene = scene;
        this.config = { ...typeConfig };
        this.callbacks = callbacks; // { playSound, DamageNumber, Particle, vfxList, AttackVFX, player, projectiles, applyShake, cutGrassAt }

        this.speed = typeConfig.speed;
        this.velocity = new THREE.Vector3();
        this.friction = BALANCE.ENEMIES.FRICTION;
        
        this.maxHp = typeConfig.hp;
        this.hp = this.maxHp;

        // Status Effects
        this.activeEffects = []; // { type: 'bleed'|'freeze'|'stun', duration, data }

        this.isExploding = false;
        this.explosionTimer = 0;

        this._initVisuals();

        // Random scale variation (0.9 to 1.1)
        const randScale = 0.9 + Math.random() * 0.2;
        this.mesh.scale.setScalar(randScale);
        if (this.config.hitRadius) {
            this.config.hitRadius *= randScale;
        }

        this.mesh.position.set(x, this.config.yOffset || 0, z);
        
        this.mesh.add(this.iceBlock);
        scene.add(this.mesh);
        this.timeOffset = Math.random() * 100;
    }

    _initVisuals() {
        const THREE = this.THREE;
        const typeConfig = this.config;

        const iceGeo = new THREE.BoxGeometry(typeConfig.scale * 2.5, typeConfig.scale * 2.5, typeConfig.scale * 2.5);
        const iceMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.5,
            emissive: 0x00ffff, emissiveIntensity: 0.2
        });
        this.iceBlock = new THREE.Mesh(iceGeo, iceMat);
        this.iceBlock.position.y = (typeConfig.yOffset || 0);
        this.iceBlock.visible = false;

        this.isAttacking = false;
        this.attackWindUp = 0;
        this.attackDuration = BALANCE.ENEMIES.DEFAULT_ATTACK_WINDUP; 
        this.attackCooldown = 0;
        this.attackCooldownMax = BALANCE.ENEMIES.DEFAULT_ATTACK_COOLDOWN; 

        this.mesh = new THREE.Group();

        const mat = new THREE.MeshStandardMaterial({ color: typeConfig.color });
        this.parts = []; 
        this.wings = [];

        if (typeConfig.shape === 'sphere') {
            const flyGroup = new THREE.Group();
            this.mesh.add(flyGroup);
            const head = new THREE.Mesh(new THREE.SphereGeometry(typeConfig.scale * 0.6, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            head.position.z = typeConfig.scale * 0.5;
            flyGroup.add(head);
            const thorax = new THREE.Mesh(new THREE.SphereGeometry(typeConfig.scale * 0.8, 8, 8), mat);
            flyGroup.add(thorax);
            const abdomen = new THREE.Mesh(new THREE.SphereGeometry(typeConfig.scale, 8, 8), mat);
            abdomen.position.z = -typeConfig.scale * 0.8; abdomen.scale.set(0.8, 0.8, 1.2);
            flyGroup.add(abdomen);
            this.body = thorax;
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0x880000, roughness: 0, metalness: 0.5 });
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(typeConfig.scale * 0.3, 8, 8), eyeMat);
            eyeL.position.set(-0.2 * typeConfig.scale / 0.3, 0.1, 0.25 * typeConfig.scale / 0.3);
            head.add(eyeL);
            const eyeR = new THREE.Mesh(eyeL.geometry, eyeMat);
            eyeR.position.set(0.2 * typeConfig.scale / 0.3, 0.1, 0.25 * typeConfig.scale / 0.3);
            head.add(eyeR);
            const wingGeo = new THREE.PlaneGeometry(0.6 * typeConfig.scale / 0.3, 0.3 * typeConfig.scale / 0.3);
            const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
            for(let i=0; i<4; i++) {
                const wing = new THREE.Mesh(wingGeo, wingMat);
                wing.position.set(i < 2 ? -0.3 : 0.3, 0.2, (i % 2 === 0 ? 0.1 : -0.1));
                wing.rotation.y = (i < 2 ? 0.2 : -0.2);
                this.mesh.add(wing); this.wings.push(wing);
            }
        } else if (typeConfig.name === 'Slime' || typeConfig.name === 'Micro-Slime') {
            const body = new THREE.Mesh(new THREE.SphereGeometry(typeConfig.scale, 16, 16), new THREE.MeshStandardMaterial({ 
                color: typeConfig.color, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.1
            }));
            this.mesh.add(body); this.body = body;
            const core = new THREE.Mesh(new THREE.SphereGeometry(typeConfig.scale * 0.4, 8, 8), new THREE.MeshStandardMaterial({ 
                color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 0.5 
            }));
            body.add(core);
            for(let i=0; i<5; i++) {
                const b = new THREE.Mesh(new THREE.SphereGeometry(0.05 * typeConfig.scale / 0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
                b.position.set((Math.random()-0.5)*typeConfig.scale, (Math.random()-0.5)*typeConfig.scale, (Math.random()-0.5)*typeConfig.scale);
                body.add(b);
            }
            const eyeGeo = new THREE.SphereGeometry(0.12 * typeConfig.scale / 0.8, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
            eyeL.position.set(-0.2 * typeConfig.scale / 0.8, 0.2 * typeConfig.scale / 0.8, 0.4 * typeConfig.scale / 0.8);
            this.body.add(eyeL);
            const pL = new THREE.Mesh(new THREE.SphereGeometry(0.05 * typeConfig.scale / 0.8, 8, 8), pupilMat);
            pL.position.set(0, 0, 0.08 * typeConfig.scale / 0.8); eyeL.add(pL);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
            eyeR.position.set(0.2 * typeConfig.scale / 0.8, 0.2 * typeConfig.scale / 0.8, 0.4 * typeConfig.scale / 0.8);
            this.body.add(eyeR);
            const pR = new THREE.Mesh(new THREE.SphereGeometry(0.05 * typeConfig.scale / 0.8, 8, 8), pupilMat);
            pR.position.set(0, 0, 0.08 * typeConfig.scale / 0.8); eyeR.add(pR);
        } else if (typeConfig.name === 'Bull') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(typeConfig.scale, typeConfig.scale * 0.7, typeConfig.scale * 1.6), mat);
            body.position.y = typeConfig.scale * 0.35; this.mesh.add(body); this.body = body;
            const legGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
            const hoofMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const legPositions = [{x: -0.8, z: 1.2}, {x: 0.8, z: 1.2}, {x: -0.8, z: -1.2}, {x: 0.8, z: -1.2}];
            legPositions.forEach(pos => {
                const legGroup = new THREE.Group(); legGroup.position.set(pos.x, -0.2, pos.z); body.add(legGroup);
                const leg = new THREE.Mesh(legGeo, mat); legGroup.add(leg);
                const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), hoofMat); hoof.position.y = -0.6; legGroup.add(hoof);
                this.parts.push(legGroup);
            });
            const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.4), mat); head.position.set(0, 0.8, 2.4); body.add(head); this.head = head;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0 }));
            ring.position.set(0, -0.4, 0.7); ring.rotation.x = Math.PI / 2; head.add(ring);
            const hornGeo = new THREE.ConeGeometry(0.3, 1.5, 12); const hornMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
            const hornL = new THREE.Mesh(hornGeo, hornMat); hornL.position.set(-0.7, 0.8, 0.2); hornL.rotation.x = Math.PI/4; hornL.rotation.z = 0.5; head.add(hornL);
            const hornR = new THREE.Mesh(hornGeo, hornMat); hornR.position.set(0.7, 0.8, 0.2); hornR.rotation.x = Math.PI/4; hornR.rotation.z = -0.5; head.add(hornR);
            this.tail = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.05, 1.8, 8), mat);
            this.tail.position.set(0, 0.2, -typeConfig.scale * 0.8 - 0.5); this.tail.rotation.x = -Math.PI / 3; this.mesh.add(this.tail);
        } else if (typeConfig.name === 'Rat') {
            const ratColors = [0x7f8c8d, 0x5d4037, 0x333333, 0xeeeeee];
            mat.color.setHex(ratColors[Math.floor(Math.random() * ratColors.length)]);
            const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 4, 12), mat);
            body.rotation.x = Math.PI / 2; body.position.y = 0.3; this.mesh.add(body); this.body = body;
            const legGeo = new THREE.BoxGeometry(0.1, 0.2, 0.1);
            for(let i=0; i<4; i++) {
                const leg = new THREE.Mesh(legGeo, mat);
                leg.position.set(i < 2 ? -0.25 : 0.25, 0.1, (i % 2 === 0 ? 0.3 : -0.3));
                this.mesh.add(leg); this.parts.push(leg);
            }
            this.tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.01, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xffaaaa }));
            this.tail.rotation.x = -Math.PI / 2; this.tail.position.set(0, 0.2, -0.6); this.mesh.add(this.tail);
            const head = new THREE.Group(); head.position.set(0, 0.35, 0.5); this.mesh.add(head); this.head = head;
            const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat); nose.scale.set(1, 0.8, 1.5); head.add(nose);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffaaaa })); tip.position.z = 0.15; head.add(tip);
            const earGeo = new THREE.SphereGeometry(0.18, 12, 12);
            const earL = new THREE.Mesh(earGeo, mat); earL.position.set(-0.2, 0.3, -0.1); head.add(earL);
            const earR = new THREE.Mesh(earGeo, mat); earR.position.set(0.2, 0.3, -0.1); head.add(earR);
            const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.08, 0.15, 0.05); head.add(eyeL);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.08, 0.15, 0.05); head.add(eyeR);
            const whiskerMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
            for(let i=-1; i<=1; i++) {
                const wL = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(-0.4, i*0.1, 0.1)]);
                const wR = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0.4, i*0.1, 0.1)]);
                const l1 = new THREE.Line(wL, whiskerMat); const l2 = new THREE.Line(wR, whiskerMat);
                l1.position.set(-0.05, 0, 0.1); l2.position.set(0.05, 0, 0.1); head.add(l1); head.add(l2);
            }
        } else if (typeConfig.name === 'Cat') {
            const catColors = [0xe67e22, 0x2c3e50, 0x7f8c8d, 0xbdc3c7];
            const catMat = new THREE.MeshStandardMaterial({ color: catColors[Math.floor(Math.random() * catColors.length)] });
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.2), catMat); body.position.y = 0.5; this.mesh.add(body); this.body = body;
            const legGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
            for(let i=0; i<4; i++) {
                const leg = new THREE.Mesh(legGeo, catMat); leg.position.set(i < 2 ? -0.3 : 0.3, 0.225, (i % 2 === 0 ? 0.45 : -0.45));
                this.mesh.add(leg); this.parts.push(leg);
            }
            const headGroup = new THREE.Group(); headGroup.position.set(0, 1.0, 0.6); this.mesh.add(headGroup); this.head = headGroup;
            headGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.6), catMat));
            const earGeo = new THREE.ConeGeometry(0.18, 0.35, 4);
            const earL = new THREE.Mesh(earGeo, catMat); earL.position.set(-0.25, 0.4, 0); headGroup.add(earL);
            const earR = new THREE.Mesh(earGeo, catMat); earR.position.set(0.25, 0.4, 0); headGroup.add(earR);
            const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8); const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.2, 0.1, 0.3); headGroup.add(eyeL);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.2, 0.1, 0.3); headGroup.add(eyeR);
            const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: 0x000000 }));
            pupil.position.z = 0.07; eyeL.add(pupil.clone()); eyeR.add(pupil.clone());
            const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0xffaaaa })); nose.position.set(0, -0.1, 0.3); headGroup.add(nose);
            const whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff });
            for (let i = -1; i <= 1; i += 1) {
                const wL = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(-0.5, i * 0.1, 0.1)]);
                const wR = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0.5, i * 0.1, 0.1)]);
                const l1 = new THREE.Line(wL, whiskerMat); const l2 = new THREE.Line(wR, whiskerMat);
                l1.position.set(-0.1, -0.1, 0.3); l2.position.set(0.1, -0.1, 0.3); headGroup.add(l1); headGroup.add(l2);
            }
            this.tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 1.2), catMat); this.tail.position.set(0, 0.6, -0.6); this.tail.rotation.x = Math.PI / 3; this.mesh.add(this.tail);
        } else if (typeConfig.name === 'Human' || typeConfig.name === 'The Gardener') {
            const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
            const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f];
            const shirtMat = new THREE.MeshStandardMaterial({ color: typeConfig.name === 'The Gardener' ? 0x27ae60 : shirtColors[Math.floor(Math.random() * shirtColors.length)] });
            this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.4 * typeConfig.scale / 2.0, 1.0 * typeConfig.scale / 2.0, 0.4 * typeConfig.scale / 2.0), pantsMat); this.legL.position.set(-0.3 * typeConfig.scale / 2.0, 0.5 * typeConfig.scale / 2.0, 0); this.mesh.add(this.legL);
            this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.4 * typeConfig.scale / 2.0, 1.0 * typeConfig.scale / 2.0, 0.4 * typeConfig.scale / 2.0), pantsMat); this.legR.position.set(0.3 * typeConfig.scale / 2.0, 0.5 * typeConfig.scale / 2.0, 0); this.mesh.add(this.legR);
            this.body = new THREE.Mesh(new THREE.BoxGeometry(1.2 * typeConfig.scale / 2.0, 1.3 * typeConfig.scale / 2.0, 0.7 * typeConfig.scale / 2.0), shirtMat); this.body.position.set(0, 1.6 * typeConfig.scale / 2.0, 0); this.mesh.add(this.body);
            const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.2 * typeConfig.scale / 2.0, 1.4 * typeConfig.scale / 2.0, 0.1 * typeConfig.scale / 2.0), pantsMat); strapL.position.set(-0.4 * typeConfig.scale / 2.0, 0, 0.35 * typeConfig.scale / 2.0); this.body.add(strapL);
            const strapR = strapL.clone(); strapR.position.x = 0.4 * typeConfig.scale / 2.0; this.body.add(strapR);
            const headGroup = new THREE.Group(); headGroup.position.set(0, 2.5 * typeConfig.scale / 2.0, 0); this.mesh.add(headGroup); this.head = headGroup;
            headGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.7 * typeConfig.scale / 2.0, 0.7 * typeConfig.scale / 2.0, 0.7 * typeConfig.scale / 2.0), skinMat));
            const hatGroup = new THREE.Group(); hatGroup.position.y = 0.4 * typeConfig.scale / 2.0; headGroup.add(hatGroup);
            const hatMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
            hatGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8 * typeConfig.scale / 2.0, 0.8 * typeConfig.scale / 2.0, 0.05 * typeConfig.scale / 2.0, 16), hatMat));
            const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * typeConfig.scale / 2.0, 0.45 * typeConfig.scale / 2.0, 0.3 * typeConfig.scale / 2.0, 16), hatMat); hatTop.position.y = 0.15 * typeConfig.scale / 2.0; hatGroup.add(hatTop);
            const eyeGeo = new THREE.SphereGeometry(0.05 * typeConfig.scale / 2.0, 8, 8); const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.2 * typeConfig.scale / 2.0, 0.1 * typeConfig.scale / 2.0, 0.35 * typeConfig.scale / 2.0); headGroup.children[0].add(eL);
            const eR = eL.clone(); eR.position.x = 0.2 * typeConfig.scale / 2.0; headGroup.children[0].add(eR);
            this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.3 * typeConfig.scale / 2.0, 1.0 * typeConfig.scale / 2.0, 0.3 * typeConfig.scale / 2.0), skinMat); this.armL.position.set(-0.8 * typeConfig.scale / 2.0, 1.8 * typeConfig.scale / 2.0, 0); this.mesh.add(this.armL);
            this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.3 * typeConfig.scale / 2.0, 1.0 * typeConfig.scale / 2.0, 0.3 * typeConfig.scale / 2.0), skinMat); this.armR.position.set(0.8 * typeConfig.scale / 2.0, 1.8 * typeConfig.scale / 2.0, 0); this.mesh.add(this.armR);
            const sL = new THREE.Mesh(new THREE.BoxGeometry(0.35 * typeConfig.scale / 2.0, 0.4 * typeConfig.scale / 2.0, 0.35 * typeConfig.scale / 2.0), shirtMat); sL.position.y = 0.3 * typeConfig.scale / 2.0; this.armL.add(sL);
            const sR = sL.clone(); this.armR.add(sR);
            const rakeGroup = new THREE.Group(); rakeGroup.position.set(0, -0.4 * typeConfig.scale / 2.0, 0.6 * typeConfig.scale / 2.0); rakeGroup.rotation.x = Math.PI / 4; this.armR.add(rakeGroup);
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * typeConfig.scale / 2.0, 0.06 * typeConfig.scale / 2.0, 3.0 * typeConfig.scale / 2.0), new THREE.MeshStandardMaterial({ color: 0x8e44ad }));
            handle.rotation.x = Math.PI / 2; rakeGroup.add(handle);
            const headBar = new THREE.Mesh(new THREE.BoxGeometry(1.0 * typeConfig.scale / 2.0, 0.12 * typeConfig.scale / 2.0, 0.12 * typeConfig.scale / 2.0), new THREE.MeshStandardMaterial({ color: 0x95a5a6 })); headBar.position.z = 1.5 * typeConfig.scale / 2.0; rakeGroup.add(headBar);
            for(let i=0; i<7; i++) {
                const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.03 * typeConfig.scale / 2.0, 0.4 * typeConfig.scale / 2.0, 4), new THREE.MeshStandardMaterial({ color: 0x95a5a6 }));
                tooth.position.set((i-3)*0.15 * typeConfig.scale / 2.0, -0.2 * typeConfig.scale / 2.0, 1.5 * typeConfig.scale / 2.0); tooth.rotation.x = Math.PI; rakeGroup.add(tooth);
            }
        } else if (typeConfig.name === 'Spitter Plant') {
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x2ecc71 }));
            stem.position.y = 0.3; this.mesh.add(stem); this.body = stem;
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
            head.position.y = 0.6; this.mesh.add(head); this.head = head;
            const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x550000 }));
            mouth.rotation.x = Math.PI / 2; mouth.position.z = 0.25; head.add(mouth);
            // Leaves
            const leafGeo = new THREE.ConeGeometry(0.2, 0.6, 4); leafGeo.scale(1, 0.2, 1);
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
            for(let i=0; i<4; i++) {
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.y = 0.1;
                leaf.rotation.y = (i/4)*Math.PI*2;
                leaf.rotation.x = Math.PI/3;
                leaf.position.x = Math.sin((i/4)*Math.PI*2)*0.3;
                leaf.position.z = Math.cos((i/4)*Math.PI*2)*0.3;
                this.mesh.add(leaf);
            }
        } else if (typeConfig.name === 'Wild Boar') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(typeConfig.scale * 1.2, typeConfig.scale * 0.9, typeConfig.scale * 1.8), mat);
            body.position.y = typeConfig.scale * 0.45; this.mesh.add(body); this.body = body;
            const legGeo = new THREE.BoxGeometry(0.3, 0.6, 0.3);
            const legPositions = [{x: -0.5, z: 0.7}, {x: 0.5, z: 0.7}, {x: -0.5, z: -0.7}, {x: 0.5, z: -0.7}];
            legPositions.forEach(pos => {
                const leg = new THREE.Mesh(legGeo, mat); leg.position.set(pos.x * typeConfig.scale, -typeConfig.scale * 0.4, pos.z * typeConfig.scale);
                body.add(leg); this.parts.push(leg);
            });
            const tuskGeo = new THREE.ConeGeometry(0.15, 0.6, 8); const tuskMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
            const tuskL = new THREE.Mesh(tuskGeo, tuskMat); tuskL.position.set(-0.5 * typeConfig.scale, 0, 0.9 * typeConfig.scale); tuskL.rotation.x = Math.PI/2; tuskL.rotation.z = 0.3; body.add(tuskL);
            const tuskR = new THREE.Mesh(tuskGeo, tuskMat); tuskR.position.set(0.5 * typeConfig.scale, 0, 0.9 * typeConfig.scale); tuskR.rotation.x = Math.PI/2; tuskR.rotation.z = -0.3; body.add(tuskR);
            this.tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.8), mat);
            this.tail.position.set(0, 0.2, -typeConfig.scale * 0.9); this.tail.rotation.x = -Math.PI/3; body.add(this.tail);
        } else if (typeConfig.shape === 'goose') {
            const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.6, 4, 16);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.5 });
            this.body = new THREE.Mesh(bodyGeo, bodyMat); this.body.rotation.x = Math.PI / 2; this.body.position.y = 0.5; this.mesh.add(this.body);
            const auraGeo = new THREE.TorusGeometry(0.8, 0.02, 8, 32);
            const auraMat = new THREE.MeshBasicMaterial({ color: 0x440066, transparent: true, opacity: 0.5 });
            for(let i=0; i<3; i++) {
                const aura = new THREE.Mesh(auraGeo, auraMat); aura.rotation.x = Math.PI / 2; aura.position.y = 0.1 + i * 0.3; aura.scale.setScalar(1.0 - i * 0.2);
                this.mesh.add(aura); this.parts.push(aura);
            }
            this.wingL = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 4, 8), bodyMat); this.wingL.rotation.x = Math.PI/2; this.wingL.position.set(-0.4, 0.1, 0); this.body.add(this.wingL);
            this.wingR = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 4, 8), bodyMat); this.wingR.rotation.x = Math.PI/2; this.wingR.position.set(0.4, 0.1, 0); this.body.add(this.wingR);
            this.headGroup = new THREE.Group(); this.headGroup.position.set(0, 0.6, 0.4); this.mesh.add(this.headGroup);
            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.6, 12), bodyMat); neck.position.y = 0.3; neck.rotation.x = -0.3; this.headGroup.add(neck);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), bodyMat); head.position.y = 0.6; this.headGroup.add(head);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat); eyeL.position.set(-0.16, 0.06, 0.2); head.add(eyeL);
            const eyeR = new THREE.Mesh(eyeL.geometry, eyeMat); eyeR.position.set(0.16, 0.06, 0.2); head.add(eyeR);
            const glowL = new THREE.PointLight(0xff0000, 1, 2); glowL.position.copy(eyeL.position); head.add(glowL);
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x222222 })); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0, 0.3); head.add(beak);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x221100 });
            this.legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8), legMat); this.legL.position.set(-0.25, 0.2, 0); this.mesh.add(this.legL);
            this.legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8), legMat); this.legR.position.set(0.25, 0.2, 0); this.mesh.add(this.legR);
        } else {
            this.body = new THREE.Mesh(new THREE.SphereGeometry(typeConfig.scale, 16, 16), mat); this.mesh.add(this.body);
        }

        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.y = typeConfig.scale + 1.2 + (typeConfig.yOffset || 0); 
        this.mesh.add(this.healthBarGroup);
        this.healthBarGroup.add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })));
        this.healthBar = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.18), new THREE.MeshBasicMaterial({ color: 0x2ecc71 }));
        this.healthBar.position.z = 0.01; this.healthBarGroup.add(this.healthBar);

        this.stunStars = new THREE.Group(); this.stunStars.position.y = this.healthBarGroup.position.y + 0.6; this.stunStars.visible = false; this.mesh.add(this.stunStars);
        const starGeo = new THREE.DodecahedronGeometry(0.12); const starMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, emissive: 0xf1c40f, emissiveIntensity: 0.8 });
        for(let i=0; i<3; i++) {
            const star = new THREE.Mesh(starGeo, starMat); star.position.set(Math.cos((i/3)*Math.PI*2)*0.5, 0, Math.sin((i/3)*Math.PI*2)*0.5); this.stunStars.add(star);
        }
    }

    addEffect(type, duration, data = {}) {
        const existing = this.activeEffects.find(e => e.type === type);
        if (existing) {
            existing.duration = Math.max(existing.duration, duration);
            // Don't overwrite tick if it already exists to avoid resetting DoT progress
            const { tick, ...otherData } = data;
            existing.data = { ...existing.data, ...otherData };
        } else {
            this.activeEffects.push({ type, duration, data: { ...data } });
            this._onEffectStart(type, data);
        }
    }

    _onEffectStart(type, data) {
        if (type === 'freeze') {
            if (this.iceBlock) {
                this.iceBlock.visible = true;
                this.iceBlock.scale.set(0.1, 0.1, 0.1);
            }
        }
    }

    _onEffectEnd(type) {
        if (type === 'freeze') {
            if (this.iceBlock) this.iceBlock.visible = false;
            if (this.body) this.body.material.color.setHex(this.config.color);
        } else if (type === 'stun') {
            this.mesh.rotation.z = 0;
            this.mesh.rotation.x = 0;
            if (this.stunStars) this.stunStars.visible = false;
        }
    }

    applyBleed(duration, color = 0x880000, dmgPerTick = 0.5) { this.addEffect('bleed', duration, { color, tick: 0, dmg: dmgPerTick }); }
    applyStun(duration) { this.addEffect('stun', duration); }
    applyFreeze(duration) { this.addEffect('freeze', duration); }

    takeDamage(amount, color = 0xffffff) {
        this.hp -= amount;
        if (this.callbacks.playSound) this.callbacks.playSound('hit');
        if (this.callbacks.vfxList) {
            this.callbacks.vfxList.push(new this.callbacks.DamageNumber(this.scene, Math.ceil(amount), this.mesh.position, color));
            for(let i=0; i<5; i++) this.callbacks.vfxList.push(new this.callbacks.Particle(this.scene, this.mesh.position, color));
        }
        const pct = Math.max(0, this.hp / this.maxHp);
        this.healthBar.scale.x = pct; this.healthBar.position.x = -0.5 * (1 - pct);
        if (this.body) {
            const oldColor = this.body.material.color.getHex();
            this.body.material.color.setHex(0xffffff); this.body.material.emissive.setHex(0xffffff); this.body.material.emissiveIntensity = 1.0;
            setTimeout(() => { if(this.body) { this.body.material.color.setHex(oldColor); this.body.material.emissive.setHex(0x000000); this.body.material.emissiveIntensity = 0; } }, 100);
        }
        if (this.hp <= 0 && this.config.name === 'Fly' && !this.isExploding) {
            this.isExploding = true; this.explosionTimer = 1.0;
            if (this.body) { this.body.material.color.setHex(0xff0000); this.body.material.emissive.setHex(0xff0000); this.body.material.emissiveIntensity = 1.0; }
            return false; 
        }
        return this.hp <= 0;
    }

    hasEffect(type) {
        return this.activeEffects.some(e => e.type === type);
    }

    getEffect(type) {
        return this.activeEffects.find(e => e.type === type);
    }

    updateStatusEffects(dt, camera) {
        if (this.isExploding) {
            this.explosionTimer -= dt;
            const s = 0.05 + (1.0 - this.explosionTimer) * 0.1; // Increased jitter
            this.mesh.position.x += (Math.random() - 0.5) * s; this.mesh.position.z += (Math.random() - 0.5) * s;
            
            if (this.body) { 
                // More aggressive pulsing: higher frequency and intensity as it nears explosion
                const speedMult = 1.0 + (1.0 - this.explosionTimer) * 30.0;
                const intensity = (Math.sin(Date.now() * 0.015 * speedMult) * 0.5 + 0.5) * 10.0;
                this.body.material.emissiveIntensity = 1.0 + intensity;
                this.body.material.emissive.setHex(0xff4400);
            }

            if (this.explosionTimer <= 0) {
                if (this.callbacks.vfxList) {
                    // Larger, bright explosive VFX
                    this.callbacks.vfxList.push(new this.callbacks.AttackVFX(this.scene, this.mesh.position, null, 5.0, Math.PI*2, 0xff4400, 0.4));
                    // Additional particles for impact
                    for(let i=0; i<20; i++) {
                        const color = Math.random() > 0.5 ? 0xff4400 : 0xffcc00;
                        this.callbacks.vfxList.push(new this.callbacks.Particle(this.scene, this.mesh.position, color));
                    }
                }
                const d = this.mesh.position.distanceTo(this.callbacks.player.mesh.position);
                if (d < 4.0) {
                    if (!this.callbacks.player.invulnerable) this.callbacks.player.takeDamage(1.5, this);
                    if (this.callbacks.applyShake) this.callbacks.applyShake(0.6, 0.4);
                }
                this.hp = -1; this.isExploding = false;
            }
            return true; 
        }

        if (this.mesh.position.y > this.config.yOffset) { this.mesh.position.y -= dt * 5.0; if (this.mesh.position.y < this.config.yOffset) this.mesh.position.y = this.config.yOffset; }
        else if (this.mesh.position.y < this.config.yOffset) { this.mesh.position.y = this.config.yOffset; }

        let incapacitated = false;

        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.duration -= dt;

            if (effect.type === 'freeze') {
                incapacitated = true;
                if (this.iceBlock) { 
                    const s = Math.min(1.0, this.iceBlock.scale.x + dt * 5.0); 
                    this.iceBlock.scale.set(s, s, s); 
                    this.iceBlock.rotation.y += dt * 0.5; 
                }
            } else if (effect.type === 'bleed') {
                effect.data.tick += dt;
                // Periodic blood particles for visual feedback
                if (Math.random() < 0.1 && this.callbacks.vfxList) {
                    this.callbacks.vfxList.push(new this.callbacks.Particle(this.scene, this.mesh.position, effect.data.color || 0x880000));
                }
                if (effect.data.tick >= 0.5) {
                    this.takeDamage(effect.data.dmg || 0.5, effect.data.color);
                    effect.data.tick = 0;
                }
            } else if (effect.type === 'burn') {
                effect.data.tick += dt;
                if (effect.data.tick >= 0.25) {
                    this.takeDamage(0.5, 0xff4400);
                    effect.data.tick = 0;
                }
            } else if (effect.type === 'stun') {
                incapacitated = true;
                this.mesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.2; 
                this.mesh.rotation.x = Math.cos(Date.now() * 0.015) * 0.1;
                if (this.stunStars) { this.stunStars.visible = true; this.stunStars.rotation.y += dt * 5.0; }
                this.healthBarGroup.lookAt(camera.position);
            }

            if (effect.duration <= 0) {
                this._onEffectEnd(effect.type);
                this.activeEffects.splice(i, 1);
            }
        }
        
        return incapacitated;
    }

    updateAnimations(dt) {
        const time = Date.now() * 0.001 + this.timeOffset;
        if (this.wings) this.wings.forEach((w, i) => { w.rotation.z = Math.sin(time * 20.0 + i) * 0.5; });
        if (this.parts && this.velocity.length() > 0.1) this.parts.forEach((p, i) => { p.rotation.x = Math.sin(time * 12.0 + i) * 0.4; });
        if (this.head && this.velocity.length() > 0.1) this.head.rotation.y = Math.sin(time * 5.0) * 0.1;
        if (this.tail) this.tail.rotation.z = Math.sin(time * 3.0) * 0.2;
        if (this.config.shape === 'goose' && this.parts) this.parts.forEach((p, i) => { if (p.geometry && p.geometry.type === 'TorusGeometry') p.rotation.z += dt * (i + 1) * 2.0; });
    }

    updateTelegraphs(dt, playerPosition, camera, distToPlayer) {
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.isAttacking) {
            this.attackWindUp += dt; const progress = this.attackWindUp / this.attackDuration;
            
            if (this.config.name === 'Human' && this.armR) {
                // Human pulls back the rake and trembles with effort
                this.armR.rotation.x = -progress * Math.PI * 0.6;
                const tremble = Math.sin(Date.now() * 0.05) * 0.05 * progress;
                this.armR.rotation.z = tremble;
            } else {
                this.body.scale.set(1.3, 0.5, 1.3);
            }

            if (this.config.name === 'Fly') this.mesh.position.y = this.config.yOffset - Math.sin(progress * Math.PI) * 1.0;
            if (Math.floor((Date.now()*0.001+this.timeOffset) * 20) % 2 === 0) { this.body.material.emissive.setHex(0xff0000); this.body.material.emissiveIntensity = 0.5; }
            else { this.body.material.emissive.setHex(0x000000); }
            if (this.attackWindUp >= this.attackDuration) {
                this.isAttacking = false; this.attackWindUp = 0; this.attackCooldown = this.attackCooldownMax;
                this.body.scale.set(1, 1, 1); this.body.material.emissive.setHex(0x000000);
                if (this.armR) { this.armR.rotation.x = 0; this.armR.rotation.z = 0; }
                const lungeDir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize();
                this.velocity.add(lungeDir.multiplyScalar(15));
                if (distToPlayer < (this.config.hitRadius || 1.0) + 0.5) {
                    if (!this.callbacks.player.invulnerable && !this.callbacks.player.isDashing) {
                        if (this.callbacks.applyShake) this.callbacks.applyShake(0.4, 0.3); 
                        this.callbacks.player.takeDamage(1, this);
                        const pushDir = new this.THREE.Vector3().subVectors(this.callbacks.player.mesh.position, this.mesh.position).normalize();
                        this.callbacks.player.velocity.add(pushDir.multiplyScalar(15.0)); 
                    }
                }
            }
            this.healthBarGroup.lookAt(camera.position); return true; 
        }
        if (distToPlayer < (this.config.hitRadius || 1.0) + 1.0 && this.attackCooldown <= 0 && !['Slime', 'Micro-Slime', 'Bull', 'Wild Boar', 'The Gardener', 'Spitter Plant'].includes(this.config.name)) {
            this.isAttacking = true; this.attackWindUp = 0;
        }
        return false;
    }

    updateAI(dt, playerPosition, camera, distToPlayer) {
        const time = Date.now() * 0.001 + this.timeOffset;
        if (this.config.name === 'Slime') {
            this.body.scale.set(1.0 + Math.sin(time * 10) * 0.1, 1.0 - Math.sin(time * 10) * 0.1, 1.0 + Math.sin(time * 10) * 0.1);
            if (this.body.children[0]) this.body.children[0].scale.setScalar(0.8 + Math.sin(time * 15) * 0.2);
            if (distToPlayer < 8) {
                this.speed = 0; 
                if (!this.lastSpit) this.lastSpit = 0;
                if (Date.now() - this.lastSpit > 3000) {
                    this.lastSpit = Date.now(); this.body.scale.set(1.4, 0.6, 1.4);
                    setTimeout(() => {
                        if(this.mesh && this.body) {
                            const dir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize();
                            if (this.callbacks.projectiles) {
                                const p = new this.callbacks.Projectile(this.scene, this.mesh.position.clone().add(new this.THREE.Vector3(0,0.5,0)), dir.multiplyScalar(6), 1);
                                if(p.mesh.geometry) p.mesh.geometry.dispose(); p.mesh.geometry = new this.THREE.SphereGeometry(0.25, 16, 16);
                                p.mesh.material.color.setHex(0x2ecc71); p.mesh.material.opacity = 0.6; p.mesh.material.transparent = true;
                                p.isEnemy = true; this.callbacks.projectiles.push(p);
                            }
                        }
                    }, 600);
                }
            } else { this.speed = this.config.speed; }
        } else if (this.config.name === 'Spitter Plant') {
            this.speed = 0;
            if (this.head) this.head.lookAt(playerPosition);
            if (!this.lastSpit) this.lastSpit = Date.now();
            if (Date.now() - this.lastSpit > 2000) {
                this.lastSpit = Date.now();
                if (this.head) this.head.scale.setScalar(1.3);
                setTimeout(() => { if (this.head) this.head.scale.setScalar(1.0); }, 200);
                if (this.callbacks.projectiles) {
                    const dir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize();
                    const p = new this.callbacks.Projectile(this.scene, this.mesh.position.clone().add(new this.THREE.Vector3(0,0.6,0)), dir.multiplyScalar(6), 1);
                    if(p.mesh.geometry) p.mesh.geometry.dispose(); p.mesh.geometry = new this.THREE.SphereGeometry(0.25, 16, 16);
                    p.mesh.material.color.setHex(0xe74c3c); p.isEnemy = true; this.callbacks.projectiles.push(p);
                }
            }
            return true;
        } else if (this.config.name === 'The Gardener') {
            if (!this.state) { this.state = 'idle'; this.activePlants = []; }
            if (!this.timer) this.timer = 0;
            this.timer += dt;
            if (!this.plantCooldown) this.plantCooldown = 0;
            if (this.plantCooldown > 0) this.plantCooldown -= dt;
            
            // Clean dead plants
            this.activePlants = this.activePlants.filter(p => p.hp > 0);

            // Phase 2
            const isEnraged = this.hp < this.maxHp * 0.5;
            if (isEnraged) {
                this.speed = this.config.speed * 1.2;
                if (Math.floor(time * 10) % 2 === 0) this.body.material.emissive.setHex(0xff0000);
                else this.body.material.emissive.setHex(0x000000);
            } else {
                this.speed = this.config.speed;
            }

            if (this.state === 'idle') {
                if (distToPlayer < 3.5 && this.activeEffects.length === 0) {
                    // Rake Sweep
                    this.state = 'sweep_winding'; this.timer = 0;
                } else if (distToPlayer > 4.0 && this.plantCooldown <= 0 && this.activePlants.length < 3) {
                    // Summon Plant
                    this.state = 'summoning'; this.timer = 0;
                }
            } else if (this.state === 'sweep_winding') {
                this.speed = 0;
                this.mesh.lookAt(playerPosition);
                if (this.armR) {
                    this.armR.rotation.z = Math.PI / 2; // Raise rake sideways
                    this.armR.rotation.y = -Math.PI / 4 + (this.timer / 0.8) * Math.PI / 2;
                }
                if (this.timer > 0.8) {
                    this.state = 'sweeping'; this.timer = 0;
                    // Execute Sweep
                    if (this.callbacks.applyShake) this.callbacks.applyShake(0.3, 0.2);
                    // VFX
                    const forward = new this.THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion);
                    if (this.callbacks.vfxList) {
                        this.callbacks.vfxList.push(new this.callbacks.AttackVFX(this.scene, this.mesh.position, null, 3.5, Math.PI * 0.8, 0xffffff, 0.2));
                    }
                    // Hit Check
                    const angle = Math.PI * 0.8; // 144 degrees
                    if (distToPlayer < 3.5) {
                        const toPlayer = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize();
                        if (forward.dot(toPlayer) > Math.cos(angle/2)) {
                            if (!this.callbacks.player.invulnerable && !this.callbacks.player.isDashing) {
                                this.callbacks.player.takeDamage(1, this);
                                const push = toPlayer.clone().multiplyScalar(15.0);
                                this.callbacks.player.velocity.add(push);
                            }
                        }
                    }
                }
            } else if (this.state === 'sweeping') {
                this.speed = 0;
                if (this.armR) {
                    this.armR.rotation.y = Math.PI / 4 - (this.timer / 0.3) * Math.PI; // Swing
                }
                if (this.timer > 0.3) {
                    this.state = 'idle'; this.timer = 0; 
                    if (this.armR) { this.armR.rotation.set(0,0,0); }
                }
            } else if (this.state === 'summoning') {
                this.speed = 0;
                if (this.armL) this.armL.rotation.x = Math.PI; // Raise hand
                if (this.timer > 1.0) {
                    // Spawn
                    const offsetX = (Math.random() - 0.5) * 8.0;
                    const offsetZ = (Math.random() - 0.5) * 8.0;
                    // Need a way to spawn enemy dynamically. We can't access spawnWave logic here easily without passing a callback.
                    // But we likely don't have a 'spawnEnemy' callback in 'callbacks'. 
                    // However, we can hack it by cloning a prototype or just creating a new Enemy3D if we had access to the class.
                    // Since we are INSIDE the class, we can't 'new Enemy3D' easily if it's not imported or passed.
                    // BUT, we can use a workaround: The `activePlants` is just for counting.
                    // Actually, `spawnWave` in `world.js` doesn't pass a spawner.
                    // Check callbacks... { playSound, DamageNumber, ... }
                    // We might need to add a spawner callback.
                    // For now, let's just make him 'throw' a seed that becomes a plant? 
                    // Or we can rely on `this.scene` but we need to register it in the `enemies` array in `index.js`.
                    // The `enemies` array is passed to `update`! 
                    // `update(dt, playerPosition, camera, otherEnemies)` -> `otherEnemies` IS the list!
                    
                    // CRITICAL: We need `ENEMY_TYPES` config to spawn. It is imported at top.
                    // We need `Enemy3D` class. It is the class we are in.
                    
                    // So:
                    const p = this.mesh.position.clone().add(new this.THREE.Vector3(offsetX, 0, offsetZ));
                    // Check bounds? Assume valid.
                    const plant = new Enemy3D(this.scene, p.x, p.z, ENEMY_TYPES.SPITTER_PLANT, this.callbacks);
                    
                    // We need to add it to `otherEnemies` array.
                    if (otherEnemies) otherEnemies.push(plant);
                    this.activePlants.push(plant);
                    
                    this.state = 'idle'; this.timer = 0; this.plantCooldown = isEnraged ? 4.0 : 6.0;
                    if (this.armL) this.armL.rotation.x = 0;
                }
            }
        } else if (this.config.name === 'Rat') {
            if (!this.state) this.state = 'idle';
            if (!this.timer) this.timer = 0;
            this.timer += dt;

            if (this.state === 'idle') {
                this.speed = this.config.speed;
                if (distToPlayer < 5.0 && distToPlayer > 1.5 && this.attackCooldown <= 0) {
                     this.state = 'winding'; this.timer = 0;
                }
            } else if (this.state === 'winding') {
                this.speed = 0;
                this.body.material.emissive.setHex(Math.floor(Date.now() * 0.05) % 2 === 0 ? 0xff0000 : 0x000000);
                
                if (this.timer > 0.5) {
                     this.state = 'leaping'; 
                     this.attackCooldown = 2.0 + Math.random(); 
                     this.leapTime = 0; 
                     this.leapDuration = 0.7; 
                     this.leapStart = this.mesh.position.clone(); 
                     this.leapTarget = playerPosition.clone().add(this.callbacks.player.velocity.clone().multiplyScalar(0.15)).setY(this.config.yOffset);
                     this.hasHitPlayer = false; 
                     this.body.material.emissive.setHex(0x000000);
                     if (this.callbacks.playSound) this.callbacks.playSound('dash', 0.5);
                }
            } else if (this.state === 'leaping') {
                this.leapTime += dt; const t = Math.min(this.leapTime / this.leapDuration, 1.0);
                this.mesh.position.lerpVectors(this.leapStart, this.leapTarget, t).y += Math.sin(t * Math.PI) * 2.0;
                this.mesh.lookAt(this.leapTarget);
                if (Math.pow(this.mesh.position.x - playerPosition.x, 2) + Math.pow(this.mesh.position.z - playerPosition.z, 2) < 1.0 && !this.hasHitPlayer) {
                    this.hasHitPlayer = true; this.callbacks.player.takeDamage(1, this); if (this.callbacks.applyShake) this.callbacks.applyShake(0.2, 0.1);
                }
                if (t >= 1.0) { this.state = 'idle'; this.mesh.position.y = this.config.yOffset; this.speed = 0; setTimeout(() => { if(this.hp>0) this.speed = this.config.speed; }, 500); }
                this.healthBarGroup.lookAt(camera.position); return true; 
            }
        } else if (this.config.name === 'Micro-Slime') {
            this.body.scale.set(1.0 + Math.sin(time * 15) * 0.2, 1.0 - Math.sin(time * 15) * 0.2, 1.0 + Math.sin(time * 15) * 0.2);
        } else if (this.config.name === 'Anti-Goose') {
            if (!this.state) this.state = 'idle';
            if (!this.timer) this.timer = 0;
            this.timer += dt;
            if (!this.dashCooldown) this.dashCooldown = 0;
            if (this.dashCooldown > 0) this.dashCooldown -= dt;

            if (this.state === 'idle') {
                this.speed = this.config.speed;
                if (distToPlayer < 4.0 && this.dashCooldown <= 0) {
                    this.state = 'pre_dash'; this.timer = 0;
                }
            } else if (this.state === 'pre_dash') {
                this.speed = 0;
                this.mesh.lookAt(playerPosition.clone().setY(this.mesh.position.y));
                if (Math.floor(Date.now() * 0.05) % 2 === 0) this.body.material.emissive.setHex(0xff0000);
                else this.body.material.emissive.setHex(0x000000);
                
                if (this.timer > 0.4) {
                    this.state = 'dashing'; this.timer = 0;
                    this.dashDir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize().setY(0);
                    this.body.material.emissive.setHex(0x000000);
                    if (this.callbacks.playSound) this.callbacks.playSound('dash', 0.8);
                }
                return true;
            } else if (this.state === 'dashing') {
                this.velocity.copy(this.dashDir).multiplyScalar(25.0);
                this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
                
                // Trail
                if (this.callbacks.vfxList && Math.random() < 0.5) {
                    this.callbacks.vfxList.push(new this.callbacks.Particle(this.scene, this.mesh.position.clone(), 0x95a5a6));
                }

                if (distToPlayer < 1.0 && !this.callbacks.player.invulnerable && !this.callbacks.player.isDashing) {
                    this.callbacks.player.takeDamage(1, this);
                    if (this.callbacks.applyShake) this.callbacks.applyShake(0.2, 0.2);
                }

                if (this.timer > 0.3) {
                    this.state = 'rest'; this.timer = 0;
                }
                return true;
            } else if (this.state === 'rest') {
                this.speed = 0;
                if (this.timer > 1.0) {
                    this.state = 'idle'; this.timer = 0;
                    this.dashCooldown = 3.0;
                }
                return true;
            }
        } else if (this.config.name === 'Wild Boar') {
            if (!this.state) this.state = 'chase';
            if (!this.timer) this.timer = 0;
            this.timer += dt;
            
            // Cooldowns
            if (this.attackCooldown > 0) this.attackCooldown -= dt;
            if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
            if (this.attackCooldown === undefined) this.attackCooldown = 0;
            if (this.chargeCooldown === undefined) this.chargeCooldown = 0;

            if (this.state === 'chase') {
                this.speed = this.config.speed;
                // Gore Trigger
                if (distToPlayer < 2.0 && this.attackCooldown <= 0) {
                    this.state = 'gore_winding'; this.timer = 0;
                    return true;
                }
                // Charge Trigger
                if (distToPlayer > 6.0 && this.chargeCooldown <= 0 && this.timer > 3.0) { 
                    this.state = 'winding'; this.timer = 0;
                    return true;
                }
                return false; // Fallthrough to updatePhysics (Seek)
            } 
            else if (this.state === 'gore_winding') {
                this.speed = 0;
                this.mesh.lookAt(playerPosition.clone().setY(this.mesh.position.y));
                if (this.timer < 0.4) {
                    this.body.material.emissive.setHex(Math.floor(Date.now() * 0.05) % 2 === 0 ? 0xff0000 : 0x000000); // Red flash
                } else {
                    this.state = 'gore_thrust'; this.timer = 0;
                    this.goreDir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize().setY(0);
                    this.body.material.emissive.setHex(0x000000);
                    if (this.callbacks.playSound) this.callbacks.playSound('dash', 0.8);
                }
                return true;
            }
            else if (this.state === 'gore_thrust') {
                 this.speed = 0;
                 const lungeSpeed = 10.0;
                 this.velocity.copy(this.goreDir).multiplyScalar(lungeSpeed);
                 this.mesh.position.add(this.velocity.clone().multiplyScalar(dt)); 
                 
                 if (distToPlayer < 1.5 && !this.callbacks.player.invulnerable && !this.callbacks.player.isDashing) {
                     this.callbacks.player.takeDamage(1, this);
                     if (this.callbacks.applyShake) this.callbacks.applyShake(0.1, 0.1);
                 }
                 
                 if (this.timer > 0.2) {
                     this.state = 'chase'; 
                     this.timer = 0; 
                     this.attackCooldown = 1.5;
                 }
                 return true;
            }
            else if (this.state === 'winding') {
                this.speed = 0;
                if (this.timer < 0.05) {
                    const offset = (Math.random() - 0.5) * 1.4;
                    const target = playerPosition.clone().add(new this.THREE.Vector3(offset, 0, offset));
                    this.chargeDir = new this.THREE.Vector3().subVectors(target, this.mesh.position).normalize().setY(0);
                    this.mesh.lookAt(this.mesh.position.clone().add(this.chargeDir));
                }
                this.body.material.emissive.setHex(Math.floor(Date.now() * 0.02) % 2 === 0 ? 0xff4400 : 0x000000);
                this.body.material.emissiveIntensity = 1.0;
                this.mesh.position.x += (Math.random() - 0.5) * 0.15;
                this.mesh.position.z += (Math.random() - 0.5) * 0.15;

                if (this.timer > 1.5) {
                    this.state = 'charging'; this.timer = 0;
                    this.body.material.emissive.setHex(0x000000);
                }
                return true;
            } else if (this.state === 'charging') {
                this.velocity.copy(this.chargeDir).multiplyScalar(22.0);
                this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));

                if (distToPlayer < this.config.hitRadius && !this.callbacks.player.invulnerable && !this.callbacks.player.isDashing) {
                    this.callbacks.player.takeDamage(2, this);
                    this.callbacks.player.velocity.add(this.chargeDir.clone().multiplyScalar(15.0));
                }
                if (this.timer > 2.5) { 
                    this.state = 'rest'; this.timer = 0; 
                }
                this.healthBarGroup.lookAt(camera.position); return true; 
            } else if (this.state === 'rest') {
                this.speed = 0;
                this.body.rotation.x = 0.3; 
                if (Math.random() < 0.1 && this.callbacks.vfxList) {
                    const p = new this.callbacks.Particle(this.scene, this.mesh.position.clone().add(new this.THREE.Vector3(0,0.8,0.5)), 0xaaaaaa);
                    p.velocity.set(0, 2, 0); this.callbacks.vfxList.push(p);
                }
                if (this.timer > 2.0) { 
                    this.state = 'chase'; this.timer = 0; 
                    this.body.rotation.x = 0; 
                    this.chargeCooldown = 4.0;
                }
                return true;
            }
        } else if (this.config.name === 'Bull') {
            const isRaging = this.hp < this.maxHp * 0.5;
            
            // Manage custom cooldowns
            if (this.stompCooldown > 0) this.stompCooldown -= dt;
            if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
            if (this.stompCooldown === undefined) this.stompCooldown = 0;
            if (this.chargeCooldown === undefined) this.chargeCooldown = 0;

            if (Math.random() < (isRaging ? 0.3 : 0.1) && this.head && this.callbacks.vfxList) {
                const steamPos = new this.THREE.Vector3(0, -0.4, 0.8).applyMatrix4(this.head.matrixWorld);
                const p = new this.callbacks.Particle(this.scene, steamPos, isRaging ? 0xff4400 : 0xaaaaaa);
                p.velocity.set((Math.random()-0.5)*2, 1, (Math.random()-0.5)*2); p.maxLife = 0.5; this.callbacks.vfxList.push(p);
            }
            if (!this.state) this.state = 'idle'; if (!this.timer) this.timer = 0; this.timer += dt;
            
            if (this.state === 'idle') {
                this.speed = this.config.speed * (isRaging ? 1.5 : 1.0);
                // Decision Logic
                if (distToPlayer < 3.5 && this.stompCooldown <= 0) {
                    this.state = 'stomp_winding'; this.timer = 0;
                } else if (distToPlayer >= 3.5 && this.chargeCooldown <= 0) {
                    this.state = 'winding'; this.timer = 0;
                }
            }
            else if (this.state === 'stomp_winding') {
                this.speed = 0;
                this.body.position.y = this.config.yOffset + 0.35 + Math.sin(this.timer * 5) * 0.5; // Raise up
                this.body.rotation.x = -0.5; // Rear up
                this.body.material.emissive.setHex(0xffa500); // Orange
                if (this.timer > 0.6) {
                    // Execute Stomp
                    this.state = 'idle'; this.timer = 0; this.stompCooldown = 3.0;
                    this.body.position.y = this.config.yOffset + 0.35; this.body.rotation.x = 0;
                    this.body.material.emissive.setHex(0x000000);
                    if (this.callbacks.applyShake) this.callbacks.applyShake(0.6, 0.2);
                    if (this.callbacks.vfxList) {
                        this.callbacks.vfxList.push(new this.callbacks.AttackVFX(this.scene, this.mesh.position, null, 4.0, Math.PI*2, 0xffa500));
                    }
                    if (distToPlayer < 4.0 && !this.callbacks.player.invulnerable && !this.callbacks.player.isDashing) {
                        this.callbacks.player.takeDamage(1, this);
                        const pushDir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize();
                        this.callbacks.player.velocity.add(pushDir.multiplyScalar(20.0));
                    }
                }
            }
            else if (this.state === 'winding') {
                this.speed = 0; this.mesh.lookAt(playerPosition.clone().setY(this.mesh.position.y)); 
                this.body.scale.set(1.4, 0.6, 1.4);
                this.body.material.emissive.setHex(Math.floor(time * 20) % 2 === 0 ? 0xff0000 : 0x000000); // Fast red flash
                if (this.timer > 0.8) {
                    this.state = 'charging'; this.timer = 0; 
                    this.body.scale.set(1, 1, 1); this.body.material.emissive.setHex(0x000000);
                    this.chargeDir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize().setY(0);
                }
            } 
            else if (this.state === 'charging') {
                // Tracking for first 0.2s
                if (this.timer < 0.2) {
                    const targetDir = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize().setY(0);
                    this.chargeDir.lerp(targetDir, dt * 5.0).normalize();
                    this.mesh.lookAt(this.mesh.position.clone().add(this.chargeDir));
                }
                this.velocity.copy(this.chargeDir).multiplyScalar(22.0); 
                this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
                
                // Hit Player
                if (distToPlayer < 2.0 && !this.callbacks.player.invulnerable && !this.callbacks.player.isDashing) {
                     this.callbacks.player.takeDamage(1, this);
                     this.callbacks.player.velocity.add(this.chargeDir.clone().multiplyScalar(15.0));
                }

                // Wall Hit
                const limit = CONFIG.WORLD_SIZE / 2 - 1.5;
                if (Math.abs(this.mesh.position.x) > limit || Math.abs(this.mesh.position.z) > limit) { 
                    this.state = 'idle'; this.timer = 0; this.applyStun(2.0); 
                    if (this.callbacks.applyShake) this.callbacks.applyShake(0.5, 0.4); 
                    this.chargeCooldown = 2.0; // Reset CD
                }
                // Miss/Timeout
                if (this.timer > 2.5) { this.state = 'idle'; this.timer = 0; this.chargeCooldown = 1.0; }
                this.healthBarGroup.lookAt(camera.position); return true; 
            }
        }
        return false;
    }

    updatePhysics(dt, playerPosition, otherEnemies) {
        const seekForce = new this.THREE.Vector3().subVectors(playerPosition, this.mesh.position).setY(0);
        if (seekForce.length() > 0) seekForce.normalize();
        const separationForce = new this.THREE.Vector3(); let count = 0;
        if (otherEnemies) {
            otherEnemies.forEach(other => {
                const dist = this.mesh.position.distanceTo(other.mesh.position);
                if (dist < 1.5 && dist > 0) { separationForce.add(new this.THREE.Vector3().subVectors(this.mesh.position, other.mesh.position).setY(0).normalize().divideScalar(dist)); count++; }
            });
        }
        if (count > 0) separationForce.divideScalar(count).normalize();
        const steer = seekForce.multiplyScalar(this.speed * 2.0).add(separationForce.multiplyScalar(this.speed * 3.0));
        this.velocity.lerp(steer, 5.0 * dt).setY(0); this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        const limit = CONFIG.WORLD_SIZE / 2 - 0.5;
        this.mesh.position.x = Math.max(-limit, Math.min(limit, this.mesh.position.x));
        this.mesh.position.z = Math.max(-limit, Math.min(limit, this.mesh.position.z));
        this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
    }

    update(dt, playerPosition, camera, otherEnemies) {
        if (this.updateStatusEffects(dt, camera)) return;
        const dx = this.mesh.position.x - playerPosition.x; const dz = this.mesh.position.z - playerPosition.z;
        const distToPlayer = Math.sqrt(dx*dx + dz*dz);
        this.updateAnimations(dt);
        if (this.updateTelegraphs(dt, playerPosition, camera, distToPlayer)) return;
        if (this.updateAI(dt, playerPosition, camera, distToPlayer)) return;
        
        // Apply Speed Modifiers
        if (this.hasEffect('chill')) this.speed *= 0.5;

        this.updatePhysics(dt, playerPosition, otherEnemies);
        this.healthBarGroup.lookAt(camera.position);
    }

    remove(scene) {
        scene.remove(this.mesh);
        if (this.iceBlock) { this.iceBlock.geometry.dispose(); this.iceBlock.material.dispose(); }
        this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) { if (Array.isArray(child.material)) child.material.forEach(m => m.dispose()); else child.material.dispose(); }
        });
    }
}
