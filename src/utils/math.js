import * as THREE from 'three';

/**
 * Creates a flat arc mesh for visualizations (Aiming Guide, Attack VFX)
 */
export function createArcMesh(range, angle, color, opacity = 0.6) {
    // 1. Geometry: Centered on +X, but we immediately rotate it to point Forward (+Z)
    const geo = new THREE.RingGeometry(0.2, range, 32, 1, -angle / 2, angle);
    geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane
    geo.rotateY(-Math.PI / 2);  // Point center of arc towards +Z (Forward)
    
    const mat = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: opacity, 
        side: THREE.DoubleSide,
        depthTest: false // ALWAYS ON TOP
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 999; 
    return mesh;
}
