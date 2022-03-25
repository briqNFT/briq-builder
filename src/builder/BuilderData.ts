import { Briq } from './Briq'
import { SetData } from './SetData';

import { registerUndoableAction } from "./UndoRedo"

import { dispatchBuilderAction } from "./graphics/Dispatch";

import { palettesMgr } from './Palette';

import { hexUuid } from '../Uuid';

import builderSettings from './graphics/Settings';

import { inputStore } from './inputs/InputStore';
import { setsManager } from './SetsManager';
import { ChainBriqs } from './ChainBriqs';

import { store } from '@/store/Store';

import { THREE } from '@/three';
import { builderInputFsm } from './inputs/BuilderInput';

let initSet = new SetData(hexUuid());


function isWithinBounds(x: number, y: number, z: number)
{
    let size = builderSettings.canvasSize;
    return x >= -size && x < size && y >= 0 && z >= -size && z < size;
}

//watch(toRef(builderSettings, "canvasSize"), (nv, ov) => {    
//})

var try_fetching_user_data_func;
export var builderDataStore = (() => {
    return {
        namespaced: true,
        state: () => ({
            currentSet: initSet,
        }),
        actions: {
            ////////////
            //// Local set Management
            ////////////
            select_set({ commit }: any, data: any)
            {
                commit("select_set", data);
                inputStore.selectionMgr.clear();
            },
            update_set({ commit }: any, data: any)
            {
                commit("update_set", data);
                inputStore.selectionMgr.clear();
            },
            
            ////////////
            //// Set commands
            ////////////
            change_set_name({ commit }: any, payload: any)
            {
                commit("change_set_name", payload);
            },
            
            // Hack
            set_canvas_size(_: unknown, payload: { value: number, before: number })
            {
            },

            ////////////
            //// Briq manipulation stuff
            ////////////
            set_briq_color: ({ commit }: any, data: any) => {
                commit("set_briq_color", data);
            },
            clear: ({ commit }: any) => {
                commit("clear");
                inputStore.selectionMgr.clear();
            },
            undo_clear: ({ commit }: any, data: any) => {
                commit("undo_clear", data);
                inputStore.selectionMgr.clear();
            },

            swap_briqs({ commit }: any, data: { chainBriqs: ChainBriqs, swaps: Array<[string, string]>})
            {
                commit("swap_briqs", data);
                inputStore.selectionMgr.clear();
            },

            place_briqs: ({ commit }: any, data: { pos: [number, number, number], color?: string, material?: string }[]) => {
                for (let briqData of data)
                    if (briqData.color && !isWithinBounds(...briqData.pos))
                        throw new Error("cannot");
                commit("place_briqs", data);
            },
        
            async move_briqs({ state, commit, dispatch }: any, data: { delta: { x?: number, y?: number, z?: number }, briqs: Briq[], allow_overwrite: boolean}) {
                for (let briq of data.briqs)
                {
                    let pos = briq.position;
                    if (!isWithinBounds(pos[0] + (data.delta.x || 0), pos[1] + (data.delta.y || 0), pos[2] + (data.delta.z || 0)))
                        throw new Error("cannot, would go out of bounds");
                }
                let moved = [];
                let targets = [];
                let removal = [];
                let add = [];

                let selectAtPos = [];
                for (let briq of data.briqs)
                {
                    let targetPos = [briq.position[0] + (data.delta.x || 0), briq.position[1] + (data.delta.y || 0), briq.position[2] + (data.delta.z || 0)];
                    let targetCell = state.currentSet.getAt(...targetPos);
                    targets.push({ pos: targetPos, color: targetCell?.color, material: targetCell?.material, id: targetCell?.id, allow_overwrite: true });
                    moved.push({ pos: briq.position, color: briq.color, material: briq.material, id: briq.id });
                    
                    removal.push({ pos: briq.position });
                    add.push({ pos: targetPos, color: briq.color, material: briq.material, id: briq.id, allow_overwrite: data.allow_overwrite });
                    // This is kinda un-necessarily slow.
                    if (!targetCell || data.allow_overwrite || data.briqs.find(x => x._uuid == targetCell._uuid))
                        selectAtPos.push(targetPos);
                }
                const _do = () => {
                    inputStore.selectionMgr.clear();
                    commit("place_briqs", removal);
                    commit("place_briqs", add);
                    let br = selectAtPos.map(x => state.currentSet.getAt(...x));
                    inputStore.selectionMgr.select(br);
                };
                _do();
                await store.dispatch("push_command_to_history", {
                    action: "builderData/move_briqs",
                    undo: () => {
                        commit("place_briqs", moved);
                        commit("place_briqs", targets);
                    },
                    redo: () => {
                        _do();
                    },
                });
                inputStore.selectionMgr.updateGraphics();
            },

            async rotate_briqs({ state, commit, dispatch }: any, data: { axis: 'x' | 'y' | 'z', angle: number, rotationCenter: THREE.Vector3, briqs: Briq[], allow_overwrite: boolean}) {
                let targetPos = {};
                let pv = new THREE.Vector3();
                let rot = new THREE.Quaternion();
                rot.setFromAxisAngle(new THREE.Vector3(data.axis === "x", data.axis === "y", data.axis === "z"), data.angle);
                for (let briq of data.briqs)
                {
                    pv.x = briq.position![0] + 0.5;
                    pv.y = briq.position![1] + 0.5;
                    pv.z = briq.position![2] + 0.5;
                    let pos = pv.sub(data.rotationCenter);
                    pos.applyQuaternion(rot);
                    pos.add(data.rotationCenter);
                    pos.x -= 0.5;
                    pos.y -= 0.5;
                    pos.z -= 0.5;

                    // TODO: this can lead to duplicates or 'holes' in the target.
                    // NB: because of numerical instability and rounding, we do a first pass of rounding.
                    targetPos[briq._uuid] = { pos: pos.clone().multiplyScalar(2).round().divideScalar(2).round(), color: briq.color, material: briq.material, id: briq.id, };
                    if (!isWithinBounds(targetPos[briq._uuid].pos.x, targetPos[briq._uuid].pos.y, targetPos[briq._uuid].pos.z))
                        throw new Error("Cannot rotate, briqs would go out-of-bounds");
                    targetPos[briq._uuid].pos = [targetPos[briq._uuid].pos.x, targetPos[briq._uuid].pos.y, targetPos[briq._uuid].pos.z];
                }

                let replacedBriqs = {} as { [key: string]: any };
                for (let uid in targetPos)
                {
                    let briq = state.currentSet.getAt(...targetPos[uid].pos);
                    // Ignore briqs that are part of the movement.
                    if (briq && !targetPos[briq._uuid] && data.allow_overwrite)
                        replacedBriqs[briq._uuid] = { pos: briq.position, color: briq.color, material: briq.material, id: briq.id };
                    else if (briq && !targetPos[briq._uuid] && !data.allow_overwrite)
                        targetPos[uid] = undefined;
                }
                
                let originalBriqs = [];
                for (let briq of data.briqs)
                    originalBriqs.push({ pos: briq.position, color: briq.color, material: briq.material, id: briq.id })

                const _do = function() {
                    // Remove OG briqs
                    let b = originalBriqs;
                    commit("place_briqs", b.map(x => ({ pos: x.pos })))

                    // Place new briqs.
                    b = [];
                    for (let uid in targetPos)
                        if (targetPos[uid])
                            b.push({ pos: targetPos[uid].pos, color: targetPos[uid].color, material: targetPos[uid].material, id: targetPos[uid].id, allow_overwrite: data.allow_overwrite })
                    commit("place_briqs", b)

                    let br = [];
                    for (let uid in targetPos)
                        if (targetPos[uid])
                            br.push(state.currentSet.getAt(...targetPos[uid].pos));
                    inputStore.selectionMgr.select(br);
                    inputStore.selectionMgr.updateGraphics();
                }
                _do();
                await store.dispatch("push_command_to_history", {
                    action: "builderData/rotate_briqs",
                    undo: () => {
                        let b = [];
                        for (let uid in targetPos)
                            if (targetPos[uid])
                                b.push({ pos: targetPos[uid].pos })
                        commit("place_briqs", b)

                        commit("place_briqs", originalBriqs);

                        commit("place_briqs", Object.values(replacedBriqs));

                        let br = originalBriqs.map(x => state.currentSet.getAt(...x.pos));
                        inputStore.selectionMgr.select(br);
                        inputStore.selectionMgr.updateGraphics();
                    },
                    redo: () => {
                        _do();
                    },
                });
            },
        },
        mutations: {
            select_set(state: any, data: string)
            {
                let info = setsManager.getInfo(data)
                let set = info.local;
                if (!set)
                    throw new Error("Could not find local set with ID " + data);
                state.currentSet = set;
                palettesMgr.updateForSet(state.currentSet);
                inputStore.selectionMgr.selectSet(state.currentSet);
                if (info.status === 'ONCHAIN_LOADED')
                    builderInputFsm.switchTo("inspect");
                else
                    builderInputFsm.switchTo("place");
                dispatchBuilderAction("select_set", state.currentSet);
            },
            update_set(state: any, data: any)
            {
                state.currentSet.deserialize(data);
                inputStore.selectionMgr.clear();
                dispatchBuilderAction("select_set", state.currentSet);
            },
            change_set_name(state: any, data: any)
            {
                data.set.name = data.name;
            },
                        
            place_briqs(state: any, data: { pos: [number, number, number], color?: string, material?: string, id?: string, allow_overwrite: boolean }[])
            {
                for (let briqData of data)
                {
                    let cell = state.currentSet.getAt(...briqData.pos);
                    if (cell && briqData.color && !briqData.allow_overwrite)
                        continue;
                    let briq = briqData.color ? new Briq(briqData.material, briqData.color).setNFTid(briqData.id) : undefined;
                    state.currentSet.placeBriq(...briqData.pos, briq);
                }
                //dispatchBuilderAction("place_briqs", grphcs);
                inputStore.selectionMgr.clear();
            },
            move_briqs(state: any, data: { delta: { x?: number, y?: number, z?: number }, briqs: Briq[]}) {
                state.currentSet.moveBriqs(data.delta.x ?? 0, data.delta.y ?? 0, data.delta.z ?? 0, data.briqs);
                dispatchBuilderAction("select_set", state.currentSet);
            },

            set_briq_color(state: any, data: any)
            {
                for (let d of data)
                    state.currentSet.modifyBriq(...d.pos, d);
                //dispatchBuilderAction("place_briqs", data);
            },
            clear: (state: any) => {
                state.currentSet.reset();
                inputStore.selectionMgr.clear();
                dispatchBuilderAction("reset");
            },
            undo_clear: (state: any, data: any) => {
                state.currentSet.reset();
                state.currentSet.deserialize(data);
                inputStore.selectionMgr.clear();
                dispatchBuilderAction("select_set", state.currentSet);
            },

            /*
            swap_briqs(state: any, data: { briqsDB: BriqsDB, swaps: Array<[string, string]>})
            {
                for (let [ogId, newId] of data.swaps)
                {
                    state.currentSet.swapBriq(ogId, data.briqsDB.get(newId));
                    inputStore.selectionMgr.replace(ogId, data.briqsDB.get(newId)!);
                }
                dispatchBuilderAction("select_set", state.currentSet);
            },
            */


            // hack:
            set_canvas_size(state: unknown, data: { value: number, before: number })
            {
                builderSettings.canvasSize = data.value;
            }
        },
        getters: {},
    };
})();

registerUndoableAction("builderData/move_briqs", {}, () => "Move briqs")
registerUndoableAction("builderData/rotate_briqs", {}, () => "Rotate briqs")

registerUndoableAction("builderData/place_briqs", {
    onBefore: ({ transientActionState }: any, payload: { pos: [number, number, number], color?: string, material?: string, id?: string }[], state: any) => {
        transientActionState.cells = [];
        for (let data of payload)
        {
            let cell = (state.builderData.currentSet as SetData).getAt(...data.pos);
            transientActionState.cells.push({ pos: data.pos, color: cell?.color, material: cell?.material, id: cell?.id });
        }
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/place_briqs",
            undo: () => { store.commit("builderData/place_briqs", transientActionState.cells) },
            redo: () => { store.commit("builderData/place_briqs", payload) },
            redoData: payload,
        });
    }
}, (data: any) => !data.redoData[0]?.color ? "Remove briq" : "Place briq");


registerUndoableAction("builderData/set_briq_color", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        let colors = [];
        for (let d of payload)
        {
            let cell = (state.builderData.currentSet as SetData).getAt(...d.pos as [number, number, number]);
            if (cell)
                colors.push(cell.color)    
        }
        transientActionState.colors = colors;
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/set_briq_color",
            undo: () => { store.commit("builderData/set_briq_color", payload.map((x, i) => ({ pos: x.pos, color: transientActionState.colors[i]}))) },
            redo: () => { store.commit("builderData/set_briq_color", payload) },
        });
    }
}, (data: any) => "Change briq color");

registerUndoableAction("builderData/select_set", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        transientActionState.set = state.builderData.currentSet.id;
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/select_set",
            undo: () => { store.commit("builderData/select_set", transientActionState.set) },
            redo: () => { store.commit("builderData/select_set", payload) },
            undoData: transientActionState.set,
        });
    }
}, (data: any) => "Select set #" + data.undoData);

registerUndoableAction("builderData/clear", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        transientActionState.data = state.builderData.currentSet.serialize();
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/clear",
            undo: () => { store.commit("builderData/undo_clear", transientActionState.data) },
            redo: () => { store.commit("builderData/clear", payload) },
        });
    }
}, (data: any) => "Clear all briqs");


registerUndoableAction("builderData/set_canvas_size", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/set_canvas_size",
            undo: () => { store.commit("builderData/set_canvas_size", payload.before) },
            redo: () => { store.commit("builderData/set_canvas_size", payload) },
        });
    }
}, (data: any) => "Change canvas size");
