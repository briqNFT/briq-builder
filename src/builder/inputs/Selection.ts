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
        this.scene.add(parent);
    }
    
    update(selMgr: SelectionManager)
    {
        if (!this.parent)
            return;

        this.parent.remove(...this.parent.children);

        var geometry =  new THREE.BoxGeometry(1.02, 1.02, 1.02);
        var material = new THREE.MeshPhongMaterial( {color: 0x002496, opacity:0.5, transparent: true });
        for (let briq of selMgr.selectedBriqs)
        {
            var planeXZ = new THREE.Mesh(geometry, material);
            planeXZ.position.set(briq.position[0] + 0.5, briq.position[1] + 0.5, briq.position[2] + 0.5);
            planeXZ.visible = true;
            // Increase render order to sort out transparecy issues.
            planeXZ.renderOrder = 1;
            this.parent.add(planeXZ);
        }
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

    updateGraphics()
    {
        selectionRender.update(this);   
    }

    clear()
    {
        this.selectedBriqs = [];
        selectionRender.update(this);
    }

    select(briqs: Briq[], add: boolean = false)
    {
        if (add)
        {
            for (let briq of briqs)
                if (!this.selectedBriqs.find(x => x === briq))
                    this.selectedBriqs.push(briq);
        }
        else
            this.selectedBriqs = briqs;

        selectionRender.update(this);
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

        selectionRender.update(this);
    }

    add(x: number, y: number, z: number)
    {
        let briq = this.set?.getAt(x, y, z);
        if (!briq)
            return;
        let item = this.selectedBriqs.find(x => x === briq);
        if (item)
            return;
        this.selectedBriqs.push(briq);
        selectionRender.update(this);
    }

    remove(x: number, y: number, z: number)
    {
        let briq = this.set?.getAt(x, y, z);
        if (!briq)
            return;
        let idx = this.selectedBriqs.findIndex(x => x === briq);
        if (idx !== -1)
            this.selectedBriqs.splice(idx, 1);
        selectionRender.update(this);
    }
}
