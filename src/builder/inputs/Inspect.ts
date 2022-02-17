import { MouseInputState } from './BuilderInputState';
import { store } from '../../store/Store'
import type { SetData } from '../SetData'
import type { Briq } from '../Briq.js';
import { selectionRender } from './Selection';
import getPreviewCube from '../graphics/PreviewCube'
import { THREE } from '../../three';

import { camera, inputObjects } from '../graphics/Builder';

import { featureFlags } from "../../FeatureFlags";
import { Vector3 } from 'three';
import { number } from 'starknet';
import { pushMessage } from '../../Messages';

var getMovementHelperMesh = (() => {
    let mainMesh: THREE.Object3D;
    return () => {
        if (mainMesh)
            return mainMesh;
        mainMesh = new THREE.Object3D();
        const RO = 2;
        // Marked transparent for sorting.
        mainMesh.renderOrder = RO;
        {
            let geometry =  new THREE.BoxGeometry(0.2, 2, 0.2);
            let material = new THREE.MeshPhongMaterial( { color: 0x002496, opacity: 0.9, transparent: true, depthWrite: false, depthTest: false, });
            let mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(0, 1.0, 0);
            mesh.userData = { dir: "y" };
            mainMesh.add(mesh);
        }
        {
            let geometry =  new THREE.BoxGeometry(0.2, 0.2, 2);
            let material = new THREE.MeshPhongMaterial( { color: 0x962400, opacity: 0.9, transparent: true, depthWrite: false, depthTest: false, });
            let mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(0, 0, 1.0);
            mesh.userData = { dir: "z" };
            mainMesh.add(mesh);
        }
        {
            let geometry =  new THREE.BoxGeometry(2, 0.2, 0.2);
            let material = new THREE.MeshPhongMaterial( { color: 0x009624, opacity: 0.9, transparent: true, depthWrite: false, depthTest: false, });
            let mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(1.0, 0, 0);
            mesh.userData = { dir: "x" };
            mainMesh.add(mesh);
        }
        mainMesh.position.set(0, 5, 0);
        mainMesh.visible = true;
        return mainMesh;
    };
})();

export class InspectInput extends MouseInputState
{
    gui!: { briq: Briq | undefined, curX: number, curY: number };

    lastClickPos: [number, number, number] | undefined;

    mesh!: THREE.Object3D;

    override onEnter()
    {
        this.setGuiData({
            briq: undefined,
            curX: 0,
            curY: 0,
        });
        selectionRender.show();

        if (featureFlags.briq_select_movement)
        {
            this.mesh = getMovementHelperMesh();
            this.mesh.position.set(0, 5, 0);
            let avgPos = this._calculatePos();
            this.mesh.visible = !!avgPos;
            if (avgPos)
                this.mesh.position.set(avgPos.x, avgPos.y, avgPos.z);

            inputObjects.add(this.mesh);
        }
    }

    override onExit() {
        this.gui.briq = undefined;
        selectionRender.hide();
        inputObjects.remove(this.mesh);
    }

    _calculatePos() {
        if (!this.fsm.store.selectionMgr.selectedBriqs.length)
            return
        let avgPos = new THREE.Vector3();
        for (let briq of this.fsm.store.selectionMgr.selectedBriqs)
        {
            avgPos.x += briq.position![0];
            avgPos.y += briq.position![1];
            avgPos.z += briq.position![2];
        }
        avgPos.divideScalar(this.fsm.store.selectionMgr.selectedBriqs.length);
        avgPos.addScalar(0.5);
        return avgPos;
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
            this.fsm.switchTo("inspect_multi", { x: event.clientX, y: event.clientY });
            return;
        }
        if (!this.fsm.store.selectionMgr.selectedBriqs.length)
            return;

        if (!featureFlags.briq_select_movement)
            return;
        let rc = new THREE.Raycaster();
        rc.setFromCamera({ x: (event.clientX / window.innerWidth - 0.5) * 2, y: -(event.clientY / window.innerHeight - 0.5) * 2 }, camera);
        let objects = rc.intersectObject(this.mesh, true);
        if (!objects.length)
            return;

        let avgPos = this._calculatePos();
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
        if (!featureFlags.briq_select_movement)
            return;
        let avgPos = this._calculatePos();
        this.mesh.visible = !!avgPos;
        if (avgPos)
            this.mesh.position.set(avgPos.x, avgPos.y, avgPos.z);
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

        if (featureFlags.briq_select_movement)
        {
            this.mesh = getMovementHelperMesh();
            this.mesh.position.set(this.startPos.x, this.startPos.y, this.startPos.z);
            this.mesh.visible = true;
            // Increase render order to sort out transparecy issues.
            //this.mesh.renderOrder = 2;
            inputObjects.add(this.mesh);
        }
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
    }

    onExit() {
        selectionRender.hide();
        selectionRender.parent.position.set(0, 0, 0);
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

    _clampDelta(res: THREE.Vector3)
    {
        let m1 = [this.min[0] - res.x, this.min[1] - res.y, this.min[2] - res.z];
        let m2 = [this.max[0] - res.x, this.max[1] - res.y, this.max[2] - res.z];
        let mi = this.clampToBounds(...m1);
        let mj = this.clampToBounds(...m2);
        if (m1[0] !== mi[0] || m1[1] !== mi[1] || m1[2] !== mi[2])
        {
            res.x -= mi[0] - m1[0] >= 0 ? mi[0] - m1[0] : mj[0] - m2[0];
            res.y -= mi[1] - m1[1] >= 0 ? mi[1] - m1[1] : mj[1] - m2[1];
            res.z -= mi[2] - m1[2] >= 0 ? mi[2] - m1[2] : mj[2] - m2[2];
        }
        else if (m2[0] !== mj[0] || m2[1] !== mj[1] || m2[2] !== mj[2])
        {
            res.x -= mj[0] - m2[0];
            res.y -= mj[1] - m2[1];
            res.z -= mj[2] - m2[2];
        }
    }

    async onPointerMove(event: PointerEvent)
    {
        let intersects = this._getDelta(event);
        this.mesh.position.set(intersects.x, intersects.y, intersects.z);
        let res = new Vector3().subVectors(this.startPos, intersects);
        res.round();
        this._clampDelta(res);
        selectionRender.parent.position.set(-res.x, -res.y, -res.z);
    }

    async onPointerUp(event: PointerEvent)
    {
        try
        {
            let intersects = this._getDelta(event);
            let res = new Vector3().subVectors(this.startPos, intersects);
            res.round();
            this._clampDelta(res);
            await store.dispatch("builderData/move_briqs", { delta: { [this.direction]: -res?.[this.direction] }, briqs: this.fsm.store.selectionMgr.selectedBriqs })
        } catch(err) {
            pushMessage(err);
        } finally {
            this.fsm.switchTo("inspect");
        }
    }
}
