import { MouseInputState } from './BuilderInputState';
import { store } from '@/store/Store'

import type { HotkeyHandle } from '@/Hotkeys';

import { SelectionManager, selectionRender } from '../Selection';
import { THREE } from '@/three';
import { pushMessage } from '@/Messages';

export class CopyPasteInput extends MouseInputState {
    lastClickPos: [number, number, number] | undefined;

    selectionCenter!: THREE.Vector3
    min!: [number, number, number];
    max!: [number, number, number];

    ColorOK = new THREE.Color(0x002496);
    ColorNOK = new THREE.Color(0xFF00000);

    cancelHotkey!: HotkeyHandle;
    pasteHotkey!: HotkeyHandle;

    override onEnter() {
        selectionRender.show();
        this.selectionCenter = this.fsm.store.selectionMgr.getCenterPos();
        if (!this.selectionCenter)
            throw new Error("Entered copy paste with no selection");

        let briqs = this.fsm.store.selectionMgr.selectedBriqs;
        this.min = briqs[0].position!.slice();
        this.max = briqs[0].position!.slice();
        for (let i = 1; i < briqs.length; ++i) {
            if (briqs[i].position![0] > this.max[0]) this.max[0] = briqs[i].position![0];
            if (briqs[i].position![0] < this.min[0]) this.min[0] = briqs[i].position![0];
            if (briqs[i].position![1] > this.max[1]) this.max[1] = briqs[i].position![1];
            if (briqs[i].position![1] < this.min[1]) this.min[1] = briqs[i].position![1];
            if (briqs[i].position![2] > this.max[2]) this.max[2] = briqs[i].position![2];
            if (briqs[i].position![2] < this.min[2]) this.min[2] = briqs[i].position![2];
        }
        this.cancelHotkey = this.fsm.hotkeyMgr.subscribe("escape", () => { this.fsm.switchTo("inspect"); })
        this.fsm.hotkeyMgr.register("paste", { code: "KeyV", ctrl: true });
        this.pasteHotkey = this.fsm.hotkeyMgr.subscribe("paste", () => { this.doPaste(); })

        this.onPointerMove();
    }

    override onExit() {
        selectionRender.hide();
        selectionRender.parent.position.set(0, 0, 0);
        selectionRender.parent.children[0].material.color = this.ColorOK;
        this.fsm.hotkeyMgr.unsubscribe(this.pasteHotkey);
        this.fsm.hotkeyMgr.unsubscribe(this.cancelHotkey);
    }

    _specialClamp(res: [number, number, number]) {
        let x0 = this.selectionCenter.x - this.min[0];
        let y0 = this.selectionCenter.y - this.min[1];
        let z0 = this.selectionCenter.z - this.min[2];
        let x1 = this.max[0] - this.selectionCenter.x + 1;
        let z1 = this.max[2] - this.selectionCenter.z + 1;
        let canvasSize = this.canvasSize();
        res[0] = res[0] < -canvasSize + x0 ? -canvasSize + x0 : (res[0] >= canvasSize - x1 ? +canvasSize - x1 : res[0]);
        res[2] = res[2] < -canvasSize + z0 ? -canvasSize + z0 : (res[2] >= canvasSize - z1 ? +canvasSize - z1 : res[2]);
        res[1] = res[1] < y0 ? y0 : res[1];
        return res;
    }

    async onPointerMove() {
        let intersection = this._getIntersectionPos(this.curX, this.curY);
        if (!intersection)
            return;
        let pos = intersection.position.map((v, ndx) => {
            return v + intersection.normal[ndx] * (this.max[ndx] - this.min[ndx] + 1) / 2;
        });
        pos = this._specialClamp(pos);
        selectionRender.parent.position.set(
            Math.round(pos[0] - this.selectionCenter.x),
            Math.round(pos[1] - this.selectionCenter.y),
            Math.round(pos[2] - this.selectionCenter.z),
        );
        let ok = true;
        for (let briq of this.fsm.store.selectionMgr.selectedBriqs) {
            let bp = [
                Math.round(pos[0] + briq.position![0] - this.selectionCenter.x),
                Math.round(pos[1] + briq.position![1] - this.selectionCenter.y),
                Math.round(pos[2] + briq.position![2] - this.selectionCenter.z),
            ];
            if (store.state.builderData.currentSet.getAt(...bp)) {
                ok = false;
                break;
            }
        }
        selectionRender.parent.children[0].material.color = ok ? this.ColorOK : this.ColorNOK;
    }

    async onPointerDown(event: PointerEvent) {
    }

    async onPointerUp(event: PointerEvent) {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;

        if (event.button === 2) {
            this.fsm.switchTo("inspect");
            return;
        }

        await this.doPaste();
    }

    async doPaste()
    {
        let intersection = this._getIntersectionPos(this.curX, this.curY);
        if (!intersection)
        {
            this.fsm.switchTo("inspect");
            return;
        }
        let pos = intersection.position.map((v, ndx) => {
            return v + intersection.normal[ndx] * (this.max[ndx] - this.min[ndx] + 1) / 2;
        });
        pos = this._specialClamp(pos);
        Math.round(pos[0] - this.selectionCenter.x);
        Math.round(pos[1] - this.selectionCenter.y);
        Math.round(pos[2] - this.selectionCenter.z);
        let data = [];
        let positions = [];
        for (let briq of this.fsm.store.selectionMgr.selectedBriqs) {
            let bp = [
                Math.round(pos[0] + briq.position![0] - this.selectionCenter.x),
                Math.round(pos[1] + briq.position![1] - this.selectionCenter.y),
                Math.round(pos[2] + briq.position![2] - this.selectionCenter.z),
            ];
            positions.push(bp);
            if (store.state.builderData.currentSet.getAt(...bp)) {
                pushMessage("Cannot paste here");
                return;
            }
            data.push({ pos: bp, color: briq.color, material: briq.material });
        }
        await store.dispatch('builderData/place_briqs', data);
        this.fsm.store.selectionMgr.clear();
        for (let p of positions)
            this.fsm.store.selectionMgr.add(...p);
        this.fsm.switchTo("inspect");
    }
}
