import { Briq } from './Briq'
import { SetData } from './SetData';

import { registerUndoableAction } from "./UndoRedo"
import { pushMessage } from '../Messages';
import { reportError } from '../Monitoring';

import { dispatchBuilderAction } from "./graphics/Dispatch";

import { palettesMgr } from './Palette';

import { hexUuid } from '../Uuid';

import builderSettings from './graphics/Settings';

import { inputStore } from './inputs/InputStore';
import { setsManager } from './SetsManager';
import { ChainBriqs } from './ChainBriqs';

let initSet = new SetData(hexUuid());

import { watch, toRef } from 'vue';
import { number } from 'starknet';

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
            place_briqs: ({ commit }: any, data: any) => {
                for (let briqData of data)
                    if (briqData.color && !isWithinBounds(...briqData.pos))
                        throw new Error("cannot");
                commit("place_briqs", data);
            },
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

            move_briqs({ state, commit }: any, data: { delta: { x?: number, y?: number, z?: number }, briqs: Briq[]}) {
                state.currentSet.forEach((briq, pos) => {
                    if (!data.briqs.find(x => x._uuid === briq._uuid))
                        return;
                    if (!isWithinBounds(pos[0] + (data.delta.x || 0), pos[1] + (data.delta.y || 0), pos[2] + (data.delta.z || 0)))
                        throw new Error("cannot, would go out of bounds");
                });
                commit("move_briqs", data);
                inputStore.selectionMgr.updateGraphics();
            },
            move_all_briqs({ state, commit }: any, data: any) {
                state.currentSet.forEach((briq, pos) => {
                    if (!isWithinBounds(pos[0] + (data.x || 0), pos[1] + (data.y || 0), pos[2] + (data.z || 0)))
                        throw new Error("cannot");
                });
                commit("move_all_briqs", data);
                inputStore.selectionMgr.updateGraphics();
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
                else
                    inputStore.currentInput = 'place';
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
                        
            place_briqs(state: any, data: { pos: [number, number, number], color?: string, material?: string }[])
            {
                for (let briqData of data)
                {
                    let briq = briqData.color ? new Briq(briqData.material, briqData.color) : undefined;
                    state.currentSet.placeBriq(...briqData.pos, briq);
                }
                dispatchBuilderAction("place_briqs", data);
                inputStore.selectionMgr.clear();
            },

            set_briq_color(state: any, data: any)
            {
                for (let d of data)
                    state.currentSet.modifyBriq(...d.pos, d);
                dispatchBuilderAction("place_briqs", data);
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

            move_briqs(state: any, data: { delta: { x?: number, y?: number, z?: number }, briqs: Briq[]}) {
                state.currentSet.moveBriqs(data.delta.x ?? 0, data.delta.y ?? 0, data.delta.z ?? 0, data.briqs);
                dispatchBuilderAction("select_set", state.currentSet);
            },

            move_all_briqs(state: any, data: any) {
                state.currentSet.moveAll(data.x ?? 0, data.y ?? 0, data.z ?? 0);
                dispatchBuilderAction("select_set", state.currentSet);
            },

            // hack:
            set_canvas_size(state: unknown, data: { value: number, before: number })
            {
                builderSettings.canvasSize = data.value;
            }
        },
        getters: {},
    };
})();

registerUndoableAction("builderData/place_briqs", "builderData/place_briqs", {
    onBefore: ({ transientActionState }: any, payload: { pos: [number, number, number], color?: string, material?: string }[], state: any) => {
        transientActionState.cells = [];
        for (let data of payload)
        {
            let cell = (state.builderData.currentSet as SetData).getAt(...data.pos);
            transientActionState.cells.push({ pos: data.pos, color: cell?.color, material: cell?.material });
        }
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/place_briqs",
            redoData: payload,
            undoData: transientActionState.cells
        });
    }
}, (data: any) => !data.redoData[0]?.color ? "Remove briq" : "Place briq");

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

registerUndoableAction("builderData/set_canvas_size", "builderData/set_canvas_size", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
    },
    onAfter: async ({ transientActionState, store }: any, payload: any, state: any) => {
        await store.dispatch("push_command_to_history", {
            action: "builderData/set_canvas_size",
            redoData: payload,
            undoData: { value: payload.before }
        });
    }
}, (data: any) => "Change canvas size");
