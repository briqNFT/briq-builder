import type { SetData } from '@/builder/SetData';
import { Briq } from '@/builder/Briq';
import { threeSetupComplete } from '@/threeLoading';
import type { THREE as THREE_TYPE } from '@/three';
import { inputStore } from './inputs/InputStore';


let THREE: typeof THREE_TYPE;
threeSetupComplete.then(x => THREE = x);

// A BuilderAction acts on a set and has the following methods:
// - Allowed() - returns true if the action is allowed to be performed
// - Perform() - performs the action
// - Undo() - undoes the action
// - Redo() - redoes the action

export abstract class BuilderAction {
    allowed(set: SetData) {
        return true;
    }
    abstract undo(set: SetData): void;
    abstract redo(set: SetData): void;
}

function isWithinBounds(x: number, y: number, z: number) {
    const size = 10000;
    return x >= -size && x < size && y >= 0 && z >= -size && z < size;
}

export class RenameSet extends BuilderAction {
    payload;
    oldName;
    oldDesc;

    constructor(set: SetData, payload: { name: string } | { description: string}) {
        super();
        this.payload = payload;
        this.oldName = set.name;
        this.oldDesc = set.description;
        return this;
    }

    undo(set: SetData) {
        if (this.oldName)
            set.name = this.oldName;
        if (this.oldDesc)
            set.description = this.oldDesc;
    }

    redo(set: SetData) {
        if ('name' in this.payload)
            set.name = this.payload.name;
        if ('description' in this.payload)
            set.description = this.payload.description;
    }
}

export class PlaceOrRemoveBriqs extends BuilderAction {
    payload;
    oldData;

    constructor(set: SetData, payload: { pos: [number, number, number], color?: string, material?: string, id?: string, allow_overwrite?: boolean }[]) {
        super();
        this.payload = payload;
        for (const briqData of this.payload)
            if (briqData.color && !isWithinBounds(...briqData.pos))
                throw new Error('cannot');

        const cells = [];
        for (const data of this.payload) {
            const cell = set.getAt(...data.pos);
            cells.push({
                pos: data.pos,
                color: cell?.color,
                material: cell?.material,
                id: cell?.id,
                allow_overwrite: true,
            });
        }
        this.oldData = cells;
        return this;
    }

    undo(set: SetData) {
        // Because placeBriq can modify briqs & remove them, we just redo with the old data,
        // it's equivalent to removing then readding.
        this.redo(set, this.oldData);
    }

    redo(set: SetData, payload: typeof this['payload'] = this.payload) {
        for (const briqData of payload) {
            const cell = set.getAt(...briqData.pos);
            if (cell && briqData.color && !briqData.allow_overwrite)
                continue;
            const briq = briqData.color
                ? new Briq(briqData.material, briqData.color).setNFTid(briqData.id)
                : undefined;
            set.placeBriq(...briqData.pos, briq);
        }
        inputStore.selectionMgr.clear();
        // dispatchBuilderAction("place_briqs", grphcs);
        // inputStore.selectionMgr.clear();
    }
}


export class PaintBriqs extends BuilderAction {
    payload;
    oldColors;

    constructor(set: SetData, payload: { pos: [number, number, number], color?: string, material?: string }[]) {
        super();
        this.payload = payload;
        const colors = [];
        for (const d of this.payload) {
            const cell = set.getAt(...(d.pos as [number, number, number]));
            if (cell)
                colors.push({ pos: d.pos, color: cell.color, material: cell.material });
        }
        this.oldColors = colors;
        return this;
    }

    undo(set: SetData) {
        for (const d of this.oldColors)
            set.modifyBriq(...d.pos, d);
    }

    redo(set: SetData) {
        for (const d of this.payload)
            set.modifyBriq(...d.pos, d);
    }
}

export class MoveBriqs extends BuilderAction {
    step1!: PlaceOrRemoveBriqs;
    step2!: PlaceOrRemoveBriqs;

    constructor(set: SetData, payload: { delta: { x?: number; y?: number; z?: number }; briqs: Briq[]; allow_overwrite: boolean }) {
        super();
        for (const briq of payload.briqs) {
            const pos = briq.position!;
            if (
                !isWithinBounds(
                    pos[0] + (payload.delta.x || 0),
                    pos[1] + (payload.delta.y || 0),
                    pos[2] + (payload.delta.z || 0),
                )
            )
                throw new Error('cannot, would go out of bounds');
        }
        // Step 1: remove the briqs from their start position.
        // Step 2: change the briqs at destination.
        this.step1 = new PlaceOrRemoveBriqs(set, payload.briqs.map((b) => ({ pos: b.position! })));
        this.step2 = new PlaceOrRemoveBriqs(set, payload.briqs.map((b) => ({
            pos: [
                b.position![0] + (payload.delta.x || 0),
                b.position![1] + (payload.delta.y || 0),
                b.position![2] + (payload.delta.z || 0),
            ],
            color: b.color,
            material: b.material,
            allow_overwrite: payload.allow_overwrite,
        })));
        return this;
    }

    undo(set: SetData) {
        this.step2.undo(set);
        this.step1.undo(set);
        // Just assume that we were selecting the briqs we moved.
        inputStore.selectionMgr.clear();
        this.step1.oldData.forEach(x => inputStore.selectionMgr.add(...x.pos));
        inputStore.selectionMgr.updateGraphics();
    }

    redo(set: SetData) {
        this.step1.redo(set);
        this.step2.redo(set);
        // Just assume that we were selecting the briqs we moved.
        inputStore.selectionMgr.clear();
        this.step2.payload.forEach(x => inputStore.selectionMgr.add(...x.pos));
        inputStore.selectionMgr.updateGraphics();
    }
}


export class RotateBriqs extends BuilderAction {
    eraseStep: PlaceOrRemoveBriqs;
    placeAtTargetStep: PlaceOrRemoveBriqs;

    constructor(set: SetData, data: { axis: 'x' | 'y' | 'z', angle: number, rotationCenter: THREE.Vector3, briqs: Briq[], allow_overwrite: boolean }) {
        super();

        const targetBriqs = {} as Record<string, Briq & { pos: [number, number, number] }>;
        const pv = new THREE.Vector3();
        const rot = new THREE.Quaternion();
        rot.setFromAxisAngle(
            new THREE.Vector3(data.axis === 'x', data.axis === 'y', data.axis === 'z'),
            data.angle,
        );
        for (const briq of data.briqs) {
            pv.x = briq.position![0] + 0.5;
            pv.y = briq.position![1] + 0.5;
            pv.z = briq.position![2] + 0.5;
            const pos = pv.sub(data.rotationCenter);
            pos.applyQuaternion(rot);
            pos.add(data.rotationCenter);
            pos.x -= 0.5;
            pos.y -= 0.5;
            pos.z -= 0.5;

            // TODO: this can lead to duplicates or 'holes' in the target.
            // NB: because of numerical instability and rounding, we do a first pass of rounding.
            const roundedPos = pos.clone().multiplyScalar(2).round().divideScalar(2).round();
            targetBriqs[briq._uuid] = {
                pos: [roundedPos.x, roundedPos.y, roundedPos.z],
                color: briq.color,
                material: briq.material,
                id: briq.id,
            };
            if (!isWithinBounds(...targetBriqs[briq._uuid].pos))
                throw new Error('Cannot rotate, briqs would go out-of-bounds');
        }

        const replacedBriqs = {} as { [key: string]: any };
        for (const uid in targetBriqs) {
            const briq = set.getAt(...targetBriqs[uid].pos);
            // Ignore briqs that are part of the movement.
            if (briq && !targetBriqs[briq._uuid] && data.allow_overwrite)
                replacedBriqs[briq._uuid] = {
                    pos: briq.position,
                    color: briq.color,
                    material: briq.material,
                    id: briq.id,
                };
            else if (briq && !targetBriqs[briq._uuid] && !data.allow_overwrite)
                targetBriqs[uid] = undefined;
        }

        const originalBriqs = [];
        for (const briq of data.briqs)
            originalBriqs.push({ pos: briq.position, color: briq.color, material: briq.material, id: briq.id });

        // Step 1: remove the briqs from their start position.
        // Step 2: change the briqs at destination.
        this.eraseStep = new PlaceOrRemoveBriqs(set, data.briqs.map((b) => ({ pos: b.position! })));
        const b = [];
        for (const uid in targetBriqs)
            if (targetBriqs[uid])
                b.push({
                    pos: targetBriqs[uid].pos,
                    color: targetBriqs[uid].color,
                    material: targetBriqs[uid].material,
                    id: targetBriqs[uid].id,
                    allow_overwrite: data.allow_overwrite,
                });
        this.placeAtTargetStep = new PlaceOrRemoveBriqs(set, b);

        return this;
    }

    undo(set: SetData) {
        this.placeAtTargetStep.undo(set);
        this.eraseStep.undo(set);

        // Just assume that we were selecting the briqs we moved.
        inputStore.selectionMgr.clear();
        this.eraseStep.oldData.forEach(x => inputStore.selectionMgr.add(...x.pos));
        inputStore.selectionMgr.updateGraphics();
    }

    redo(set: SetData) {
        this.eraseStep.redo(set);
        this.placeAtTargetStep.redo(set);
        inputStore.selectionMgr.clear();
        this.placeAtTargetStep.payload.forEach(x => inputStore.selectionMgr.add(...x.pos));
        inputStore.selectionMgr.updateGraphics();
    }
}
