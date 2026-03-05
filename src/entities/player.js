import * as THREE from 'three';
import { createArcMesh } from '../utils/math.js';
import { CONFIG, BALANCE } from '../data/config.js';
import { UPGRADES_REGISTRY } from '../data/registry.js';
import { updateHUD } from '../ui/hud.js';

export class Player3D {
    constructor(scene, callbacks = {}) {
        this.THREE = THREE;
        this.scene = scene;
        this.callbacks = callbacks; // { playSound, applyHitStop, applyShake, spawnFireZone, onGameOver, spawnProjectile, vfxList, enemies }

        this.mesh = new THREE.Group();
        this.speed = BALANCE.PLAYER.BASE_SPEED; 
        this.velocity = new THREE.Vector3();
        this.friction = BALANCE.PLAYER.FRICTION; 
        
        this.maxHp = BALANCE.PLAYER.BASE_HP;
        this.hp = BALANCE.PLAYER.BASE_HP;
        this.damage = 1; 
        this.invulnerable = false;
        
        this.weapon = 'peck'; 
        this.aspect = null; 
        this.dashMod = null; 
        this.hasSwiftFeathers = false;
        this.hasIronBeak = false;
        this.hasBloodScent = false;
        this.hasExsanguinate = false;
        this.hasCombustion = false;
        this.hasShatter = false;
        this.hasIceArmor = false;
        
        this.hasRhythmStrike = false;
        this.hasGlassCannon = false;
        this.hasEcho = false;
        this.hasSniper = false;
        
        this.combo = 0;
        this.comboTimer = 0;

        this.isAttacking = false;
        this.attackTime = 0;
        this.attackDuration = 0.15;
        this.attackCooldown = 0;
        this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.PECK.CD; 
        
        this.chargeTime = 0;
        this.chargeMax = 0.8; 
        this.isCharging = false;

        this.isDashing = false;
        this.dashTime = 0;
        this.dashDuration = BALANCE.PLAYER.DASH.DURATION;
        this.dashCooldown = 0;
        this.dashCooldownMax = BALANCE.PLAYER.DASH.COOLDOWN;
        this.dashVelocity = new THREE.Vector3();
        this.dashHitList = []; 
        
        this.stunHitCounter = 0; 

        this.upgradeLevels = {}; // Map of id -> level
        this.permanentSpeedMul = 1.0;
        this.permanentDashCdMod = 0;
        this.lastSeenOptions = [];
        this.isAutoAttacking = false;

        this.frameCount = 0; // For throttling UI updates

        this._initVisuals();
        
        this.currentAimTarget = new THREE.Vector3(0, 0, 1);
        scene.add(this.mesh);
    }

    _initVisuals() {
        const THREE = this.THREE;
        // Body (Smoother)
        const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.6, 4, 16); 
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        this.bodyMat = bodyMat; 
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.rotation.x = Math.PI / 2;
        this.body.position.y = 0.5; 
        this.body.castShadow = true;
        this.mesh.add(this.body);

        // Wings
        const wingGeo = new THREE.CapsuleGeometry(0.15, 0.5, 4, 8);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.rotation.x = Math.PI / 2;
        this.wingL.position.set(-0.35, 0.1, 0);
        this.body.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.rotation.x = Math.PI / 2;
        this.wingR.position.set(0.35, 0.1, 0);
        this.body.add(this.wingR);

        // Tail
        const tailGeo = new THREE.ConeGeometry(0.2, 0.4, 16);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.rotation.x = -Math.PI / 2;
        tail.position.set(0, -0.4, 0); 
        this.body.add(tail);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xff9800 });
        this.legL = new THREE.Mesh(legGeo, legMat);
        this.legL.position.set(-0.2, 0.2, 0);
        this.mesh.add(this.legL);
        
        this.legR = new THREE.Mesh(legGeo, legMat);
        this.legR.position.set(0.2, 0.2, 0);
        this.mesh.add(this.legR);
        
        // Webbed Feet
        const footGeo = new THREE.BoxGeometry(0.15, 0.05, 0.2);
        const footL = new THREE.Mesh(footGeo, legMat);
        footL.position.y = -0.2;
        footL.position.z = 0.05;
        this.legL.add(footL);
        
        const footR = new THREE.Mesh(footGeo, legMat);
        footR.position.y = -0.2;
        footR.position.z = 0.05;
        this.legR.add(footR);

        // Head Group (Neck + Head)
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 0.6, 0.4); 
        this.mesh.add(this.headGroup);

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 12);
        const neck = new THREE.Mesh(neckGeo, bodyMat);
        neck.position.y = 0.2;
        neck.rotation.x = -0.2;
        this.headGroup.add(neck);

        // Head Sphere
        const headGeo = new THREE.SphereGeometry(0.25, 32, 32); 
        this.head = new THREE.Mesh(headGeo, bodyMat);
        this.head.position.y = 0.5;
        this.head.castShadow = true;
        this.headGroup.add(this.head);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.eyeMat = eyeMat; 
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.15, 0.05, 0.18);
        this.head.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.15, 0.05, 0.18);
        this.head.add(eyeR);

        // Beak
        const beakGeo = new THREE.ConeGeometry(0.08, 0.3, 16);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xff9800 });
        this.beakMat = beakMat; 
        this.beak = new THREE.Mesh(beakGeo, beakMat);
        this.beak.rotation.x = -Math.PI / 2; 
        this.beak.position.set(0, 0, 0.25); 
        this.beak.castShadow = true;
        this.head.add(this.beak);

        // Weapon Socket
        this.weaponSocket = new THREE.Group();
        this.weaponSocket.position.set(0, -0.15, 0); 
        this.beak.add(this.weaponSocket);

        this._initWeaponVisuals();

        this.mesh.frustumCulled = false;
        this.mesh.traverse(child => child.frustumCulled = false);

        // Charge Ring
        this.chargeRing = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 1.3, 32),
            new THREE.MeshBasicMaterial({ color: 0x8e44ad, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        this.chargeRing.rotation.x = -Math.PI / 2;
        this.chargeRing.position.y = 0.05;
        this.chargeRing.visible = false;
        this.mesh.add(this.chargeRing);

        // Aim Guide
        this.aimGuide = createArcMesh(2.0, 2.53, 0xffffff, 0.2);
        this.aimGuide.position.y = 0.1; 
        this.scene.add(this.aimGuide);

        // Target Marker
        const targetGeo = new THREE.RingGeometry(0.8, 1.0, 32);
        const targetMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        this.targetMarker = new THREE.Mesh(targetGeo, targetMat);
        this.targetMarker.rotation.x = -Math.PI / 2;
        this.targetMarker.visible = false;
        this.scene.add(this.targetMarker);

        // Cooldown Ring
        const cdGeo = new THREE.RingGeometry(0.5, 0.6, 32);
        const cdMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        this.cooldownRing = new THREE.Mesh(cdGeo, cdMat);
        this.cooldownRing.rotation.x = -Math.PI / 2;
        this.cooldownRing.position.y = 0.04;
        this.cooldownRing.visible = false;
        this.scene.add(this.cooldownRing);
    }

    _initWeaponVisuals() {
        const THREE = this.THREE;
        // Bat
        this.visBat = new THREE.Group();
        this.visBat.visible = false;
        this.visBat.rotation.z = -Math.PI / 2;
        this.weaponSocket.add(this.visBat);
        const batMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0xd35400 }));
        batMesh.position.y = 0.5; 
        this.visBat.add(batMesh);
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xecf0f1 }));
        grip.position.y = 0.1; 
        this.visBat.add(grip);

        // Knife
        this.visKnife = new THREE.Group();
        this.visKnife.visible = false;
        this.visKnife.rotation.x = Math.PI / 2; 
        this.weaponSocket.add(this.visKnife);
        const kBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.015), new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 1.0 }));
        kBlade.position.set(0, 0.4, 0); 
        this.visKnife.add(kBlade);
        const kGuard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.04), new THREE.MeshStandardMaterial({ color: 0x34495e }));
        kGuard.position.set(0, 0.2, 0);
        this.visKnife.add(kGuard);
        const kHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.15), new THREE.MeshStandardMaterial({ color: 0x2c3e50 }));
        kHandle.position.set(0, 0.1, 0);
        this.visKnife.add(kHandle);

        // Grimoire
        this.visGrimoire = new THREE.Group();
        this.visGrimoire.visible = false;
        this.weaponSocket.add(this.visGrimoire);
        const coverMat = new THREE.MeshStandardMaterial({ color: 0x8e44ad });
        const pageMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1 });
        const leftPageGroup = new THREE.Group();
        leftPageGroup.rotation.y = -0.3; 
        this.visGrimoire.add(leftPageGroup);
        const lCover = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.04), coverMat);
        lCover.position.x = -0.1;
        leftPageGroup.add(lCover);
        const lPage = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.02), pageMat);
        lPage.position.set(-0.1, 0, 0.02);
        leftPageGroup.add(lPage);
        const rightPageGroup = new THREE.Group();
        rightPageGroup.rotation.y = 0.3; 
        this.visGrimoire.add(rightPageGroup);
        const rCover = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.04), coverMat);
        rCover.position.x = 0.1;
        rightPageGroup.add(rCover);
        const rPage = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.02), pageMat);
        rPage.position.set(0.1, 0, 0.02);
        rightPageGroup.add(rPage);
        this.visGrimoire.position.y = 0.2; 
        this.visGrimoire.rotation.x = -Math.PI / 4; 

        // Molten Breath
        this.visBreath = new THREE.Group();
        this.visBreath.visible = false;
        this.weaponSocket.add(this.visBreath);
        const breathCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xe67e22, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
        breathCone.rotation.x = -Math.PI / 2;
        breathCone.position.z = 0.3;
        this.visBreath.add(breathCone);

        // Shuriken Halo
        this.haloGroup = new THREE.Group();
        this.haloGroup.position.set(0, 0.3, 0); 
        this.haloGroup.visible = false;
        this.weaponSocket.add(this.haloGroup);

        const starShape = new THREE.Shape();
        const spikes = 4;
        const outer = 0.15;
        const inner = 0.05;
        for(let i=0; i<spikes*2; i++){
            const r = (i%2 === 0) ? outer : inner;
            const a = (i / (spikes*2)) * Math.PI * 2;
            if(i===0) starShape.moveTo(Math.cos(a)*r, Math.sin(a)*r);
            else starShape.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.02, bevelEnabled: false });
        const starMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 1.0, emissive: 0xf39c12, emissiveIntensity: 0.5 });
        for(let i=0; i<3; i++) {
            const star = new THREE.Mesh(starGeo, starMat);
            star.rotation.x = Math.PI / 2;
            const angle = (i / 3) * Math.PI * 2;
            star.position.set(Math.cos(angle)*0.5, 0, Math.sin(angle)*0.5);
            this.haloGroup.add(star);
        }
    }

    reset() {
        this.maxHp = BALANCE.PLAYER.BASE_HP;
        this.hp = BALANCE.PLAYER.BASE_HP;
        this.damage = 1;
        this.speed = BALANCE.PLAYER.BASE_SPEED;
        this.weapon = 'peck';
        this.aspect = null;
        this.dashMod = null;
        this.upgradeLevels = {}; // Map of id -> level
        this.lastSeenOptions = [];
        this.permanentSpeedMul = 1.0;
        this.permanentDashCdMod = 0;
        this.dashCooldownMax = BALANCE.PLAYER.DASH.COOLDOWN;
        
        this.hasSwiftFeathers = false;
        this.hasIronBeak = false;
        this.hasBloodScent = false;
        this.hasExsanguinate = false;
        this.hasCombustion = false;
        this.hasShatter = false;
        this.hasIceArmor = false;
        this.hasRhythmStrike = false;
        this.hasGlassCannon = false;
        this.hasEcho = false;
        this.hasSniper = false;
        this.combo = 0;
        this.comboTimer = 0;
        
        this.visKnife.visible = false;
        this.visBat.visible = false;
        this.haloGroup.visible = false;
        this.visGrimoire.visible = false;
        this.visBreath.visible = false;
        
        this.wingL.material = this.bodyMat;
        this.wingR.material = this.bodyMat;
        this.beak.material = this.beakMat;
        this.eyeMat.color.setHex(0x000000);
        
        this.mesh.scale.set(1,1,1);
        if (this.aimGuide) this.aimGuide.visible = true;
    }

    addUpgrade(id, callbacks = {}) {
        const u = UPGRADES_REGISTRY.find(item => item.id === id);
        if (!u) return;

        this.upgradeLevels[id] = (this.upgradeLevels[id] || 0) + 1;
        const level = this.upgradeLevels[id];

        // 1. Core Swaps
        if (u.type === 'weapon') {
            this._handleWeaponSwap(u);
        } else if (u.type === 'aspect') {
            this._handleAspectSwap(u);
        } else if (u.type === 'dash_mod') {
            this.dashMod = id;
        }

        // 2. Binary Feature Flags
        this._updateFeatureFlags(id);

        // 3. Stat Scaling & Specialized Logic
        this._applyUpgradeScaling(u, level, callbacks);

        this.updateUI();
    }

    _handleWeaponSwap(u) {
        this.visKnife.visible = false;
        this.visBat.visible = false;
        this.visGrimoire.visible = false;
        this.haloGroup.visible = false;
        this.visBreath.visible = false;
        
        this.weapon = u.id;
        this.aspect = null; // Reset aspect on weapon swap
        
        if (u.id === 'knife') this.visKnife.visible = true;
        if (u.id === 'bat') this.visBat.visible = true;
        if (u.id === 'shuriken') this.haloGroup.visible = true;
        if (u.id === 'grimoire') this.visGrimoire.visible = true;
        if (u.id === 'molten_breath') this.visBreath.visible = true;
    }

    _handleAspectSwap(u) {
        this.aspect = u.id;
        // Aspect-specific visual changes
        if (u.id.includes('multi')) this.haloGroup.scale.setScalar(1.5);
        if (u.id.includes('machete')) this.visKnife.scale.set(1.5, 2.0, 1.5);
        if (u.id.includes('poison')) {
            this.visKnife.traverse(child => { 
                if (child.isMesh && child.geometry.type === 'BoxGeometry') 
                    child.material.color.setHex(0x2ecc71); 
            });
        }
        if (u.id === 'grimoire_power') {
            this.visGrimoire.traverse(child => {
                if (child.isMesh && (child.material.color.getHex() === 0x8e44ad || child.material.color.getHex() === 0x2c3e50)) {
                    child.material = child.material.clone(); 
                    child.material.color.setHex(0x2c3e50);
                }
            });
        }
    }

    _updateFeatureFlags(id) {
        const flagMap = {
            'swift_feathers': 'hasSwiftFeathers',
            'iron_beak': 'hasIronBeak',
            'blood_scent': 'hasBloodScent',
            'exsanguinate': 'hasExsanguinate',
            'combustion': 'hasCombustion',
            'shatter': 'hasShatter',
            'ice_armor': 'hasIceArmor',
            'rhythm_strike': 'hasRhythmStrike',
            'glass_cannon': 'hasGlassCannon',
            'echo': 'hasEcho',
            'sniper': 'hasSniper'
        };
        if (flagMap[id]) this[flagMap[id]] = true;
    }

    _getInc(id) {
        const u = UPGRADES_REGISTRY.find(x => x.id === id);
        return u && u.scaling ? u.scaling.increment : 0;
    }

    _applyUpgradeScaling(u, level, callbacks) {
        const id = u.id;
        if (!u.scaling) return;
        const inc = u.scaling.increment;

        // 1. Generic Stat Application
        const stat = u.scaling.stat;
        if (stat === 'maxHp') {
            this.maxHp += inc;
            this.hp = Math.min(this.maxHp, this.hp + Math.ceil(this.maxHp * 0.25));
        } else if (stat === 'speedMul') {
            this.permanentSpeedMul += inc;
        } else if (stat === 'dashCd') {
            const reduction = (level === 1 && id === 'dash_cd') ? 0.5 : inc;
            this.permanentDashCdMod += reduction;
            this.dashCooldownMax = Math.max(0.4, this.dashCooldownMax - reduction);
        }

        // 2. Specialized logic (Visuals & Side-effects)
        if (id === 'swift_feathers') {
            if (level === 1) {
                const reduction = 0.5;
                this.permanentDashCdMod += reduction;
                this.dashCooldownMax = Math.max(0.5, this.dashCooldownMax - reduction);
            }
            const mat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                emissive: 0x00ffff, 
                emissiveIntensity: 0.5 + (level-1) * 0.2 
            });
            this.wingL.material = mat;
            this.wingR.material = mat;
        } else if (id === 'iron_beak') {
            this.beak.material = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.8 });
        }
    }

    updateUI() {
        updateHUD(this);
    }

    attack() {
        if (this.weapon === 'grimoire') return; 
        if (this.isAttacking || this.attackCooldown > 0) return;
        
        this.isAttacking = true;
        this.attackTime = 0;
        if (this.callbacks.playSound) this.callbacks.playSound('honk');
        
        if (this.weapon === 'peck') this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.PECK.CD;
        else if (this.weapon === 'knife') this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.KNIFE.CD;
        else if (this.weapon === 'shuriken') this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.SHURIKEN.CD;
        else if (this.weapon === 'bat') this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.BAT.CD;
        else if (this.weapon === 'molten_breath') this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.MOLTEN_BREATH.CD;
        else if (this.weapon === 'icicle_spit') this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.ICICLE_SPIT.CD;
        else if (this.weapon === 'void_orb') this.attackCooldownMax = BALANCE.PLAYER.WEAPONS.VOID_ORB.CD;

        if (this.aspect === 'peck_frenzy') {
            const level = this.upgradeLevels['peck_frenzy'] || 1;
            const bonus = Math.min(0.5, this.combo * this._getInc('peck_frenzy') * level);
            this.attackCooldownMax /= (1 + bonus);
        }

        this.attackCooldown = this.attackCooldownMax;

        if (this.weapon === 'shuriken') {
            const target = this.currentAimTarget;
            const dir = new this.THREE.Vector3().subVectors(target, this.mesh.position);
            dir.y = 0;
            dir.normalize();
            
            const startPos = this.mesh.position.clone().add(new this.THREE.Vector3(0, 0.5, 0));
            let dmg = 3 + (this.damage - 1); 
            const level = this.upgradeLevels['shuriken'] || 1;
            dmg += (level - 1) * this._getInc('shuriken'); 
            const pierce = this.aspect === 'sstar_pierce';

            const projOptions = { critVsFrozen: this.hasShatter, sniperLevel: this.hasSniper ? (this.upgradeLevels['sniper'] || 1) : 0 };
            if (this.aspect === 'sstar_multi') {
                for(let i=-1; i<=1; i++) {
                    const sDir = dir.clone().applyAxisAngle(new this.THREE.Vector3(0,1,0), i * 0.3);
                    if (this.callbacks.spawnProjectile) this.callbacks.spawnProjectile(startPos, sDir.multiplyScalar(12), dmg, pierce, projOptions);
                }
            } else {
                if (this.callbacks.spawnProjectile) this.callbacks.spawnProjectile(startPos, dir.multiplyScalar(12), dmg, pierce, projOptions);
            }
            
        } else if (this.weapon === 'molten_breath') {
            const range = BALANCE.PLAYER.WEAPONS.MOLTEN_BREATH.RANGE;
            const angle = 0.8;
            if (this.callbacks.vfxList) {
                for(let i=0; i<8; i++) {
                    const p = new this.callbacks.Particle(this.scene, this.mesh.position.clone().add(new THREE.Vector3(0,0.5,0)), 0xe67e22);
                    const spread = (Math.random()-0.5)*angle;
                    const dir = new THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion).applyAxisAngle(new THREE.Vector3(0,1,0), spread);
                    p.velocity = dir.multiplyScalar(8 + Math.random()*4);
                    p.maxLife = 0.5;
                    this.callbacks.vfxList.push(p);
                }
            }
            let baseDmg = BALANCE.PLAYER.WEAPONS.MOLTEN_BREATH.DMG + (this.damage - 1);
            const mbLevel = this.upgradeLevels['molten_breath'] || 1;
            baseDmg += (mbLevel - 1) * this._getInc('molten_breath');
            if (this.callbacks.enemies) {
                this.callbacks.enemies.forEach(e => {
                    const toEnemy = e.mesh.position.clone().sub(this.mesh.position);
                    const dist = toEnemy.length();
                    toEnemy.y = 0; toEnemy.normalize();
                    const forward = new THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion);
                    if (dist < range && forward.dot(toEnemy) > Math.cos(angle/2)) {
                        if (!e.invulnerable) {
                            let dmg = baseDmg;
                            if (this.hasSniper) {
                                dmg *= (1 + dist * this._getInc('sniper') * (this.upgradeLevels['sniper'] || 1));
                            }
                            e.takeDamage(dmg, 0xe67e22);
                            e.addEffect('burn', 3.0, { tick: 0 });
                            e.invulnerable = true;
                            setTimeout(()=>e.invulnerable=false, 200);
                        }
                    }
                });
            }

        } else if (this.weapon === 'icicle_spit') {
            const target = this.currentAimTarget;
            const dir = new this.THREE.Vector3().subVectors(target, this.mesh.position);
            dir.y = 0; dir.normalize();
            const startPos = this.mesh.position.clone().add(new this.THREE.Vector3(0, 0.5, 0));
            let dmg = BALANCE.PLAYER.WEAPONS.ICICLE_SPIT.DMG + (this.damage - 1);
            const isLevel = this.upgradeLevels['icicle_spit'] || 1;
            dmg += (isLevel - 1) * this._getInc('icicle_spit');
            if (this.callbacks.spawnProjectile) {
                const spd = BALANCE.PLAYER.WEAPONS.ICICLE_SPIT.SPEED;
                const projOptions = { critVsFrozen: this.hasShatter, sniperLevel: this.hasSniper ? (this.upgradeLevels['sniper'] || 1) : 0 };
                const p = this.callbacks.spawnProjectile(startPos, dir.multiplyScalar(spd), dmg, false, projOptions);
                p.onHit = (e) => { if(e.applyFreeze) e.applyFreeze(2.0); };
                if (p.mesh && p.mesh.material) p.mesh.material.color.setHex(0x3498db);
                if (this.hasEcho) {
                    const echoLevel = this.upgradeLevels['echo'] || 1;
                    const chance = 0.2 + (echoLevel - 1) * this._getInc('echo');
                    if (Math.random() < chance) {
                        const p2 = this.callbacks.spawnProjectile(startPos, dir.clone().applyAxisAngle(new THREE.Vector3(0,1,0), 0.2).multiplyScalar(spd), dmg, false, projOptions);
                        p2.onHit = p.onHit; 
                        if (p2.mesh && p2.mesh.material) p2.mesh.material.color.setHex(0x3498db);
                    }
                }
            }

        } else if (this.weapon === 'void_orb') {
            const target = this.currentAimTarget;
            const dir = new this.THREE.Vector3().subVectors(target, this.mesh.position);
            dir.y = 0; dir.normalize();
            const startPos = this.mesh.position.clone().add(new this.THREE.Vector3(0, 0.5, 0));
            let dmg = BALANCE.PLAYER.WEAPONS.VOID_ORB.DMG + (this.damage - 1);
            const voLevel = this.upgradeLevels['void_orb'] || 1;
            dmg += (voLevel - 1) * this._getInc('void_orb');
            if (this.callbacks.spawnProjectile) {
                const spd = BALANCE.PLAYER.WEAPONS.VOID_ORB.SPEED;
                const projOptions = { critVsFrozen: this.hasShatter, sniperLevel: this.hasSniper ? (this.upgradeLevels['sniper'] || 1) : 0 };
                const p = this.callbacks.spawnProjectile(startPos, dir.multiplyScalar(spd), dmg, true, projOptions);
                if (p.mesh) { 
                    if (p.mesh.geometry) p.mesh.geometry.dispose();
                    p.mesh.geometry = new this.THREE.SphereGeometry(0.5, 16, 16);
                    p.mesh.material.color.setHex(0x8e44ad);
                    p.mesh.material.emissive.setHex(0x4a148c);
                    p.mesh.material.emissiveIntensity = 0.8;
                    p.radius = 0.5;
                }
                if (this.hasEcho) {
                    const echoLevel = this.upgradeLevels['echo'] || 1;
                    const chance = 0.2 + (echoLevel - 1) * this._getInc('echo');
                    if (Math.random() < chance) {
                        const p2 = this.callbacks.spawnProjectile(startPos, dir.clone().applyAxisAngle(new THREE.Vector3(0,1,0), 0.3).multiplyScalar(spd), dmg, true, projOptions);
                        if (p2.mesh) {
                           if (p2.mesh.geometry) p2.mesh.geometry.dispose();
                           p2.mesh.geometry = new this.THREE.SphereGeometry(0.5, 16, 16);
                           p2.mesh.material.color.setHex(0x8e44ad);
                           p2.mesh.material.emissive.setHex(0x4a148c);
                           p2.mesh.material.emissiveIntensity = 0.8;
                           p2.radius = 0.5;
                        }
                    }
                }
            }

        } else if (this.weapon === 'bat') {
            const range = 3.0; 
            const angle = Math.PI; 
            const vfxTarget = this.currentAimTarget;
            if (vfxTarget && this.callbacks.vfxList) {
                this.callbacks.vfxList.push(new this.callbacks.AttackVFX(this.scene, this.mesh.position, vfxTarget, range, angle, 0xffffff));
            }

            let baseDmg = 5 + (this.damage - 1); 
            const batLevel = this.upgradeLevels['bat'] || 1;
            baseDmg += (batLevel - 1) * this._getInc('bat');
            const bonus = this.hasIronBeak ? ((this.upgradeLevels['iron_beak'] || 0) * this._getInc('iron_beak')) : 0; 
            const totalDmg = baseDmg + bonus;

            if (this.aspect === 'bat_stun') this.stunHitCounter++;

            if (this.callbacks.enemies) {
                this.callbacks.enemies.forEach(e => {
                    const distSq = Math.pow(this.mesh.position.x - e.mesh.position.x, 2) + 
                                   Math.pow(this.mesh.position.z - e.mesh.position.z, 2);
                    const hitRange = range + (e.config.hitRadius || 0.5);

                    if (distSq < hitRange * hitRange) {
                        const toEnemy = e.mesh.position.clone().sub(this.mesh.position);
                        toEnemy.y = 0; toEnemy.normalize();
                        const aimDir = new this.THREE.Vector3().subVectors(vfxTarget, this.mesh.position);
                        aimDir.y = 0; aimDir.normalize();

                        if (aimDir.dot(toEnemy) > 0) { 
                            if (!e.invulnerable) {
                                this.combo++; this.comboTimer = 2.0;
                                let hitDmg = totalDmg;
                                if (this.hasRhythmStrike && this.combo % 10 === 0) {
                                    const rsLevel = this.upgradeLevels['rhythm_strike'] || 1;
                                    hitDmg *= (3.0 + (rsLevel - 1) * this._getInc('rhythm_strike'));
                                }
                                if (this.hasGlassCannon) {
                                    const gcLevel = this.upgradeLevels['glass_cannon'] || 1;
                                    hitDmg *= (1.3 + (gcLevel - 1) * this._getInc('glass_cannon'));
                                }
                                if (this.hasShatter && e.hasEffect && e.hasEffect('freeze') && Math.random() < 0.5) hitDmg *= 2;

                                if (this.callbacks.applyHitStop) this.callbacks.applyHitStop(0.08); 
                                if (this.callbacks.applyShake) this.callbacks.applyShake(0.2, 0.1);
                                e.takeDamage(hitDmg, this);
                                if (this.aspect === 'bat_stun' && this.stunHitCounter % 4 === 0) e.applyStun(0.5); 
                                e.invulnerable = true; 
                                setTimeout(() => e.invulnerable = false, 300); 
                                const force = this.aspect === 'bat_knockback' ? 35.0 : 15.0; 
                                e.velocity.add(toEnemy.clone().multiplyScalar(force));
                                e.mesh.position.y += 0.5; 
                            }
                        }
                    }
                });
            }
        } else {
            const range = this.aspect === 'knife_machete' ? 3.0 : 2.0;
            const angle = 0.52; 
            const vfxTarget = this.currentAimTarget;
            if (vfxTarget && this.callbacks.vfxList) {
                this.callbacks.vfxList.push(new this.callbacks.AttackVFX(this.scene, this.mesh.position, vfxTarget, range, angle, 0xffffff));
            }

            let baseDmg = (this.weapon === 'knife' ? 3 : 2) + (this.damage - 1);
            const wId = this.weapon === 'knife' ? 'knife' : 'peck';
            const wLevel = this.upgradeLevels[wId] || 1;
            if (wId === 'knife') baseDmg += (wLevel - 1) * this._getInc('knife'); 

            if (this.hasIronBeak) baseDmg += (this.upgradeLevels['iron_beak'] || 0) * this._getInc('iron_beak');
            
            if (this.callbacks.enemies) {
                this.callbacks.enemies.forEach(e => {
                    let totalDmg = baseDmg;
                    if (this.aspect === 'peck_behemoth') totalDmg *= 5; 
                    if (this.aspect === 'knife_machete' && Math.random() < 0.35) totalDmg *= 3; 

                    const dx = this.mesh.position.x - e.mesh.position.x;
                    const dz = this.mesh.position.z - e.mesh.position.z;
                    const distSq = dx*dx + dz*dz;
                    const hitRange = range + (e.config.hitRadius || 0.5);

                    if (distSq < hitRange * hitRange) {
                         const toEnemy = e.mesh.position.clone().sub(this.mesh.position);
                         toEnemy.y = 0; toEnemy.normalize();
                         const aimDir = new this.THREE.Vector3().subVectors(vfxTarget, this.mesh.position);
                         aimDir.y = 0; aimDir.normalize();

                         if (aimDir.dot(toEnemy) > 0.96) {
                            if (!e.invulnerable) {
                                this.combo++; this.comboTimer = 2.0;
                                let hitDmg = totalDmg;
                                if (this.hasRhythmStrike && this.combo % 10 === 0) {
                                    const rsLevel = this.upgradeLevels['rhythm_strike'] || 1;
                                    hitDmg *= (3.0 + (rsLevel - 1) * this._getInc('rhythm_strike'));
                                }
                                if (this.hasGlassCannon) {
                                    const gcLevel = this.upgradeLevels['glass_cannon'] || 1;
                                    hitDmg *= (1.3 + (gcLevel - 1) * this._getInc('glass_cannon'));
                                }
                                if (this.hasShatter && e.hasEffect && e.hasEffect('freeze') && Math.random() < 0.5) hitDmg *= 2;

                                if (this.callbacks.applyHitStop) this.callbacks.applyHitStop(0.05);
                                if (this.callbacks.applyShake) this.callbacks.applyShake(0.1, 0.1);
                                e.takeDamage(hitDmg, (this.aspect === 'knife_machete' && totalDmg > baseDmg) ? 0xff0000 : 0xffffff);
                                
                                let bleedDmg = 1.0;
                                const kLevel = this.upgradeLevels['knife'] || 1;
                                if (this.weapon === 'knife') bleedDmg = 1.0 + (kLevel - 1) * this._getInc('knife'); 

                                if (this.weapon === 'knife') e.applyBleed(3.0, 0x880000, bleedDmg); 
                                if (this.aspect === 'knife_kukri') e.applyBleed(6.0, 0x00ff00, bleedDmg); 
                                
                                const bleedEff = e.getEffect ? e.getEffect('bleed') : null;
                                if (this.hasExsanguinate && bleedEff) {
                                    const popDmg = bleedEff.duration * 2.0; // Scaled damage based on remaining duration
                                    e.takeDamage(popDmg, 0xaa0000);
                                    // Remove the bleed effect manually
                                    e.activeEffects = e.activeEffects.filter(eff => eff !== bleedEff);
                                    if (e._onEffectEnd) e._onEffectEnd('bleed');
                                }
                                e.invulnerable = true;  
                                setTimeout(() => e.invulnerable = false, 300);
                                e.velocity.add(toEnemy.clone().multiplyScalar(8.0));
                                e.mesh.position.y += 0.3; 
                            }
                         }
                    }
                });
            }
        }
        
        if (this.aspect === 'peck_frenzy') this.attackDuration = 0.08;
        else this.attackDuration = 0.15;

        if (this.currentAimTarget && this.callbacks.cutGrassAt) {
            const cutRange = this.weapon === 'bat' ? 3.0 : 2.0;
            const aimDir = new this.THREE.Vector3().subVectors(this.currentAimTarget, this.mesh.position).normalize();
            this.callbacks.cutGrassAt(this.mesh.position, cutRange, aimDir, 0.96);
        }
    }

    dash(inputDir = null, mousePos = null) {
        if (this.isDashing || this.dashCooldown > 0) return;
        
        if (this.dashMod === 'blink') {
            if (this.callbacks.playSound) this.callbacks.playSound('dash');
            
            const startPos = this.mesh.position.clone();
            let targetPos = startPos.clone();
            const bLevel = this.upgradeLevels['blink'] || 1;
            const range = 8.0 + (bLevel - 1) * this._getInc('blink'); 

            // Priority 1: Input Direction (WASD) - Preserves Kiting
            if (inputDir && inputDir.length() > 0.1) {
                targetPos.add(inputDir.clone().normalize().multiplyScalar(range));
            } 
            // Priority 2: Mouse/Aim Position - Precision Teleport when stationary
            else if (mousePos) {
                 const dist = startPos.distanceTo(mousePos);
                 // Only use mouse if it's reasonably far (not self-click)
                 if (dist > 1.0) {
                     const dir = new this.THREE.Vector3().subVectors(mousePos, startPos).normalize();
                     const blinkDist = Math.min(dist, range); // Allow shorter blinks if mouse is close
                     targetPos.add(dir.multiplyScalar(blinkDist));
                 } else {
                     // Fallback: Forward
                     const forward = new this.THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();
                     targetPos.add(forward.multiplyScalar(range));
                 }
            }
            // Priority 3: Facing Direction
            else {
                const forward = new this.THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();
                targetPos.add(forward.multiplyScalar(range));
            }
            
            const limit = CONFIG.WORLD_SIZE / 2 - 0.5;
            targetPos.x = Math.max(-limit, Math.min(limit, targetPos.x));
            targetPos.z = Math.max(-limit, Math.min(limit, targetPos.z));

            // Visual Trail (Particles along the path)
            if (this.callbacks.vfxList) { 
                const steps = 8;
                for(let i=0; i<=steps; i++) {
                    const t = i/steps;
                    const pPos = new this.THREE.Vector3().lerpVectors(startPos, targetPos, t);
                    pPos.y = 0.5;
                    this.callbacks.vfxList.push(new this.callbacks.Particle(this.scene, pPos, 0x9b59b6));
                }
            }
            
            this.mesh.position.copy(targetPos);
            this.dashCooldown = this.dashCooldownMax;
            return;
        }

        this.isDashing = true;
        this.dashTime = 0;
        this.dashHitList = [];
        if (this.callbacks.playSound) this.callbacks.playSound('dash');
        
        let power = BALANCE.PLAYER.DASH.POWER;
        if (this.hasSwiftFeathers) {
            const sfLevel = this.upgradeLevels['swift_feathers'] || 1;
            power *= (1.3 + (sfLevel - 1) * this._getInc('swift_feathers'));
        }
        
        let cd = this.dashCooldownMax;
        if (this.dashMod === 'momentum_dash') {
            const level = this.upgradeLevels['momentum_dash'] || 1;
            const stacks = Math.floor(this.combo / 10);
            cd = Math.max(0.5, cd - stacks * this._getInc('momentum_dash') * level);
        }
        this.dashCooldown = cd;
        
        let dashDir;
        if (inputDir && inputDir.length() > 0.1) {
            dashDir = inputDir.clone().normalize();
        } else {
            dashDir = new this.THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();
        }
        this.dashVelocity = dashDir.multiplyScalar(power); 
        
        if (this.dashMod === 'dash_ice' && this.callbacks.enemies) {
            const diLevel = this.upgradeLevels['dash_ice'] || 1;
            const diDur = 3.0 + (diLevel - 1) * this._getInc('dash_ice');
            this.callbacks.enemies.forEach(e => {
                 const distSq = this.mesh.position.distanceToSquared(e.mesh.position);
                 if (distSq < 16.0) e.applyFreeze(diDur);
            });
            if (this.callbacks.vfxList) {
                this.callbacks.vfxList.push(new this.callbacks.AttackVFX(this.scene, this.mesh.position, this.mesh.position.clone().add(new THREE.Vector3(0,0,1)), 4.0, Math.PI*2, 0x00ffff));
            }
        }
    }

    releaseGrimoire() {
        this.isCharging = false;
        this.chargeTime = 0;
        this.mesh.scale.setScalar(1.0);
        if (this.chargeRing) this.chargeRing.visible = false;
        this.attackCooldown = 0.8; 
        if (this.callbacks.playSound) this.callbacks.playSound('honk');

        let dmg = BALANCE.PLAYER.WEAPONS.GRIMOIRE.DMG;
        const gLevel = this.upgradeLevels['grimoire'] || 1;
        dmg += (gLevel - 1) * this._getInc('grimoire');
        
        if (this.aspect === 'grimoire_power') {
            const powerLevel = this.upgradeLevels['grimoire_power'] || 1;
            dmg *= (1.5 + (powerLevel - 1) * this._getInc('grimoire_power'));
        }

        const target = this.currentAimTarget;
        const dir = new this.THREE.Vector3().subVectors(target, this.mesh.position);
        dir.y = 0; dir.normalize();
        
        const startPos = this.mesh.position.clone().add(new this.THREE.Vector3(0, 0.8, 0));
        if (this.callbacks.spawnProjectile) {
            const projOptions = { critVsFrozen: this.hasShatter, sniperLevel: this.hasSniper ? (this.upgradeLevels['sniper'] || 1) : 0 };
            const p = this.callbacks.spawnProjectile(startPos, dir.multiplyScalar(15), dmg, false, projOptions);
            if (p) {
                if(p.mesh.geometry) p.mesh.geometry.dispose();
                p.mesh.geometry = new this.THREE.SphereGeometry(0.4, 16, 16); 
                p.mesh.material.color.setHex(0x8e44ad);
                p.mesh.material.emissive.setHex(0x8e44ad);
                p.mesh.material.emissiveIntensity = 1.0;
                p.isMagic = true; 
                p.radius = 0.4;
            }
        }

        if (this.callbacks.applyShake) this.callbacks.applyShake(0.2, 0.15);
    }

    takeDamage(amount, source = null) {
        if (this.invulnerable || this.hp <= 0) return;
        
        if (this.hasIceArmor) {
            const iaLevel = this.upgradeLevels['ice_armor'] || 1;
            const reduction = 0.85 - (iaLevel - 1) * 0.05;
            amount *= Math.max(0.5, reduction);
            if (source && source.applyFreeze) source.applyFreeze(2.0);
        }
        
        if (this.hasGlassCannon) this.combo = -10;

        this.hp -= amount;
        this.invulnerable = true;
        if (this.callbacks.playSound) this.callbacks.playSound('hit');
        this.updateUI();

        this.body.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (this.body && this.body.material) this.body.material.color.setHex(0xffffff);
            this.invulnerable = false;
        }, 1000);

        if (this.hp <= 0 && this.callbacks.onGameOver) {
            this.callbacks.onGameOver();
        }
    }

    updateCooldowns(dt) {
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        if (this.cooldownRing) {
            if (this.attackCooldown > 0) {
                this.cooldownRing.visible = true;
                this.cooldownRing.position.copy(this.mesh.position);
                this.cooldownRing.position.y = 0.04;
                
                // Radial fill logic (Sectoral Timer)
                const pct = Math.max(0, Math.min(1, this.attackCooldown / this.attackCooldownMax));
                
                if (this.cooldownRing.geometry) this.cooldownRing.geometry.dispose();
                
                // Create a ring sector representing remaining time
                // ThetaStart at PI/2 (Top), Length proportional to cooldown
                this.cooldownRing.geometry = new this.THREE.RingGeometry(
                    0.5, 0.6, 32, 1, 
                    Math.PI / 2, 
                    2 * Math.PI * pct
                );
                
                // Ensure orientation is correct (Geometry is XY plane, Mesh is rotated X -90 in init)
                this.cooldownRing.rotation.x = -Math.PI / 2;
                this.cooldownRing.rotation.z = 0; // No spinning
                this.cooldownRing.scale.setScalar(1); // No scaling

            } else {
                this.cooldownRing.visible = false;
            }
        }

        const btnAtk = document.getElementById('btnAttack');
        const btnDsh = document.getElementById('btnDash');
        const cdAtk = document.getElementById('cdAttack');
        const cdDsh = document.getElementById('cdDash');
        const timerAtk = document.getElementById('timerAttack');
        const timerDsh = document.getElementById('timerDash');

        if (btnAtk && cdAtk && timerAtk) {
            const atkPct = this.attackCooldown > 0 ? (this.attackCooldown / this.attackCooldownMax) : 0;
            if (this.attackCooldown > 0) {
                btnAtk.style.opacity = 0.5;
                btnAtk.style.filter = `grayscale(100%)`;
                cdAtk.style.background = `conic-gradient(rgba(0,0,0,0.6) ${atkPct * 100}%, transparent 0%)`;
                timerAtk.style.display = 'block';
                timerAtk.innerText = this.attackCooldown.toFixed(1);
            } else {
                btnAtk.style.opacity = 1.0;
                btnAtk.style.filter = 'none';
                cdAtk.style.background = 'transparent';
                timerAtk.style.display = 'none';
            }
        }

        if (btnDsh && cdDsh && timerDsh) {
            const dshPct = this.dashCooldown > 0 ? (this.dashCooldown / this.dashCooldownMax) : 0;
            if (this.dashCooldown > 0) {
                btnDsh.style.opacity = 0.5;
                btnDsh.style.filter = `grayscale(100%)`;
                cdDsh.style.background = `conic-gradient(rgba(0,0,0,0.6) ${dshPct * 100}%, transparent 0%)`;
                timerDsh.style.display = 'block';
                timerDsh.innerText = this.dashCooldown.toFixed(1);
            } else {
                btnDsh.style.opacity = 1.0;
                btnDsh.style.filter = 'none';
                cdDsh.style.background = 'transparent';
                timerDsh.style.display = 'none';
            }
        }
    }

    updateGrimoire(dt, isAttackPressed) {
        if (this.weapon !== 'grimoire' || this.attackCooldown > 0) return;
        let chargeBonus = 0;
        if (this.aspect === 'grimoire_speed') {
            const level = this.upgradeLevels['grimoire_speed'] || 1;
            chargeBonus = level * this._getInc('grimoire_speed');
        }
        const chargeLimit = Math.max(0.2, BALANCE.PLAYER.WEAPONS.GRIMOIRE.CHARGE_TIME - chargeBonus);
        
        if (isAttackPressed || this.isAutoAttacking) {
            this.isCharging = true;
            this.chargeTime += dt;
            const progress = Math.min(this.chargeTime / chargeLimit, 1);
            this.mesh.scale.setScalar(1.0 + progress * 0.3);

            if (this.chargeRing) {
                this.chargeRing.visible = true;
                this.chargeRing.scale.setScalar(progress);
                this.chargeRing.rotation.z += dt * 10.0;
                this.chargeRing.material.color.lerpColors(new this.THREE.Color(0x8e44ad), new this.THREE.Color(0xffffff), progress);
            }
            if (this.chargeTime >= chargeLimit) this.releaseGrimoire();
        } else if (this.isCharging) {
            if (this.chargeTime / chargeLimit > 0.9) this.releaseGrimoire();
            else {
                this.isCharging = false;
                this.chargeTime = 0;
                this.mesh.scale.setScalar(1.0);
                if (this.chargeRing) {
                    this.chargeRing.visible = false;
                    this.chargeRing.material.color.setHex(0x8e44ad);
                }
            }
        }
    }

    updateAiming(dt, inputVector) {
        let nearest = null;
        let minDist = 15;
        if (this.callbacks.enemies) {
            this.callbacks.enemies.forEach(e => {
                const distSq = this.mesh.position.distanceToSquared(e.mesh.position);
                if (distSq < minDist * minDist) {
                    minDist = Math.sqrt(distSq);
                    nearest = e;
                }
            });
        }

        if (nearest) {
            this.currentAimTarget = nearest.mesh.position.clone();
            if (this.targetMarker) {
                this.targetMarker.visible = true;
                this.targetMarker.position.copy(nearest.mesh.position);
                this.targetMarker.position.y = 0.05;
                const targetScale = (nearest.config.hitRadius || 1.0) * 1.5;
                this.targetMarker.scale.setScalar(targetScale + Math.sin(Date.now() * 0.01) * 0.1);
                this.targetMarker.rotation.z += dt * 2.0;
            }
            // Auto-attack trigger with dynamic range
            let aaRange = 2.5; 
            if (this.weapon === 'bat') aaRange = 3.5;
            else if (this.weapon === 'shuriken') aaRange = 8.0;
            else if (this.weapon === 'molten_breath') aaRange = 5.0;
            else if (this.weapon === 'icicle_spit') aaRange = 7.0;
            else if (this.weapon === 'void_orb') aaRange = 6.0;
            else if (this.weapon === 'grimoire') aaRange = 6.0;

            this.isAutoAttacking = false;

            if (minDist < aaRange && this.attackCooldown <= 0 && !this.isAttacking && !this.isDashing) {
                if (this.weapon === 'grimoire') {
                    this.isAutoAttacking = true;
                } else {
                    this.attack();
                }
            }
        } else {
            if (inputVector.length() > 0.1) this.currentAimTarget = this.mesh.position.clone().add(inputVector);
            else {
                const forward = new this.THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
                this.currentAimTarget = this.mesh.position.clone().add(forward);
            }
            if (this.targetMarker) this.targetMarker.visible = false;
        }

        if (this.currentAimTarget) {
            const target = this.currentAimTarget.clone();
            target.y = this.mesh.position.y;
            if (target.distanceToSquared(this.mesh.position) > 0.01) this.mesh.lookAt(target);
        }
    }

    updateAimGuide() {
        if (!this.aimGuide) return;
        this.aimGuide.position.copy(this.mesh.position);
        this.aimGuide.position.y = 0.05;

        const range = (this.weapon === 'bat' || this.aspect === 'knife_machete') ? 3.0 : 2.0;
        const angle = (this.weapon === 'bat') ? Math.PI : 0.52;
        
        if (!this.aimGuide.userData.currentAngle || this.aimGuide.userData.currentAngle !== angle) {
            this.aimGuide.geometry.dispose();
            this.aimGuide.geometry = new this.THREE.RingGeometry(0.2, 2.0, 32, 1, -angle / 2, angle);
            this.aimGuide.geometry.rotateX(-Math.PI / 2);
            this.aimGuide.geometry.rotateY(-Math.PI / 2);
            this.aimGuide.userData.currentAngle = angle;
        }

        this.aimGuide.scale.setScalar(range / 2.0);
        if (this.currentAimTarget) {
            this.aimGuide.lookAt(this.currentAimTarget.x, this.aimGuide.position.y, this.currentAimTarget.z);
        }
        this.aimGuide.visible = (this.weapon !== 'shuriken' && this.weapon !== 'grimoire');
    }

    updateMovement(dt, inputVector) {
        if (inputVector.length() > 0.1 && !this.isDashing) {
            const force = inputVector.clone().normalize().multiplyScalar(this.speed * dt);
            force.y = 0;
            this.velocity.add(force);
        }

        if (this.isDashing) {
            this.dashTime += dt;
            this.velocity.copy(this.dashVelocity);
            this.velocity.y = 0;
            
            if (this.callbacks.enemies) {
                this.callbacks.enemies.forEach(e => {
                    const distSq = this.mesh.position.distanceToSquared(e.mesh.position);
                    const range = 1.5 + (e.config.hitRadius || 0);
                    if (distSq < range * range && !this.dashHitList.includes(e)) {
                        if (this.dashMod === 'dash_pierce' || !this.dashMod || this.dashMod === 'dash_ice' || this.dashMod === 'razor_wind') {
                            const dpLevel = this.upgradeLevels['dash_pierce'] || 1;
                            const dpDmg = 1 + (dpLevel - 1) * this._getInc('dash_pierce');
                            e.takeDamage(dpDmg);
                            this.dashHitList.push(e);
                                                            if (this.dashMod === 'razor_wind') {
                                                                const rwLevel = this.upgradeLevels['razor_wind'] || 1;
                                                                const rwBleed = 0.5 + (rwLevel - 1) * this._getInc('razor_wind');
                                                                e.applyBleed(3.0, 0x880000, rwBleed);
                                                            }                        }
                    }
                });
            }

            if (this.dashMod === 'dash_fire' && Math.floor(this.dashTime * 100) % 5 === 0) {
                const dfLevel = this.upgradeLevels['dash_fire'] || 1;
                const dfDmg = 0.5 + (dfLevel - 1) * this._getInc('dash_fire');
                if (this.callbacks.spawnFireZone) this.callbacks.spawnFireZone(this.mesh.position.clone(), dfDmg);
            }
            if (this.dashMod === 'glacial_path' && Math.floor(this.dashTime * 100) % 5 === 0) {
                if (this.callbacks.spawnGroundEffect) {
                    const gpLevel = this.upgradeLevels['glacial_path'] || 1;
                    const gpDur = 4.0 + (gpLevel - 1) * this._getInc('glacial_path');
                    this.callbacks.spawnGroundEffect(this.mesh.position.clone(), {
                        type: 'ice', duration: gpDur, radius: 1.5, damage: 0.5, tickRate: 0.5, color: 0x00ffff, applyStatus: 'freeze'
                    });
                }
            }
            
            this.dashVelocity.multiplyScalar(Math.exp(-3.0 * dt));
            
            if (this.dashTime >= this.dashDuration) {
                this.isDashing = false;
                this.velocity.multiplyScalar(0.5); 

                if (this.dashMod === 'dash_angry' && this.callbacks.enemies) {
                    const daLevel = this.upgradeLevels['dash_angry'] || 1;
                    const daDmg = 2 + (daLevel - 1) * this._getInc('dash_angry');
                    this.callbacks.enemies.forEach(e => {
                        const distSq = this.mesh.position.distanceToSquared(e.mesh.position);
                        const angryRange = 3.5 + (e.config.hitRadius || 0);
                        if (distSq < angryRange * angryRange) {
                            e.takeDamage(daDmg, 0xe74c3c);
                            e.applyStun(2.0);
                        }
                    });
                    if (this.callbacks.vfxList) {
                        this.callbacks.vfxList.push(new this.callbacks.AttackVFX(this.scene, this.mesh.position, this.mesh.position.clone().add(new THREE.Vector3(0,0,1)), 3.5, Math.PI*2, 0xe74c3c));
                    }
                    if (this.callbacks.applyShake) this.callbacks.applyShake(0.3, 0.2);
                }
            }
        } else {
            this.velocity.multiplyScalar(Math.exp(-this.friction * dt));
        }

        this.velocity.y = 0;
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));

        const limit = CONFIG.WORLD_SIZE / 2 - 0.5;
        this.mesh.position.x = Math.max(-limit, Math.min(limit, this.mesh.position.x));
        this.mesh.position.z = Math.max(-limit, Math.min(limit, this.mesh.position.z));
    }

    updateAnimations(dt, elapsedTime) {
        if (this.isAttacking) {
            this.attackTime += dt;
            const progress = Math.min(this.attackTime / this.attackDuration, 1);
            
            if (this.weapon === 'bat') {
                const swingProgress = Math.sin(progress * Math.PI); 
                let angle = 0;
                if (progress < 0.2) angle = progress * 5; 
                else if (progress < 0.6) angle = 1.0 - (progress - 0.2) * 5; 
                else angle = -1.0 + (progress - 0.6) * 2.5; 
                this.mesh.rotation.y += angle * 0.2; 
                this.visBat.rotation.z = -0.5 + swingProgress * 2.0; 
                if (progress >= 1) { this.visBat.rotation.z = -0.5; this.isAttacking = false; }
            } else if (this.weapon === 'shuriken') {
                const snap = Math.sin(progress * Math.PI * 2); 
                this.headGroup.rotation.x = snap * 0.5; 
                if (progress >= 1) { this.headGroup.rotation.x = 0; this.isAttacking = false; }
            } else if (this.weapon === 'knife') {
                const stab = Math.sin(progress * Math.PI); 
                this.headGroup.position.z = 0.3 + stab * 1.2; 
                this.headGroup.rotation.z = stab * -0.5; 
                if (progress >= 1) { this.headGroup.position.z = 0.3; this.headGroup.rotation.z = 0; this.isAttacking = false; }
            } else {
                const peck = Math.sin(progress * Math.PI); 
                this.headGroup.position.z = 0.3 + peck * 0.5;
                this.headGroup.scale.setScalar(1.0 + peck * 0.3); 
                if (progress >= 1) { this.headGroup.position.z = 0.3; this.headGroup.scale.setScalar(1.0); this.isAttacking = false; }
            }
        }

        const speed = this.velocity.length();
        if (this.haloGroup && this.haloGroup.visible) this.haloGroup.rotation.y += dt * 5.0; 

        if (speed > 0.5 && !this.isDashing) {
            this.body.rotation.z = Math.sin(elapsedTime * 15.0) * 0.15;
            this.body.position.y = 0.5 + Math.abs(Math.sin(elapsedTime * 15.0)) * 0.1;
            this.legL.rotation.x = Math.sin(elapsedTime * 20) * 0.5;
            this.legR.rotation.x = Math.cos(elapsedTime * 20) * 0.5;
        } else {
            this.body.rotation.z = this.THREE.MathUtils.lerp(this.body.rotation.z, 0, dt * 10);
            this.body.scale.y = 1.0 + Math.sin(elapsedTime * 2) * 0.05;
            this.body.position.y = 0.5;
            this.legL.rotation.x = 0;
            this.legR.rotation.x = 0;
        }
    }

    update(dt, elapsedTime, inputVector, isAttackPressed) {
        this.frameCount++;
        if (this.frameCount % 10 === 0) this.updateUI();

        // Stat Recalculation
        const baseSpeed = BALANCE.PLAYER.BASE_SPEED * this.permanentSpeedMul;
        let currentSpeed = baseSpeed;
        
        this.isSpeedBoosted = false; // Reset temporary boost flag

        if (this.hasBloodScent && this.callbacks.enemies) {
            let bCount = 0;
            this.callbacks.enemies.forEach(e => {
                if (e.bleedTime > 0 && this.mesh.position.distanceToSquared(e.mesh.position) < 100) bCount++;
            });
            if (bCount > 0) {
                const level = this.upgradeLevels['blood_scent'] || 1;
                currentSpeed *= (1 + bCount * this._getInc('blood_scent') * level);
                this.isSpeedBoosted = true;
            }
        }
        // Aspect modifiers
        if (this.aspect === 'knife_kukri') currentSpeed *= 0.85; 

        this.speed = currentSpeed;

        if (this.combo > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        this.updateCooldowns(dt);
        this.updateGrimoire(dt, isAttackPressed);
        this.updateAiming(dt, inputVector);
        
        // Auto-Fire: Allow holding the attack button for continuous fire
        if (isAttackPressed && this.weapon !== 'grimoire' && this.attackCooldown <= 0 && !this.isDashing && !this.isAttacking) {
            this.attack();
        }

        this.updateAimGuide();
        this.updateMovement(dt, inputVector);
        this.updateAnimations(dt, elapsedTime);
    }
}
