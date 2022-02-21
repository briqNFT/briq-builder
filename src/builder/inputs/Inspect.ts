import { MouseInputState } from './BuilderInputState';
import { store } from '../../store/Store'
import type { SetData } from '../SetData'
import type { Briq } from '../Briq.js';
import { SelectionManager, selectionRender } from './Selection';
import getPreviewCube from '../graphics/PreviewCube'
import { THREE, BufferGeometryUtils, SelectionBox as ThreeSelectionBox } from '../../three';

import { camera, inputObjects } from '../graphics/Builder';

import { featureFlags } from "../../FeatureFlags";
import { pushMessage } from '../../Messages';
import { setsManager } from '../SetsManager';

import { watchEffect, WatchStopHandle } from 'vue';

var getMovementHelperMesh = (() => {
    let mainMesh: THREE.Object3D;
    return () => {
        if (mainMesh)
            return mainMesh;
        mainMesh = new THREE.Object3D();
        const RO = 2;
        // Marked transparent for sorting.x
        mainMesh.renderOrder = RO;

        let cone = new THREE.ConeGeometry(0.4, 1.0);
        cone.translate(0, 1.5, 0);
        let geometry = BufferGeometryUtils.mergeBufferGeometries([new THREE.BoxGeometry(0.2, 2, 0.2), cone]);

        {
            let material = new THREE.MeshPhongMaterial( { color: 0x002496, opacity: 0.9, transparent: true, depthWrite: false, depthTest: false, });
            let mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(0, 1.0, 0);
            mesh.userData = { dir: "y" };
            mainMesh.add(mesh);
        }
        {
            let material = new THREE.MeshPhongMaterial( { color: 0x962400, opacity: 0.9, transparent: true, depthWrite: false, depthTest: false, });
            let mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(0, 0, 1.0);
            mesh.rotateX(Math.PI/2);
            mesh.userData = { dir: "z" };
            mainMesh.add(mesh);
        }
        {
            let material = new THREE.MeshPhongMaterial( { color: 0x009624, opacity: 0.9, transparent: true, depthWrite: false, depthTest: false, });
            let mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(1.0, 0, 0);
            mesh.rotateZ(-Math.PI/2);
            mesh.userData = { dir: "x" };
            mainMesh.add(mesh);
        }
        mainMesh.position.set(0, 5, 0);
        mainMesh.visible = true;
        return mainMesh;
    };
})();

function calculatePos(selectionMgr: SelectionManager) {
    if (!selectionMgr.selectedBriqs.length)
        return;
    // Reactivity
    store.state.builderData.currentSet.briqs_;
    let avgPos = new THREE.Vector3();
    for (let briq of selectionMgr.selectedBriqs)
    {
        avgPos.x += briq.position![0];
        avgPos.y += briq.position![1];
        avgPos.z += briq.position![2];
    }
    avgPos.divideScalar(selectionMgr.selectedBriqs.length);
    avgPos.addScalar(0.5);
    return avgPos;
}

export class InspectInput extends MouseInputState
{
    gui!: { briq: Briq | undefined, curX: number, curY: number, focusPos: Vector3 | undefined };

    lastClickPos: [number, number, number] | undefined;

    mesh!: THREE.Object3D;

    meshWatcher!: WatchStopHandle;

    _canMove() {
        return featureFlags.briq_select_movement && setsManager.getInfo(store.state.builderData.currentSet.id)?.status !== 'ONCHAIN_LOADED';
    }

    override onEnter()
    {
        this.setGuiData({
            briq: undefined,
            curX: 0,
            curY: 0,
            focusPos: undefined,
        });
        selectionRender.show();

        if (this._canMove())
        {
            this.mesh = getMovementHelperMesh();
            this.mesh.position.set(0, 5, 0);
            inputObjects.add(this.mesh);
        }
        this.meshWatcher = watchEffect(() => {
            let avgPos = calculatePos(this.fsm.store.selectionMgr);
            this.gui.focusPos = avgPos;
            if (!this.mesh)
                return;
            this.mesh.visible = !!avgPos;
            if (avgPos)
                this.mesh.position.set(avgPos.x, avgPos.y, avgPos.z);    
        })

    }

    override onExit() {
        this.meshWatcher();
        this.gui.briq = undefined;
        selectionRender.hide();
        inputObjects.remove(this.mesh);
    }

    override async onFrame() {
        // In view-only mode, the mesh isn't defined, so early-exit.
        if (!this.mesh)
            return;
        let distance = camera.position.distanceTo(this.mesh.position);
        this.mesh.scale.setScalar(Math.max(1, distance / 30.0));
    }

    async onPointerMove(event: PointerEvent)
    {
        this.gui.curX = this.curX;
        this.gui.curY = this.curY;

        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        // If the position is on the ground then there's no cube, and vice-versa.
        if (!pos || pos[1] < 0)
            this.gui.briq = undefined;
        else
            this.gui.briq = (store.state.builderData.currentSet as SetData).getAt(...pos);
    }

    async onPointerDown(event: PointerEvent)
    {
        if (event.shiftKey)
        {
            this.fsm.switchTo("selection_box", { x: event.clientX, y: event.clientY });
            return;
        }
        if (!this.fsm.store.selectionMgr.selectedBriqs.length)
            return;

        if (!this._canMove())
            return;
        let rc = new THREE.Raycaster();
        rc.setFromCamera({ x: (event.clientX / window.innerWidth - 0.5) * 2, y: -(event.clientY / window.innerHeight - 0.5) * 2 }, camera);
        let objects = rc.intersectObject(this.mesh, true);
        if (!objects.length)
            return;

        let avgPos = calculatePos(this.fsm.store.selectionMgr);
        this.fsm.switchTo("drag", { x: event.clientX, y: event.clientY, startPos: avgPos, direction: objects[0].object.userData.dir });
    }

    async onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;

        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (event.button === 2)
        {
            if (!pos || pos[1] < 0)
                this.fsm.store.selectionMgr.clear();
            else
                this.fsm.store.selectionMgr.remove(...pos);
        }
        else
        {
            if (!pos || pos[1] < 0)
                this.fsm.store.selectionMgr.clear();
            else
                this.fsm.store.selectionMgr.add(...pos);
        }
    }
}

export class InspectMultiInput extends MouseInputState
{
    lastClickPos!: [number, number, number];

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;

        this.lastClickPos = this.getIntersectionPos(this.curX, this.curY, true)!;
        if (!this.lastClickPos)
            throw new Error("Error: InspectMultiInput must have a well defined event position on entry");

        this.fsm.orbitControls.enabled = false;

        selectionRender.show();
        getPreviewCube().visible = true;
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(0x002496);
    }

    onExit() {
        getPreviewCube().visible = false;
        this.fsm.orbitControls.enabled = true;
        selectionRender.hide();
    }

    async onPointerMove(event: PointerEvent)
    {
        let pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos)
            return;

        if (this.lastClickPos[1] === -1 && pos[1] === -1)
            pos[1] = 0;

        getPreviewCube().scale.set(Math.abs(this.lastClickPos[0] - pos[0]) + 1.1, Math.abs(this.lastClickPos[1] - pos[1]) + 1.1, Math.abs(this.lastClickPos[2] - pos[2]) + 1.1);
        getPreviewCube().position.set(
            ((this.lastClickPos[0] + pos[0]) / 2) + 0.5,
            ((this.lastClickPos[1] + pos[1]) / 2) + 0.5,
            ((this.lastClickPos[2] + pos[2]) / 2) + 0.5,
        );
    }

    async onPointerUp(event: PointerEvent)
    {
        try
        {
            let pos = this.getIntersectionPos(this.curX, this.curY, true);
            if (!pos)
                return;

            // Make it so that floor-squares have at least one-cell of erasing.
            if (this.lastClickPos[1] === -1 && pos[1] === -1)
                pos[1] = 0;

            let briqs = [];
            for (let x = Math.min(this.lastClickPos[0], pos[0]); x <= Math.max(this.lastClickPos[0], pos[0]); ++x)
                for (let y = Math.min(this.lastClickPos[1], pos[1]); y <= Math.max(this.lastClickPos[1], pos[1]); ++y)
                    for (let z = Math.min(this.lastClickPos[2], pos[2]); z <= Math.max(this.lastClickPos[2], pos[2]); ++z)
                    {
                        let briq = store.state.builderData.currentSet.getAt(x, y, z);
                        if (briq)
                            briqs.push(briq);
                    }
            this.fsm.store.selectionMgr.select(briqs, true);
        } finally {
            this.fsm.switchTo("inspect");
        }
    }
}

export class SelectionBox extends MouseInputState
{
    startX!: number;
    startY!: number;

    onEnter(data: any) {
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
            this.fsm.switchTo("inspect");
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
            this.fsm.switchTo("inspect");
        }
    }
}

export class DragInput extends MouseInputState
{
    startX!: number;
    startY!: number;

    startPos!: THREE.Vector3;

    direction!: string;
    mesh!: THREE.Object3D;

    min!: [number, number, number];
    max!: [number, number, number];

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;
        this.startX = this.curX;
        this.startY = this.curY;

        this.startPos = data.startPos;
        this.direction = data.direction;

        this.mesh = getMovementHelperMesh();
        this.mesh.position.set(this.startPos.x, this.startPos.y, this.startPos.z);
        this.mesh.visible = true;
        // Increase render order to sort out transparecy issues.
        //this.mesh.renderOrder = 2;
        inputObjects.add(this.mesh);

        let briqs = this.fsm.store.selectionMgr.selectedBriqs;
        this.min = briqs[0].position!.slice();
        this.max = briqs[0].position!.slice();
        for (let i = 1; i < briqs.length; ++i)
        {
            if (briqs[i].position![0] > this.max[0]) this.max[0] = briqs[i].position![0];
            if (briqs[i].position![0] < this.min[0]) this.min[0] = briqs[i].position![0];
            if (briqs[i].position![1] > this.max[1]) this.max[1] = briqs[i].position![1];
            if (briqs[i].position![1] < this.min[1]) this.min[1] = briqs[i].position![1];
            if (briqs[i].position![2] > this.max[2]) this.max[2] = briqs[i].position![2];
            if (briqs[i].position![2] < this.min[2]) this.min[2] = briqs[i].position![2];
        }

        selectionRender.show();
        this.fsm.orbitControls.enabled = false;
        document.body.style.cursor = 'grab';
    }

    onExit() {
        selectionRender.hide();
        selectionRender.parent.position.set(0, 0, 0);
        document.body.style.cursor = "auto";
        this.fsm.orbitControls.enabled = true;
        inputObjects.remove(this.mesh);
    }

    _getDelta(event: PointerEvent)
    {
        let plane = new THREE.Plane(this.direction === "y" ? new THREE.Vector3(camera.position.x - this.startPos.x, 0, camera.position.z - this.startPos.z) : new THREE.Vector3(0, 1, 0),
        this.direction === "y" ? 0 : -this.startPos.y);

        if (this.direction === "y")
            plane.constant = -plane.distanceToPoint(this.startPos);

        let rc = new THREE.Raycaster();
        rc.setFromCamera({ x: (event.clientX / window.innerWidth - 0.5) * 2, y: -(event.clientY / window.innerHeight - 0.5) * 2 }, camera);
        var intersects = new THREE.Vector3();
        rc.ray.intersectPlane(plane, intersects);
        let t = { [this.direction]: 1};
        let ray = new THREE.Ray(
            new THREE.Vector3(
                (t?.x ?? 0) * -100000 + this.startPos.x,
                (t?.y ?? 0) * -100000 + this.startPos.y,
                (t?.z ?? 0) * -100000 + this.startPos.z
            ),
            new THREE.Vector3(t?.x ?? 0, t?.y ?? 0, t?.z ?? 0)
        );
        ray.closestPointToPoint(intersects, intersects);

        return intersects;
    }

    _specialClamp(res: THREE.Vector3) {
        let x = (this.max[0] - this.min[0] + 1) / 2;
        let y = (this.max[1] - this.min[1] + 1) / 2;
        let z = (this.max[2] - this.min[2] + 1) / 2;
        let canvasSize = this.canvasSize();
        res.x = res.x < -canvasSize + x ? -canvasSize + x : (res.x >= canvasSize - x ? +canvasSize - x : res.x);
        res.z = res.z < -canvasSize + z ? -canvasSize + z : (res.z >= canvasSize - z ? +canvasSize - z : res.z);
        res.y = res.y < y ? y : res.y;
        return res;
    }

    async onPointerMove(event: PointerEvent)
    {
        let intersects = this._getDelta(event);
        this._specialClamp(intersects);
        let res = new THREE.Vector3().subVectors(this.startPos, intersects);
        this.mesh.position.set(intersects.x, intersects.y, intersects.z);
        res.round();
        selectionRender.parent.position.set(-res.x, -res.y, -res.z);
    }

    async onPointerUp(event: PointerEvent)
    {
        try
        {
            let intersects = this._getDelta(event);
            this._specialClamp(intersects);
            let res = new THREE.Vector3().subVectors(this.startPos, intersects);
            res.round();
            await store.dispatch("builderData/move_briqs", { delta: { [this.direction]: -res?.[this.direction] }, briqs: this.fsm.store.selectionMgr.selectedBriqs })
        } catch(err) {
            pushMessage(err);
        } finally {
            this.fsm.switchTo("inspect");
        }
    }
}
