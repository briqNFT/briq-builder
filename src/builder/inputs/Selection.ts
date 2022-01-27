import type { SetData } from "../SetData";
import type { Briq } from '../Briq';

import { THREE } from '../../three';

class SelectionRender
{
    scene: THREE.Scene | undefined;
    mesh!: THREE.Mesh;
    parent!: THREE.Object3D;

    setScene(scene: THREE.Scene)
    {
        this.scene = scene;
        this.generate();
    }

    generate()
    {
        if (!this.scene)
            return;
        let parent = new THREE.Object3D();
        this.parent = parent;

        var geometry =  new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshPhongMaterial( {color: 0x002496, opacity:0.5, transparent: true });
        var planeXZ = new THREE.Mesh(geometry, material);
        planeXZ.position.set(0, 0, 0);
        planeXZ.visible = false;
        // Increase render order to sort out transparecy issues.
        planeXZ.renderOrder = 1;
        this.mesh = planeXZ;
        this.parent.add(this.mesh);
        this.scene.add(parent);
    }
    
    show() { if (!this.parent) { return }; this.parent.visible = true; }
    hide() { if (!this.parent) { return }; this.parent.visible = false; }
}
export const selectionRender = new SelectionRender();

export class SelectionManager
{
    selectedBriqs: Array<Briq> = [];
    set: SetData | undefined;

    selectSet(set: SetData)
    {
        this.set = set;
        this.clear();
    }

    clear()
    {
        this.selectedBriqs = [];
        if (selectionRender.mesh)
            selectionRender.mesh.visible = false;
    }

    selectAt(x: number, y: number, z: number)
    {
        let briq = this.set?.getAt(x, y, z);
        if (!briq)
        {
            this.clear();
            return;
        }
        this.selectedBriqs = [briq];

        if (selectionRender.mesh)
        {
            selectionRender.mesh!.visible = true;
            selectionRender.mesh!.scale.set(1.1, 1.1, 1.1);
            selectionRender.mesh!.position.set(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(z) + 0.5);
        }
    }

    replace(ov: string, nv: Briq)
    {
        let ix = this.selectedBriqs.indexOf(ov);
        if (ix !== -1)
            this.selectedBriqs.splice(ix, 1, nv);
    }
}
