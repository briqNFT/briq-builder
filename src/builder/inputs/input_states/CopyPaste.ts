import { BuilderInputState, MouseInputState } from './BuilderInputState';

import type { HotkeyHandle } from '@/Hotkeys';

import { selectionRender } from '../Selection';
import { THREE } from '@/three';
import { pushMessage } from '@/Messages';
import { builderStore } from '@/builder/BuilderStore';
import type { BuilderInputFSM } from '../BuilderInput';
import { APP_ENV } from '@/Meta';
import { builderHistory } from '@/builder/BuilderHistory';
import { PlaceOrRemoveBriqs } from '@/builder/BuilderActions';

const { currentSet } = builderStore;


export function canCopyPaste(fsm?: BuilderInputFSM) {
    return window.localStorage.getItem('copy_paste_data') || fsm && fsm.store.selectionMgr.selectedBriqs.length > 0;
}

export class CopyInput extends BuilderInputState {
    onEnter() {
        window.localStorage.setItem('copy_paste_data',
            JSON.stringify(this.fsm.store.selectionMgr.selectedBriqs.map(x => ({ position: x.position, color: x.color, material: x.material }))),
        );
        this.fsm.switchTo('copy_paste');
    }
}

export class CopyPasteInput extends MouseInputState {
    lastClickPos: [number, number, number] | undefined;

    selectionCenter!: THREE.Vector3;
    min!: [number, number, number];
    max!: [number, number, number];
    boundingBoxCenter!: [number, number, number];

    ColorOK = new THREE.Color(0x002496);
    ColorOverlay = new THREE.Color(0xffaa000);

    cancelHotkey!: HotkeyHandle;

    override onEnter() {
        try {
            const copiedData = JSON.parse(window.localStorage.getItem('copy_paste_data')!);
            if (copiedData) {
                this.fsm.store.selectionMgr.clear();
                // Bit of a hack because these are 'virtual briqs' in a sense, but it works
                this.fsm.store.selectionMgr.select(copiedData);
            }
        } catch(_) {
            if (APP_ENV === 'dev')
                console.error(_);
        }
        this.cancelHotkey = this.fsm.hotkeyMgr.subscribe('escape', () => {
            this.fsm.switchTo('inspect');
        });

        selectionRender.show();
        this.selectionCenter = this.fsm.store.selectionMgr.getCenterPos();
        if (!this.selectionCenter)
            return this.fsm.switchTo('inspect');

        const briqs = this.fsm.store.selectionMgr.selectedBriqs;
        this.min = briqs[0].position!.slice();
        this.max = briqs[0].position!.slice();
        for (let i = 1; i < briqs.length; ++i) {
            if (briqs[i].position![0] > this.max[0])
                this.max[0] = briqs[i].position![0];
            if (briqs[i].position![0] < this.min[0])
                this.min[0] = briqs[i].position![0];
            if (briqs[i].position![1] > this.max[1])
                this.max[1] = briqs[i].position![1];
            if (briqs[i].position![1] < this.min[1])
                this.min[1] = briqs[i].position![1];
            if (briqs[i].position![2] > this.max[2])
                this.max[2] = briqs[i].position![2];
            if (briqs[i].position![2] < this.min[2])
                this.min[2] = briqs[i].position![2];
        }
        this.boundingBoxCenter = [
            (this.max[0] + this.min[0]) / 2 + 0.5,
            (this.max[1] + this.min[1]) / 2 + 0.5,
            (this.max[2] + this.min[2]) / 2 + 0.5,
        ];

        this.onPointerMove();
    }

    override onExit() {
        selectionRender.hide();
        selectionRender.parent.position.set(0, 0, 0);
        selectionRender.parent.children[0].material.color = this.ColorOK;
        this.fsm.hotkeyMgr.unsubscribe(this.cancelHotkey);
    }

    _specialClamp(res: [number, number, number]) {
        const x0 = this.boundingBoxCenter[0] - this.min[0];
        const y0 = this.boundingBoxCenter[1] - this.min[1];
        const z0 = this.boundingBoxCenter[2] - this.min[2];
        const x1 = this.max[0] - this.boundingBoxCenter[0] + 1;
        const z1 = this.max[2] - this.boundingBoxCenter[2] + 1;
        const canvasSize = this.canvasSize();
        res[0] = res[0] < -canvasSize + x0 ? -canvasSize + x0 : res[0] >= canvasSize - x1 ? +canvasSize - x1 : res[0];
        res[2] = res[2] < -canvasSize + z0 ? -canvasSize + z0 : res[2] >= canvasSize - z1 ? +canvasSize - z1 : res[2];
        res[1] = res[1] < y0 ? y0 : res[1];
        return res;
    }

    async onPointerMove() {
        const intersection = this._getIntersectionPos(this.curX, this.curY);
        if (!intersection)
            return;
        let pos = intersection.position.map((v, ndx) => {
            return v + (intersection.normal[ndx] * (this.max[ndx] - this.min[ndx] + 1)) / 2;
        });
        const corr = [
            this.selectionCenter.x - this.boundingBoxCenter[0],
            this.selectionCenter.y - this.boundingBoxCenter[1],
            this.selectionCenter.z - this.boundingBoxCenter[2],
        ];
        /*
        logDebug("Intersection pos", intersection.position);
        logDebug("Correction: ", corr)
        logDebug("Initial pos", pos);
        logDebug("Corrected", [pos[0] + corr[0] - this.selectionCenter.x,
            pos[1] + corr[1] - this.selectionCenter.y,
            pos[2] + corr[2] - this.selectionCenter.z]);
        logDebug(this.min, this.max, this.selectionCenter)
        */

        pos = this._specialClamp(pos);
        selectionRender.parent.position.set(
            Math.round(pos[0] + corr[0] - this.selectionCenter.x),
            Math.round(pos[1] + corr[1] - this.selectionCenter.y),
            Math.round(pos[2] + corr[2] - this.selectionCenter.z),
        );
        // Color the mesh if there is an overlay.
        let overlay = true;
        for (const briq of this.fsm.store.selectionMgr.selectedBriqs) {
            const bp = [
                Math.round(pos[0] + briq.position![0] + corr[0] - this.selectionCenter.x),
                Math.round(pos[1] + briq.position![1] + corr[1] - this.selectionCenter.y),
                Math.round(pos[2] + briq.position![2] + corr[2] - this.selectionCenter.z),
            ];
            if (currentSet.value.getAt(...bp)) {
                overlay = false;
                break;
            }
        }
        selectionRender.parent.children[0].material.color = overlay ? this.ColorOK : this.ColorOverlay;
    }

    async onPointerDown(event: PointerEvent) {}

    async onPointerUp(event: PointerEvent) {
        const mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;

        if (event.button === 2) {
            this.fsm.switchTo('inspect');
            return;
        }

        await this.doPaste();
    }

    async doPaste() {
        const intersection = this._getIntersectionPos(this.curX, this.curY);
        if (!intersection) {
            this.fsm.switchTo('inspect');
            return;
        }
        let pos = intersection.position.map((v, ndx) => {
            return v + (intersection.normal[ndx] * (this.max[ndx] - this.min[ndx] + 1)) / 2;
        });
        const corr = [
            this.selectionCenter.x - this.boundingBoxCenter[0],
            this.selectionCenter.y - this.boundingBoxCenter[1],
            this.selectionCenter.z - this.boundingBoxCenter[2],
        ];
        pos = this._specialClamp(pos);
        let didOverlay = false;
        const data = [];
        const positions = [];
        for (const briq of this.fsm.store.selectionMgr.selectedBriqs) {
            const bp = [
                Math.round(pos[0] + briq.position![0] + corr[0] - this.selectionCenter.x),
                Math.round(pos[1] + briq.position![1] + corr[1] - this.selectionCenter.y),
                Math.round(pos[2] + briq.position![2] + corr[2] - this.selectionCenter.z),
            ] as [number, number, number];
            if (currentSet.value.getAt(...bp) && this.fsm.store.briqOverlayMode === 'KEEP') {
                didOverlay = true;
                continue;
            }
            positions.push(bp);
            // Explicitly do not copy NFT ids, for those cannot be duplicated.
            data.push({ pos: bp, color: briq.color, material: briq.material });
        }
        builderHistory.push_command(PlaceOrRemoveBriqs, data);
        builderHistory.push_checkpoint();

        if (didOverlay && this.fsm.store.briqOverlayMode === 'KEEP')
            pushMessage('Some briqs were not placed because they overlayed existing briqs');

        this.fsm.store.selectionMgr.clear();
        for (const p of positions)
            this.fsm.store.selectionMgr.add(...p);

        this.fsm.switchTo('inspect');
    }
}
