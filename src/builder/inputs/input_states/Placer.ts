import { MouseInputState } from './BuilderInputState';
import getPreviewCube from '@/builder/graphics/PreviewCube'
import { inputStore } from "../InputStore";
import { store } from '@/store/Store'

import { THREE } from '@/three';
import { VoxelAlignedSelection } from './SelectHelpers';

import { watchEffect } from 'vue';

const MATERIAL = "0x1";

export class PlacerInput extends MouseInputState
{
    onEnter()
    {
        getPreviewCube().visible = false;
        getPreviewCube().scale.set(1, 1, 1);
    }
    
    onExit()
    {
        getPreviewCube().visible = false;
    }

    async onPointerMove(event: PointerEvent)
    {
        const pos = this.getIntersectionPos(this.curX, this.curY);
        if (!pos)
            return;
        getPreviewCube().position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
        if (this.isWithinBounds(...pos))
        {
            getPreviewCube().visible = true;
            (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
        }
        else
            getPreviewCube().visible = false;
    }

    async onPointerDown(event: PointerEvent)
    {
        if (event.shiftKey)
            this.fsm.switchTo("place_multi", { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;
        
        const removing = event.button !== 0;
        const pos = this.getIntersectionPos(this.curX, this.curY, removing);
        if (!pos || !this.isWithinBounds(...pos))
            return;
        try {
            let data = removing ? { pos } : { pos, color: inputStore.currentColor, material: MATERIAL };
            await store.dispatch("builderData/place_briqs", [data]);
            // Update the preview cursor in a few milliseconds to let the world update.
            // Use the 'non event updating version' so the cube doesn't accidentally jump back.
            setTimeout(() => this.onPointerMove(event), 100);
        } catch(_) {}
    }
}

export class PlacerMultiInput extends VoxelAlignedSelection
{
    onEnter(data: any) {
        this.extruding = true;
        super.onEnter(data);
        this.switchBackTo = "place";

        watchEffect(() => {
            (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(inputStore.currentColor);
        })
    }
    async doAction(pos: [number, number, number]) {
        let briqs = [];
        for (let x = Math.min(this.initialClickPos[0], pos[0]); x <= Math.max(this.initialClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.initialClickPos[1], pos[1]); y <= Math.max(this.initialClickPos[1], pos[1]); ++y)
                for (let z = Math.min(this.initialClickPos[2], pos[2]); z <= Math.max(this.initialClickPos[2], pos[2]); ++z)
                    if (!store.state.builderData.currentSet.getAt(x, y, z))
                        briqs.push({ pos: [x, y, z], color: inputStore.currentColor, material: MATERIAL });
        await store.dispatch("builderData/place_briqs", briqs);
    }
}
