import type { Briq, BriqsDB } from './BriqsDB';
import { SetData } from './SetData';

import { registerUndoableAction } from "./UndoRedo"
import { pushMessage } from '../Messages';
import { reportError } from '../Monitoring';

import { dispatchBuilderAction } from "./graphics/dispatch";

import { palettesMgr } from './Palette';

import { setupSync } from './StarknetSync';

import { hexUuid } from '../Uuid';
import { cellSize } from './Constants';

import contractStore from '../Contracts';

import { inputStore } from './inputs/InputStore';
import { setsManager } from './SetsManager';

let initSet = new SetData(hexUuid());

var try_fetching_user_data_func;
export var builderDataStore = (() => {
    return {
        namespaced: true,
        state: () => ({
            currentSet: initSet,
        }),
        actions: {
            initialize: {
                root: true,
                handler: async ({ state, dispatch, commit, getters, rootState }: any) => {
                    setupSync();
                },
            },
            ////////////
            //// Local set Management
            ////////////
            select_set({ commit }: any, data: any)
            {
                commit("select_set", data);
            },
            update_set({ commit }: any, data: any)
            {
                commit("update_set", data);
            },
            
            ////////////
            //// Set commands
            ////////////
            change_set_name({ commit }: any, payload: any)
            {
                commit("change_set_name", payload);
            },
            swap_for_real_briqs({ commit }: any, data: { briqsDB: BriqsDB })
            {
                commit("swap_for_real_briqs", data);
            },
            swap_for_fake_briqs({ commit }: any)
            {
                commit("swap_for_fake_briqs");
            },
            
            ////////////
            //// Briq manipulation stuff
            ////////////
            place_briq: ({ commit }: any, data: any) => {
                commit("place_briq", data);
            },
            undo_place_briq: ({ commit }: any, data: any) => {
                commit("undo_place_briq", data);        
            },
            place_multiple_briqs: ({ commit }: any, data: any) => {
                commit("place_multiple_briqs", data);
            },
            undo_place_multiple_briqs: ({ commit }: any, data: any) => {
                commit("undo_place_multiple_briqs", data);        
            },
            set_briq_color: ({ commit }: any, data: any) => {
                commit("set_briq_color", data);
            },
            clear: ({ commit }: any) => {
                commit("clear");
            },
            undo_clear: ({ commit }: any, data: any) => {
                commit("undo_clear", data);
            },

            swap_briqs({ commit }: any, data: { briqsDB: BriqsDB, swaps: Array<[string, string]>})
            {
                commit("swap_briqs", data);
            },

            move_all_briqs({ state, commit }: any, data: any) {
                state.currentSet.forEach((briq, pos) => {
                    if (pos[0] + data.x < -cellSize || pos[0] + data.x > cellSize)
                        throw new Error("cannot");
                    if (pos[2] + data.z < -cellSize || pos[2] + data.z > cellSize)
                        throw new Error("cannot");
                    if (pos[1] + data.y < 0)
                        throw new Error("cannot");
                });
                commit("move_all_briqs", data);
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
                    inputStore.currentInput = 'camera';
                dispatchBuilderAction("select_set", state.currentSet);
            },
            update_set(state: any, data: any)
            {
                state.currentSet.deserialize(data);
                inputStore.selectionMgr.clear();
                dispatchBuilderAction("select_set", state.currentSet);
            },
            
            place_briq(state: any, data: any)
            {
                let ok = state.currentSet.placeBriq(...data.pos, data.color, data.voxelId);
                if (ok)
                    dispatchBuilderAction("place_briq", data);
                else // Fail to prevent the action from being stored in the history.
                    throw new Error();
                inputStore.selectionMgr.clear();
            },
            undo_place_briq(state: any, data: any)
            {
                if (data.undoData.briq)
                {
                    state.currentSet.placeBriq(...data.payload.pos, "", 0);
                    state.currentSet.placeBriq(...data.payload.pos, data.undoData.briq.color, data.undoData.briq.material);
                }
                else
                {
                    state.currentSet.placeBriq(...data.payload.pos, "", 0);   
                }
                dispatchBuilderAction("place_briq", { pos: data.payload.pos, color: data?.undoData?.briq?.color ?? "", voxelId: data?.undoData?.briq?.material ?? 0 });
                inputStore.selectionMgr.clear();
            },
            
            place_multiple_briqs(state: any, data: any)
            {
                for (let briqData of data)
                {
                    let ok = state.currentSet.placeBriq(...briqData.pos, briqData.color, briqData.voxelId);
                    if (ok)
                        dispatchBuilderAction("place_briq", briqData);
                }
                inputStore.selectionMgr.clear();
            },
            undo_place_multiple_briqs(state: any, data: any)
            {
                for (let briqData of data)
                {
                    if (briqData.briq)
                    {
                        state.currentSet.placeBriq(...briqData.pos, "", 0);
                        state.currentSet.placeBriq(...briqData.pos, briqData.briq.color, briqData.briq.material);
                    }
                    else
                    {
                        state.currentSet.placeBriq(...briqData.pos, "", 0);   
                    }
                    dispatchBuilderAction("place_briq", { pos: briqData.pos, color: briqData?.briq?.color ?? "", voxelId: briqData?.briq?.material ?? 0 });    
                }
                inputStore.selectionMgr.clear();
            },
            
            set_briq_color(state: any, data: any)
            {
                for (let d of data)
                {
                    let cell = state.currentSet.modifyBriq(...d.pos, d);
                    dispatchBuilderAction("place_briq", { ...cell.serialize(), pos: d.pos });
                }
            },
            
            change_set_name(state: any, data: any)
            {
                data.set.name = data.name;
            },
            swap_for_real_briqs(state: any, data: { briqsDB: BriqsDB })
            {
                state.currentSet.swapForRealBriqs(data.briqsDB);
                inputStore.selectionMgr.clear();
            },
            swap_for_fake_briqs(state: any)
            {
                state.currentSet.swapForFakeBriqs();
                inputStore.selectionMgr.clear();
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

            swap_briqs(state: any, data: { briqsDB: BriqsDB, swaps: Array<[string, string]>})
            {
                for (let [ogId, newId] of data.swaps)
                {
                    state.currentSet.swapBriq(ogId, data.briqsDB.get(newId));
                    inputStore.selectionMgr.replace(ogId, newId);
                }
                dispatchBuilderAction("select_set", state.currentSet);
            },

            move_all_briqs(state: any, data: any) {
                state.currentSet.moveAll(data.x ?? 0, data.y ?? 0, data.z ?? 0);
                dispatchBuilderAction("select_set", state.currentSet);
            },
        },
        getters: {},
    };
})();

registerUndoableAction("builderData/place_briq", "builderData/undo_place_briq", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        let cell = (state.builderData.currentSet as SetData).getAt(...payload.pos as [number, number, number]);
        if (cell)
        transientActionState.cell = cell;
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/place_briq",
            redoData: payload,
            undoData: {
                payload,
                undoData: {
                    briq: (transientActionState.cell as Briq)?.serialize() ?? null
                }
            }
        });
    }
}, (data: any) => !data?.redoData?.voxelId ? "Remove briq" : "Place briq");


registerUndoableAction("builderData/place_multiple_briqs", "builderData/undo_place_multiple_briqs", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        transientActionState.data = [];
        for (let briq of payload)
        {
            let cell = (state.builderData.currentSet as SetData).getAt(...briq.pos as [number, number, number]);
            if (cell)
            transientActionState.data.push(cell);
        }
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/place_multiple_briqs",
            redoData: payload,
            undoData: (payload as Array<any>).map((x, i) => ({ ...x, briq: transientActionState.data[i]})),
        });
    }
}, (data: any) => !data?.redoData?.[0]?.voxelId ? "Remove multiple briqs" : "Place multiple briqs");

registerUndoableAction("builderData/set_briq_color", "builderData/set_briq_color", {
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
            redoData: payload,
            undoData: payload.map((x, i) => ({ pos: x.pos, color: transientActionState.colors[i]}))
        });
    }
}, (data: any) => "Change briq color");

registerUndoableAction("builderData/select_set", "builderData/select_set", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        transientActionState.set = state.builderData.currentSet.id;
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/select_set",
            redoData: payload,
            undoData: transientActionState.set,
        });
    }
}, (data: any) => "Select set #" + data.undoData);

registerUndoableAction("builderData/clear", "builderData/undo_clear", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        transientActionState.data = state.builderData.currentSet.serialize();
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/clear",
            redoData: payload,
            undoData: transientActionState.data,
        });
    }
}, (data: any) => "Clear all briqs");


registerUndoableAction("builderData/move_all_briqs", "builderData/move_all_briqs", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/move_all_briqs",
            redoData: payload,
            undoData: { x: (-payload?.x) || 0, y: (-payload?.y) || 0, z: (-payload?.z) || 0 }
        });
    }
}, (data: any) => "Move all briqs");
