import { MouseInputState } from './BuilderInputState';
import type { SetData } from '@/builder/SetData';
import type { Briq } from '@/builder/Briq';
import { selectionRender } from '../Selection';
import getPreviewCube from '@/builder/graphics/PreviewCube';
import { THREE, BufferGeometryUtils } from '@/three';

import { camera, overlayObjects } from '../../graphics/Builder';

import { featureFlags } from '@/FeatureFlags';
import { pushMessage } from '@/Messages';
import { setsManager } from '@/builder/SetsManager';
import type { HotkeyHandle } from '@/Hotkeys';

import { watchEffect, WatchStopHandle } from 'vue';
import { BoxSelection, VoxelAlignedSelection } from './SelectHelpers';
import { inputStore } from '../InputStore';
import { useSetHelpers } from '@/components/builder/SetComposable';
import { builderStore } from '@/builder/BuilderStore';
import { canCopyPaste } from './CopyPaste';
import { builderHistory } from '@/builder/BuilderHistory';
import { MoveBriqs, RotateBriqs } from '@/builder/BuilderActions';

const { openSetInBuilder } = useSetHelpers();

const { currentSet } = builderStore;

const getRotationHelperMesh = (() => {
    let mainMesh: THREE.Object3D;
    return () => {
        if (mainMesh)
            return mainMesh;
        mainMesh = new THREE.Object3D();
        const RO = 2;
        // Marked transparent for sorting.x
        mainMesh.renderOrder = RO;

        const cone = new THREE.TorusGeometry(4.0, 0.2, 6, 20);
        //cone.translate(0, 1.5, 0);
        const geometry = cone;

        const RED = new THREE.Color(0x962400).convertSRGBToLinear();
        const GREEN = new THREE.Color(0x009624).convertSRGBToLinear();
        const BLUE = new THREE.Color(0x002496).convertSRGBToLinear();

        {
            const material = new THREE.MeshPhongMaterial({ color: BLUE, opacity: 0.9, transparent: true });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.rotateX(Math.PI / 2);
            //mesh.position.set(0, 1.0, 0.5);
            mesh.userData = { dir: 'y' };
            mainMesh.add(mesh);
        }
        {
            const material = new THREE.MeshPhongMaterial({ color: RED, opacity: 0.9, transparent: true });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            //mesh.position.set(0, 0.5, 1.0);
            //mesh.rotateX(Math.PI/2);
            mesh.userData = { dir: 'z' };
            mainMesh.add(mesh);
        }
        {
            const material = new THREE.MeshPhongMaterial({ color: GREEN, opacity: 0.9, transparent: true });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            //mesh.position.set(1.0, 0.5, 0.5);
            mesh.rotateY(-Math.PI / 2);
            mesh.userData = { dir: 'x' };
            mainMesh.add(mesh);
        }
        mainMesh.position.set(0, 5, 0);
        mainMesh.visible = true;
        return mainMesh;
    };
})();

const getMovementHelperMesh = (() => {
    let mainMesh: THREE.Object3D;
    return () => {
        if (mainMesh)
            return mainMesh;
        mainMesh = new THREE.Object3D();
        const RO = 2;
        // Marked transparent for sorting.x
        mainMesh.renderOrder = RO;

        const cone = new THREE.ConeGeometry(0.4, 1.0);
        cone.translate(0, 1.5, 0);
        const geometry = BufferGeometryUtils.mergeBufferGeometries([new THREE.BoxGeometry(0.2, 2, 0.2), cone]);

        const RED = new THREE.Color(0x962400).convertSRGBToLinear();
        const GREEN = new THREE.Color(0x009624).convertSRGBToLinear();
        const BLUE = new THREE.Color(0x002496).convertSRGBToLinear();

        {
            const material = new THREE.MeshPhongMaterial({ color: BLUE, opacity: 0.9, transparent: true });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(0, 1.0, 0);
            mesh.userData = { dir: 'y' };
            mainMesh.add(mesh);
        }
        {
            const material = new THREE.MeshPhongMaterial({ color: RED, opacity: 0.9, transparent: true });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(0, 0, 1.0);
            mesh.rotateX(Math.PI / 2);
            mesh.userData = { dir: 'z' };
            mainMesh.add(mesh);
        }
        {
            const material = new THREE.MeshPhongMaterial({ color: GREEN, opacity: 0.9, transparent: true });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = RO;
            mesh.position.set(1.0, 0, 0);
            mesh.rotateZ(-Math.PI / 2);
            mesh.userData = { dir: 'x' };
            mainMesh.add(mesh);
        }
        mainMesh.position.set(0, 5, 0);
        mainMesh.visible = true;
        return mainMesh;
    };
})();

export class InspectInput extends MouseInputState {
    declare gui: { briq: Briq | undefined; curX: number; curY: number; focusPos: THREE.Vector3 | undefined };

    lastClickPos: [number, number, number] | undefined;

    mesh!: THREE.Object3D;
    otherMesh!: THREE.Object3D;

    copyHotkey!: HotkeyHandle;
    pasteHotkey!: HotkeyHandle;
    newHotkey!: HotkeyHandle;

    meshWatcher!: WatchStopHandle;

    _canMove() {
        return (
            inputStore.showMoveGizmo &&
            setsManager.getInfo(currentSet.value.id)?.status !== 'ONCHAIN_LOADED'
        );
    }

    _canRotate() {
        return (
            inputStore.showRotateGizmo &&
            setsManager.getInfo(currentSet.value.id)?.status !== 'ONCHAIN_LOADED'
        );
    }

    _canCopyPaste() {
        return canCopyPaste(this.fsm);
    }

    override onEnter() {
        this.setGuiData({
            briq: undefined,
            curX: 0,
            curY: 0,
            focusPos: undefined,
        });
        selectionRender.show();

        // Register the movement gizmo on the scene.
        this.mesh = getMovementHelperMesh();
        this.mesh.visible = this._canMove();
        this.otherMesh = getRotationHelperMesh();
        this.otherMesh.visible = this._canRotate();
        overlayObjects.add(this.mesh);
        overlayObjects.add(this.otherMesh);

        // Update the movement gizmo when needed.
        this.meshWatcher = watchEffect(() => {
            // Reactivity trigger so that getCenterPos gets recomputed properly.
            currentSet.value.briqs_;
            const avgPos = this.fsm.store.selectionMgr.getCenterPos();
            this.gui.focusPos = avgPos;
            this.mesh.visible = !!avgPos && this._canMove();
            this.otherMesh.visible = !!avgPos && this._canRotate();
            if (avgPos) {
                this.mesh.position.set(avgPos.x, avgPos.y, avgPos.z);
                this.otherMesh.position.set(avgPos.x, avgPos.y, avgPos.z);
            }
        });

        this.fsm.hotkeyMgr.register('copy', { code: 'KeyC', ctrl: true, onDown: true });
        this.copyHotkey = this.fsm.hotkeyMgr.subscribe('copy', () =>
            this._canCopyPaste() ? this.fsm.switchTo('copy') : null,
        );
        // See also MenuBuilder's shortcut.
        this.fsm.hotkeyMgr.register('paste', { code: 'KeyV', ctrl: true, onDown: true });
        this.pasteHotkey = this.fsm.hotkeyMgr.subscribe('paste', () =>
            this._canCopyPaste() ? this.fsm.switchTo('copy_paste') : null,
        );

        this.fsm.hotkeyMgr.register('new', { code: 'KeyN', ctrl: true, onDown: true });
        this.newHotkey = this.fsm.hotkeyMgr.subscribe('new', () =>
            this.createNewSetWithSelection(),
        );
    }

    override onExit() {
        // Drop the watcher.
        this.meshWatcher();
        this.gui.briq = undefined;
        selectionRender.hide();
        overlayObjects.remove(this.mesh);
        overlayObjects.remove(this.otherMesh);
        this.fsm.hotkeyMgr.unsubscribe(this.copyHotkey);
        this.fsm.hotkeyMgr.unsubscribe(this.pasteHotkey);
        this.fsm.hotkeyMgr.unsubscribe(this.newHotkey);
    }

    override async onFrame() {
        let distance = camera.position.distanceTo(this.mesh.position);
        distance *= camera.fov / 45;
        this.mesh.scale.setScalar(Math.max(1, distance / 30.0));
        this.otherMesh.scale.setScalar(Math.max(1, distance / 30.0));
    }

    async onPointerMove(event: PointerEvent) {
        this.gui.curX = this.curX;
        this.gui.curY = this.curY;

        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        // If the position is on the ground then there's no cube, and vice-versa.
        if (!pos || pos[1] < 0)
            this.gui.briq = undefined;
        else
            this.gui.briq = (currentSet.value as SetData).getAt(...pos);

        if (this._canMove() || this._canRotate()) {
            const rc = new THREE.Raycaster();
            rc.setFromCamera(
                {
                    x: (event.clientX / window.innerWidth - 0.5) * 2,
                    y: -(event.clientY / window.innerHeight - 0.5) * 2,
                },
                camera,
            );
            const avgPos = this.fsm.store.selectionMgr.getCenterPos();
            let objects = rc.intersectObject(this.mesh, true);
            if (objects.length && this.mesh.visible)
                document.body.style.cursor = 'grab';
            else {
                objects = rc.intersectObject(this.otherMesh, true);
                if (objects.length && this.otherMesh.visible)
                    document.body.style.cursor = 'grab';
                else
                    document.body.style.cursor = 'auto';
            }
        } else
            document.body.style.cursor = 'auto';

    }

    async onPointerDown(event: PointerEvent) {
        if (this._canMove() || this._canRotate()) {
            const rc = new THREE.Raycaster();
            rc.setFromCamera(
                {
                    x: (event.clientX / window.innerWidth - 0.5) * 2,
                    y: -(event.clientY / window.innerHeight - 0.5) * 2,
                },
                camera,
            );
            const avgPos = this.fsm.store.selectionMgr.getCenterPos();
            let objects = rc.intersectObject(this.mesh, true);
            if (objects.length && this.mesh.visible) {
                this.fsm.switchTo('drag', {
                    x: event.clientX,
                    y: event.clientY,
                    startPos: avgPos,
                    direction: objects[0].object.userData.dir,
                });
                return;
            }
            objects = rc.intersectObject(this.otherMesh, true);
            if (objects.length && this.otherMesh.visible) {
                this.fsm.switchTo('rotate', {
                    x: event.clientX,
                    y: event.clientY,
                    startPos: avgPos,
                    direction: objects[0].object.userData.dir,
                });
                return;
            }
        }

        if (event.altKey || event.shiftKey) {
            const mode =
                this.fsm.store.defaultSelectionMethod === 'BOX'
                    ? event.altKey
                        ? 'inspect_va'
                        : 'inspect_box'
                    : event.altKey
                        ? 'inspect_box'
                        : 'inspect_va';
            this.fsm.switchTo(mode, { switchBackTo: 'inspect', x: event.clientX, y: event.clientY });
            return;
        }
        // If we're over a briq
        if (this.gui.briq && event.button === 0)
            this.fsm.switchTo('inspect_spray', { x: event.clientX, y: event.clientY });
    }

    async onPointerUp(event: PointerEvent) {
        const mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;

        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (event.button === 2)
            if (!pos || pos[1] < 0)
                this.fsm.store.selectionMgr.clear();
            else
                this.fsm.store.selectionMgr.remove(...pos);
        else
        if (!pos || pos[1] < 0)
            this.fsm.store.selectionMgr.clear();
        else
            this.fsm.store.selectionMgr.add(...pos);
    }

    createNewSetWithSelection() {
        const newSet = setsManager.createLocalSet();
        for (const briq of this.fsm.store.selectionMgr.selectedBriqs)
            newSet.placeBriq(...briq.position, briq);
        openSetInBuilder(newSet.id, true);
    }
}

export class InspectOnlyInput extends InspectInput {
    _canMove() {
        return false;
    }
    _canRotate() {
        return false;
    }
    _canCopyPaste() {
        return false;
    }
}


export class InspectSprayInput extends MouseInputState {
    onEnter() {
        this.fsm.orbitControls.enabled = false;
        this.fsm.store.grabFocus = true;
        document.body.style.cursor = 'cell';
        selectionRender.show();
        this.onPointerMove();
    }

    onExit() {
        this.fsm.orbitControls.enabled = true;
        this.fsm.store.grabFocus = false;
        document.body.style.cursor = 'auto';
        selectionRender.hide();
    }

    async onPointerMove(event: PointerEvent) {
        const pos = this.getIntersectionPos(this.curX, this.curY, true);
        if (!pos || pos[1] < 0)
            return;

        this.fsm.store.selectionMgr.add(...pos);
    }

    async onPointerUp(_: unknown) {
        this.fsm.switchTo('inspect');
    }
}


export class BoxSelect extends BoxSelection {
    onEnter(data: any) {
        super.onEnter(data);
        this.switchBackTo = 'inspect';
        selectionRender.show();
    }

    onExit() {
        super.onExit();
        selectionRender.hide();
    }

    async doAction(briqs: Briq[]) {
        this.fsm.store.selectionMgr.select(briqs, true);
    }
}

export class VASelect extends VoxelAlignedSelection {
    onEnter(data: any) {
        super.onEnter(data);
        this.switchBackTo = 'inspect';
        (getPreviewCube().material as THREE.MeshPhongMaterial).color = new THREE.Color(0x002496);
        selectionRender.show();
    }

    onExit() {
        super.onExit();
        selectionRender.hide();
    }

    async doAction(pos: [number, number, number]) {
        const briqs = [];
        for (let x = Math.min(this.initialClickPos[0], pos[0]); x <= Math.max(this.initialClickPos[0], pos[0]); ++x)
            for (let y = Math.min(this.initialClickPos[1], pos[1]); y <= Math.max(this.initialClickPos[1], pos[1]); ++y)
                for (
                    let z = Math.min(this.initialClickPos[2], pos[2]);
                    z <= Math.max(this.initialClickPos[2], pos[2]);
                    ++z
                ) {
                    const briq = currentSet.value.getAt(x, y, z);
                    if (briq)
                        briqs.push(briq);
                }
        this.fsm.store.selectionMgr.select(briqs, true);
    }
}

export class DragInput extends MouseInputState {
    startX!: number;
    startY!: number;

    startPos!: THREE.Vector3;
    initialOffset!: THREE.Vector3;

    direction!: string;
    mesh!: THREE.Object3D;

    min!: [number, number, number];
    max!: [number, number, number];

    ColorOK = new THREE.Color(0x002496);
    ColorOverlay = new THREE.Color(0xffaa000);

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;
        this.startX = this.curX;
        this.startY = this.curY;

        this.startPos = data.startPos;
        this.direction = data.direction;

        // The click may not be at the startPos origin, so we need to account for that offset.
        this.initialOffset = this._getDelta({ clientX: this.curX, clientY: this.curY } as unknown as PointerEvent).sub(
            this.startPos,
        );

        this.mesh = getMovementHelperMesh();
        this.mesh.position.set(this.startPos.x, this.startPos.y, this.startPos.z);
        this.mesh.visible = true;
        overlayObjects.add(this.mesh);

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

        selectionRender.show();
        this.fsm.orbitControls.enabled = false;
        document.body.style.cursor = 'grab';
    }

    onExit() {
        selectionRender.hide();
        selectionRender.parent.position.set(0, 0, 0);
        document.body.style.cursor = 'auto';
        this.fsm.orbitControls.enabled = true;
        overlayObjects.remove(this.mesh);
    }

    _getDelta(event: PointerEvent) {
        const plane = new THREE.Plane(
            this.direction === 'y'
                ? new THREE.Vector3(camera.position.x - this.startPos.x, 0, camera.position.z - this.startPos.z)
                : new THREE.Vector3(0, 1, 0),
            this.direction === 'y' ? 0 : -this.startPos.y,
        );

        if (this.direction === 'y')
            plane.constant = -plane.distanceToPoint(this.startPos);

        const rc = new THREE.Raycaster();
        rc.setFromCamera(
            { x: (event.clientX / window.innerWidth - 0.5) * 2, y: -(event.clientY / window.innerHeight - 0.5) * 2 },
            camera,
        );
        const intersects = new THREE.Vector3();
        rc.ray.intersectPlane(plane, intersects);
        const t = { [this.direction]: 1 };
        const ray = new THREE.Ray(
            new THREE.Vector3(
                (t?.x ?? 0) * -100000 + this.startPos.x,
                (t?.y ?? 0) * -100000 + this.startPos.y,
                (t?.z ?? 0) * -100000 + this.startPos.z,
            ),
            new THREE.Vector3(t?.x ?? 0, t?.y ?? 0, t?.z ?? 0),
        );
        ray.closestPointToPoint(intersects, intersects);

        return intersects;
    }

    _specialClamp(res: THREE.Vector3) {
        const x0 = this.startPos.x - this.min[0];
        const y0 = this.startPos.y - this.min[1];
        const z0 = this.startPos.z - this.min[2];
        const x1 = this.max[0] - this.startPos.x + 1;
        const z1 = this.max[2] - this.startPos.z + 1;
        const canvasSize = this.canvasSize();
        res.x = res.x < -canvasSize + x0 ? -canvasSize + x0 : res.x >= canvasSize - x1 ? +canvasSize - x1 : res.x;
        res.z = res.z < -canvasSize + z0 ? -canvasSize + z0 : res.z >= canvasSize - z1 ? +canvasSize - z1 : res.z;
        res.y = res.y < y0 ? y0 : res.y;
        return res;
    }

    async onPointerMove(event: PointerEvent) {
        const intersects = this._getDelta(event);
        intersects.sub(this.initialOffset);
        this._specialClamp(intersects);
        const res = new THREE.Vector3().subVectors(this.startPos, intersects);
        this.mesh.position.set(intersects.x, intersects.y, intersects.z);
        res.round();
        selectionRender.parent.position.set(-res.x, -res.y, -res.z);

        // Color the mesh if there is an overlay.
        let overlay = true;
        for (const briq of this.fsm.store.selectionMgr.selectedBriqs) {
            const bp = [
                Math.round(-res.x + briq.position![0]),
                Math.round(-res.y + briq.position![1]),
                Math.round(-res.z + briq.position![2]),
            ];
            if (currentSet.value.getAt(...bp)) {
                overlay = false;
                break;
            }
        }
        selectionRender.parent.children[0].material.color = overlay ? this.ColorOK : this.ColorOverlay;
    }

    async onPointerUp(event: PointerEvent) {
        try {
            const intersects = this._getDelta(event);
            intersects.sub(this.initialOffset);
            this._specialClamp(intersects);
            const res = new THREE.Vector3().subVectors(this.startPos, intersects);
            res.round();
            builderHistory.push_command(MoveBriqs, {
                delta: { [this.direction]: -res?.[this.direction] },
                briqs: this.fsm.store.selectionMgr.selectedBriqs,
                allow_overwrite: this.fsm.store.briqOverlayMode === 'OVERWRITE',
            });
            builderHistory.push_checkpoint();
        } catch (err) {
            console.error(err);
            pushMessage(err);
        } finally {
            this.fsm.switchTo('inspect');
        }
    }
}

export class RotateInput extends MouseInputState {
    startX!: number;
    startY!: number;

    startPos!: THREE.Vector3;
    initialOffset!: THREE.Vector3;

    direction!: 'x' | 'y' | 'z';
    mesh!: THREE.Object3D;

    min!: [number, number, number];
    max!: [number, number, number];

    ColorOK = new THREE.Color(0x002496);
    ColorNOK = new THREE.Color(0xff0000);
    ColorOverlay = new THREE.Color(0xffaa000);

    onEnter(data: any) {
        this.curX = data.x;
        this.curY = data.y;
        this.startX = this.curX;
        this.startY = this.curY;

        this.startPos = data.startPos;
        this.direction = data.direction;

        // The click may not be at the startPos origin, so we need to account for that offset.
        this.initialOffset = this._getDelta({ clientX: this.curX, clientY: this.curY } as unknown as PointerEvent).sub(
            this.startPos,
        );

        this.mesh = getRotationHelperMesh();
        this.mesh.position.set(this.startPos.x, this.startPos.y, this.startPos.z);
        this.mesh.visible = true;
        overlayObjects.add(this.mesh);

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

        selectionRender.show();
        this.fsm.orbitControls.enabled = false;
        document.body.style.cursor = 'grab';
    }

    onExit() {
        selectionRender.hide();
        selectionRender.parent.position.set(0, 0, 0);
        selectionRender.parent.children[0].position.set(0, 0, 0);
        selectionRender.parent.children[0].rotation.set(0, 0, 0);
        selectionRender.parent.children[0].material.color = this.ColorOK;
        document.body.style.cursor = 'auto';
        this.fsm.orbitControls.enabled = true;
        overlayObjects.remove(this.mesh);
    }

    _getDelta(event: PointerEvent) {
        const plane = new THREE.Plane(
            new THREE.Vector3(this.direction === 'x', this.direction === 'y', this.direction === 'z'),
            -this.startPos[this.direction],
        );
        const rc = new THREE.Raycaster();
        rc.setFromCamera(
            { x: (event.clientX / window.innerWidth - 0.5) * 2, y: -(event.clientY / window.innerHeight - 0.5) * 2 },
            camera,
        );
        let intersects = new THREE.Vector3();
        if (!rc.ray.intersectPlane(plane, intersects)) {
            // Depending on viewpoints, the user can aim off-place. In that case, assume the closest point to a rather faraway point in that direction.
            rc.ray.at(10000, intersects);
            const res = new THREE.Vector3();
            plane.projectPoint(intersects, res);
            intersects = res;
        }
        return intersects;
    }

    _specialClamp(res: THREE.Vector3) {
        const x0 = this.startPos.x - this.min[0];
        const y0 = this.startPos.y - this.min[1];
        const z0 = this.startPos.z - this.min[2];
        const x1 = this.max[0] - this.startPos.x + 1;
        const z1 = this.max[2] - this.startPos.z + 1;
        const canvasSize = this.canvasSize();
        res.x = res.x < -canvasSize + x0 ? -canvasSize + x0 : res.x >= canvasSize - x1 ? +canvasSize - x1 : res.x;
        res.z = res.z < -canvasSize + z0 ? -canvasSize + z0 : res.z >= canvasSize - z1 ? +canvasSize - z1 : res.z;
        res.y = res.y < y0 ? y0 : res.y;
        return res;
    }

    /* Straight from SO 'cause I can't geometry */
    rotateAboutPoint(
        obj: THREE.Object3D,
        point: THREE.Vector3,
        axis: THREE.Vector3,
        theta: number,
        pointIsWorld: boolean,
    ) {
        pointIsWorld = pointIsWorld === undefined ? false : pointIsWorld;

        if (pointIsWorld)
obj.parent!.localToWorld(obj.position); // compensate for world coordinate

        obj.position.sub(point); // remove the offset
        obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
        obj.position.add(point); // re-add the offset

        if (pointIsWorld)
obj.parent!.worldToLocal(obj.position); // undo world coordinates compensation

        obj.rotateOnAxis(axis, theta); // rotate the OBJECT
    }

    roundAngle(angle: number) {
        const ninetyR = (Math.round((angle * 2) / Math.PI) * Math.PI) / 2;
        if (Math.abs(angle) > Math.PI / 8 && Math.abs(angle - ninetyR) < Math.PI / 8)
            return [ninetyR, true];
        return [angle, false];
    }

    async onPointerMove(event: PointerEvent) {
        const intersects = this._getDelta(event).sub(this.startPos);
        // Get the signed angle (from SO)
        const crossP = this.initialOffset.clone().cross(intersects);
        const rawAngle = Math.atan2(
            crossP.dot(new THREE.Vector3(this.direction === 'x', this.direction === 'y', this.direction === 'z')),
            intersects.dot(this.initialOffset),
        );
        const [angle, isGoodAngle] = event.shiftKey ? [rawAngle, true] : this.roundAngle(rawAngle);

        selectionRender.parent.children[0].position.set(0, 0, 0);
        selectionRender.parent.children[0].rotation.set(0, 0, 0);
        this.rotateAboutPoint(
            selectionRender.parent.children[0],
            this.startPos,
            new THREE.Vector3(this.direction === 'x', this.direction === 'y', this.direction === 'z'),
            angle,
            true,
        );

        // Color the mesh if there is an OOB.
        const rot = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(this.direction === 'x', this.direction === 'y', this.direction === 'z'),
            angle,
        );
        let inBound = true;
        if (!event.shiftKey && !isGoodAngle)
            inBound = false;
        else {
            const v = new THREE.Vector3();
            for (const briq of this.fsm.store.selectionMgr.selectedBriqs) {
                v.x = briq.position![0];
                v.y = briq.position![1];
                v.z = briq.position![2];
                v.sub(this.startPos);
                v.applyQuaternion(rot);
                v.add(this.startPos);
                if (inBound && !this.isWithinBounds(Math.round(v.x), Math.round(v.y), Math.round(v.z)))
                    inBound = false;
            }
        }
        selectionRender.parent.children[0].material.color = inBound ? this.ColorOK : this.ColorNOK;
    }

    async onPointerUp(event: PointerEvent) {
        try {
            const intersects = this._getDelta(event).sub(this.startPos);
            // Get the signed angle (from SO)
            const crossP = this.initialOffset.clone().cross(intersects);
            const rawAngle = Math.atan2(
                crossP.dot(new THREE.Vector3(this.direction === 'x', this.direction === 'y', this.direction === 'z')),
                intersects.dot(this.initialOffset),
            );
            const [angle, isGoodAngle] = event.shiftKey ? [rawAngle, true] : this.roundAngle(rawAngle);
            if (!isGoodAngle) {
                this.fsm.switchTo('inspect');
                return;
            }
            builderHistory.push_command(RotateBriqs, {
                axis: this.direction,
                angle: angle as number,
                rotationCenter: this.startPos,
                briqs: this.fsm.store.selectionMgr.selectedBriqs,
                allow_overwrite: this.fsm.store.briqOverlayMode === 'OVERWRITE',
            });
            builderHistory.push_checkpoint();
        } catch (err) {
            console.error(err);
            pushMessage(err);
        } finally {
            this.fsm.switchTo('inspect');
        }
    }
}
