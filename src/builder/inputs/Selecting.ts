import { MouseInputState } from './BuilderInputState';
import { selectionRender } from './Selection';
import { THREE, SelectionBox as ThreeSelectionBox } from '../../three';

import { store } from '../../store/Store'
import { camera } from '../graphics/Builder';

export class SelectionBox extends MouseInputState
{
    startX!: number;
    startY!: number;

    switchBackTo!: string;

    onEnter(data: any) {
        this.switchBackTo = data.switchBackTo;

        this.curX = data.x;
        this.curY = data.y;
        this.startX = data.x;
        this.startY = data.y;

        this.fsm.gui.curX = this.curX;
        this.fsm.gui.curY = this.curY;
        this.fsm.gui.startX = this.startX;
        this.fsm.gui.startY = this.startY;

        this.fsm.gui.selectionBox = true;
        
        this.fsm.orbitControls.enabled = false;

        selectionRender.show();
    }

    onExit() {
        selectionRender.hide();
        this.fsm.orbitControls.enabled = true;
        this.fsm.gui.selectionBox = false;
    }

    async onPointerMove(event: PointerEvent)
    {
        this.fsm.gui.curX = this.curX;
        this.fsm.gui.curY = this.curY;
    }

    async onPointerUp(event: PointerEvent)
    {
        if (this.startX === this.curX && this.startY === this.curY)
        {
            const pos = this.getIntersectionPos(this.curX, this.curY, true);
            this.fsm.store.selectionMgr.add(...pos);
            this.fsm.switchTo(this.switchBackTo);
            return;
        }
        try
        {
            let startX = (this.startX / window.innerWidth - 0.5) * 2;
            let curX = (this.curX / window.innerWidth - 0.5) * 2;
            let startY = -(this.startY / window.innerHeight - 0.5) * 2;
            let curY = -(this.curY / window.innerHeight - 0.5) * 2;
            if (startX === curX)
                curX += 0.0001;
            if (startY === curY)
                curY += 0.0001;
            // Hack around the threeselectionbox code to reuse the frustum construction code.
            let fakeScene = {
                children: []
            };
            let box = new ThreeSelectionBox(camera,  fakeScene, 10000);
            let frustum: THREE.Frustum;
            box.searchChildInFrustum = (ft) => frustum = ft;
            box.select(
                new THREE.Vector3(startX, startY, 0),
                new THREE.Vector3(curX, curY, 0)
            )
            let ret = [] as Briq[];
            let cpos1 = new THREE.Vector3();
            let cpos2 = new THREE.Vector3();
            let cbox = new THREE.Box3(cpos1, cpos2);
            store.state.builderData.currentSet.forEach((briq, pos) => {
                cpos1.x = pos[0];
                cpos1.y = pos[1];
                cpos1.z = pos[2];
                cpos2.x = pos[0] + 1;
                cpos2.y = pos[1] + 1;
                cpos2.z = pos[2] + 1;
                if (frustum.intersectsBox(cbox))
                    ret.push(briq);
            });
            this.fsm.store.selectionMgr.select(ret, true);
        } finally {
            this.fsm.switchTo(this.switchBackTo);
        }
    }
}
