import MaterialsData from '@/MaterialsData';
import { THREE } from '@/three';
import { MaterialByColor } from './MaterialByColor';
import { generateSkybox } from './Skybox';

export function getRenderMaterial(material: string) {
    const mat = new MaterialByColor();
    if (material === '0x3') {
        mat.material.opacity = MaterialsData['0x3'].material.opacity;
        mat.material.transparent = true;
        mat.material.side = THREE.DoubleSide;
    } else if (material === '0x4') {
        mat.material.metalness = MaterialsData['0x4'].material.metalness;
        mat.material.roughness = MaterialsData['0x4'].material.roughness;
        mat.material.envMap = generateSkybox();
    } else if (material === '0x5') {
        mat.material.color = new THREE.Color(0x444444);
        mat.material.emissive = new THREE.Color(0xffffff);
        mat.material.emissiveIntensity = MaterialsData['0x5'].material.emissiveIntensity;
    }
    return mat;
}
