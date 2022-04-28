import { THREE } from '@/three';

import daylight_Back from '@/assets/skybox/Daylight-Box_Back.jpg';
import daylight_Bottom from '@/assets/skybox/Daylight-Box_Bottom.jpg';
import daylight_Front from '@/assets/skybox/Daylight-Box_Front.jpg';
import daylight_Left from '@/assets/skybox/Daylight-Box_Left.jpg';
import daylight_Right from '@/assets/skybox/Daylight-Box_Right.jpg';
import daylight_Top from '@/assets/skybox/Daylight-Box_Top.jpg';

export function generateSkybox() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        daylight_Right,
        daylight_Left,
        daylight_Top,
        daylight_Bottom,
        daylight_Front,
        daylight_Back,
    ]);
    return texture;
}
