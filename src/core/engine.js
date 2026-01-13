import * as THREE from 'three';

export class Engine {
    constructor() {
        this.THREE = THREE;
        this.scene = new THREE.Scene();
        this.ZOOM_LEVELS = [13.5, 27.0]; // Close (+), Far (-)
        this.currentZoomIndex = 0;

        this._initCamera();
        this._initRenderer();
        this._initLights();
    }

    _initCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        const initialFSize = this.ZOOM_LEVELS[this.currentZoomIndex];
        this.camera = new this.THREE.OrthographicCamera(
            initialFSize * aspect / -2, 
            initialFSize * aspect / 2, 
            initialFSize / 2, 
            initialFSize / -2, 
            1, 
            1000
        );
        this.camera.position.set(20, 20, 20); 
        this.camera.lookAt(0, 0, 0);
    }

    _initRenderer() {
        this.renderer = new this.THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    _initLights() {
        const ambientLight = new this.THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.dirLight = new this.THREE.DirectionalLight(0xffffff, 0.8);
        this.dirLight.position.set(10, 20, 5);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 50;
        this.dirLight.shadow.camera.left = -15;
        this.dirLight.shadow.camera.right = 15;
        this.dirLight.shadow.camera.top = 15;
        this.dirLight.shadow.camera.bottom = -15;
        this.scene.add(this.dirLight);
    }

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        const fSize = this.ZOOM_LEVELS[this.currentZoomIndex];
        this.camera.left = -fSize * aspect / 2;
        this.camera.right = fSize * aspect / 2;
        this.camera.top = fSize / 2;
        this.camera.bottom = -fSize / 2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    cycleZoom() {
        this.currentZoomIndex = (this.currentZoomIndex + 1) % this.ZOOM_LEVELS.length;
        this.onWindowResize();
        return this.currentZoomIndex;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
