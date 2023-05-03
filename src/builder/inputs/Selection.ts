import type { SetData } from '../SetData';
import type { Briq } from '../Briq';

import { threeSetupComplete } from '@/threeLoading';
import type { THREE as THREE_T } from '@/three';
let THREE: typeof THREE_T;
threeSetupComplete.then(x => THREE = x);

class SelectionRender {
    scene: THREE.Scene | undefined;
    parent!: THREE.Object3D;

    setScene(scene: THREE.Scene) {
        this.scene = scene;
        this.generate();
    }

    generate() {
        if (!this.scene)
            return;
        const parent = new THREE.Object3D();
        this.parent = parent;
        this.scene.add(parent);
    }

    update(selMgr: SelectionManager) {
        if (!this.parent)
            return;

        this.parent.remove(...this.parent.children);

        const geometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        const material = new THREE.MeshPhongMaterial({ color: 0x002496, opacity: 0.5, transparent: true });

        const mesh = new THREE.InstancedMesh(geometry, material, selMgr.selectedBriqs.length);
        mesh.renderOrder = 1;
        mesh.frustumCulled = false;
        let i = 0;
        for (const briq of selMgr.selectedBriqs)
            mesh.setMatrixAt(
                i++,
                new THREE.Matrix4().setPosition(briq.position[0] + 0.5, briq.position[1] + 0.5, briq.position[2] + 0.5),
            );
        this.parent.add(mesh);
    }

    show() {
        if (!this.parent)
            return;

        this.parent.visible = true;
    }
    hide() {
        if (!this.parent)
            return;

        this.parent.visible = false;
    }
}
export const selectionRender = new SelectionRender();

export class SelectionManager {
    selectedBriqs: Array<Briq> = [];
    set: SetData | undefined;

    selectSet(set: SetData) {
        this.set = set;
        this.clear();
    }

    updateGraphics() {
        selectionRender.update(this);
    }

    /**
     * Calculate the center position of the selection, using real briq centers and not voxel coordinates.
     * @returns the position, or undefined if there is no selection.
     */
    getCenterPos() {
        if (!this.selectedBriqs.length)
            return;
        const avgPos = new THREE.Vector3();
        for (const briq of this.selectedBriqs) {
            avgPos.x += briq.position![0];
            avgPos.y += briq.position![1];
            avgPos.z += briq.position![2];
        }
        avgPos.divideScalar(this.selectedBriqs.length);
        avgPos.addScalar(0.5);
        return avgPos;
    }

    clear() {
        const oldL = this.selectedBriqs.length;
        this.selectedBriqs = [];
        if (oldL)
            selectionRender.update(this);
    }

    select(briqs: Briq[], add = false) {
        if (add) {
            const ret = [];
            const set = {};
            this.selectedBriqs.forEach((briq) => {
                if (!set[briq._uuid]) {
                    set[briq._uuid] = 1;
                    ret.push(briq);
                }
            });
            briqs.forEach((briq) => {
                if (!set[briq._uuid]) {
                    set[briq._uuid] = 1;
                    ret.push(briq);
                }
            });
            this.selectedBriqs = ret;
        } else
            this.selectedBriqs = briqs;

        selectionRender.update(this);
    }

    selectAt(x: number, y: number, z: number) {
        const briq = this.set?.getAt(x, y, z);
        if (!briq) {
            this.clear();
            return;
        }
        this.selectedBriqs = [briq];

        selectionRender.update(this);
    }

    selectAll() {
        if (!this.set)
            return;
        const briqs = [] as Briq[];
        this.set.forEach((briq: Briq) => {
            briqs.push(briq);
        });
        this.select(briqs);

    }

    add(x: number, y: number, z: number) {
        const briq = this.set?.getAt(x, y, z);
        if (!briq)
            return;
        const item = this.selectedBriqs.find((x) => x._uuid === briq._uuid);
        if (item)
            return;
        this.selectedBriqs.push(briq);
        selectionRender.update(this);
    }

    remove(x: number, y: number, z: number) {
        const briq = this.set?.getAt(x, y, z);
        if (!briq)
            return;
        const idx = this.selectedBriqs.findIndex((x) => x._uuid === briq._uuid);
        if (idx !== -1)
            this.selectedBriqs.splice(idx, 1);
        selectionRender.update(this);
    }
}
