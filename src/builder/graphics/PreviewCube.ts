import { THREE } from '@/three';

let previewCube: THREE.Mesh;
function generatePreviewCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x002496, opacity: 0.5, transparent: true });
    const planeXZ = new THREE.Mesh(geometry, material);
    planeXZ.position.set(0, 0, 0);
    planeXZ.visible = false;
    // Increase render order to sort out transparecy issues.
    planeXZ.renderOrder = 1;
    previewCube = planeXZ;
}
//generatePreviewCube();

export default function getPreviewCube(): THREE.Mesh {
    if (!previewCube)
        generatePreviewCube();
    return previewCube;
}
