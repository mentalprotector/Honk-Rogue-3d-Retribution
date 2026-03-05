import * as THREE from 'three';

export class InputHandler3D {
    constructor(callbacks = {}) {
        this.THREE = THREE;
        this.callbacks = callbacks; // { onSetGameState, onCycleZoom, onPlayerAttack, onPlayerDash }
        this.keys = {};
        this.activeKeys = []; 
        this.joystick = { id: null, startX: 0, startY: 0, currX: 0, currY: 0 };
        this.mouse = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3(0, 0, 1); 
        this.raycaster = new THREE.Raycaster();
        this.aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5); 
        // Broaden mobile detection to include small screens
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 900;
        this.isAttackPressed = false; 
        
        this._vector = new THREE.Vector3(); // Persistent vector for movement
        this._upVector = new THREE.Vector3(0, 1, 0); // Persistent up vector

        this._initListeners();
        
        // Always show controls for cooldown visibility
        this.showControls();
    }

    showControls() {
        const controls = document.getElementById('controls');
        if (controls) controls.style.display = 'flex';
    }

    _initListeners() {
        window.addEventListener('keydown', (e) => {
            let code = e.code;
            const key = e.key.toLowerCase();
            if (key === 'ц') code = 'KeyW';
            if (key === 'ы') code = 'KeyS';
            if (key === 'ф') code = 'KeyA';
            if (key === 'в') code = 'KeyD';
            
            this.keys[code] = true;
            if (!this.activeKeys.includes(code)) {
                this.activeKeys.push(code);
            }
            if (code === 'Space' || code === 'Enter') this.isAttackPressed = true;

            if (code === 'ShiftLeft' || code === 'ShiftRight') {
                if (this.callbacks.onPlayerDash) {
                    // Use getVector to get current movement direction for dash, pass mouseWorld for aiming
                    this.callbacks.onPlayerDash(this.getVector(), this.mouseWorld.clone());
                }
            }

            if (code === 'Escape') {
                if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
            }
            
            if (code === 'KeyZ') {
                if (this.callbacks.onCycleZoom) this.callbacks.onCycleZoom();
            }
        });

        window.addEventListener('keyup', (e) => {
            let code = e.code;
            const key = e.key.toLowerCase();
            if (key === 'ц') code = 'KeyW';
            if (key === 'ы') code = 'KeyS';
            if (key === 'ф') code = 'KeyA';
            if (key === 'в') code = 'KeyD';

            this.keys[code] = false;
            this.activeKeys = this.activeKeys.filter(k => k !== code);
            if (code === 'Space' || code === 'Enter') this.isAttackPressed = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.isAttackPressed = true;
                if (this.callbacks.onPlayerAttack) this.callbacks.onPlayerAttack();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isAttackPressed = false;
            }
        });
        
        window.addEventListener('blur', () => {
            this.keys = {};
            this.activeKeys = [];
            this.joystick.id = null;
            this.isAttackPressed = false;
        });

        const isJoystickTouch = (t) => t.clientX < window.innerWidth / 2;

        window.addEventListener('touchstart', (e) => {
            this.showControls(); // Ensure controls are shown on touch

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (isJoystickTouch(t) && this.joystick.id === null) {
                    this.joystick.id = t.identifier;
                    this.joystick.startX = t.clientX;
                    this.joystick.startY = t.clientY;
                    this.joystick.currX = t.clientX;
                    this.joystick.currY = t.clientY;
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === this.joystick.id) {
                    this.joystick.currX = t.clientX;
                    this.joystick.currY = t.clientY;
                }
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.id) {
                    this.joystick.id = null;
                }
            }
        });
    }

    setupMobileButtons() {
        const setupBtn = (id, action) => {
            const btn = document.getElementById(id);
            if(!btn) return;
            const down = (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                if (id === 'btnAttack') this.isAttackPressed = true;
                else if (id === 'btnDash') {
                    if (this.callbacks.onPlayerDash) {
                        this.callbacks.onPlayerDash(this.getVector(), this.mouseWorld.clone());
                    }
                }
                else if (action) action();
                btn.style.transform = 'scale(0.9)';
            };
            const up = (e) => {
                if (id === 'btnAttack') {
                    this.isAttackPressed = false;
                    if (action) action(); 
                }
                btn.style.transform = 'scale(1)';
            };
            btn.addEventListener('touchstart', down, { passive: false });
            btn.addEventListener('touchend', up, { passive: false });
            btn.addEventListener('mousedown', down);
            btn.addEventListener('mouseup', up);
        };

        setupBtn('btnAttack', () => { if (this.callbacks.onPlayerAttack) this.callbacks.onPlayerAttack(); });
        setupBtn('btnDash', null); 
    }

    updateMouse(e, camera) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, camera);
        this.raycaster.ray.intersectPlane(this.aimPlane, this.mouseWorld);
    }

    getVector() {
        this._vector.set(0, 0, 0);
        
        if (this.joystick.id !== null) {
            this._vector.x = this.joystick.currX - this.joystick.startX;
            this._vector.z = this.joystick.currY - this.joystick.startY;
        } else {
            if (this.keys['KeyW'] || this.keys['ArrowUp']) this._vector.z -= 1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) this._vector.z += 1;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) this._vector.x -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) this._vector.x += 1;
        }
        
                if (this._vector.length() > 0.1) {
                    this._vector.normalize();
                    // Rotate 45 degrees counter-clockwise to align with isometric view
                    this._vector.applyAxisAngle(this._upVector, Math.PI / 4);
                }
        
                return this._vector;
            }
        }
