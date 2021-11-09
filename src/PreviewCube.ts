import * as THREE from 'three'

function generatePreviewCube()
{
    var geometry =  new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshPhongMaterial( {color: 0x002496, opacity:0.5, transparent: true });
    var planeXZ = new THREE.Mesh(geometry, material);
    planeXZ.position.set(0, 0, 0)//Math.floor(cellSize/2), 0,Math.floor(cellSize/2));
    planeXZ.visible = false;
    return planeXZ;
}

export var previewCube = generatePreviewCube();

