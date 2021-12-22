import { toRef, watchEffect } from 'vue'

import { Briq, BriqsDB } from './BriqsDB';
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

import { inputStore } from './inputs/InputStore';

let briqsDB = new BriqsDB();
let initSet = new SetData(hexUuid(), briqsDB);

function checkForInitialGMSet(dispatch: CallableFunction, set: SetData)
{
    if (!window.localStorage.getItem("has_initial_gm_set"))
    {
        window.localStorage.setItem("has_initial_gm_set", "true")
        dispatch("place_multiple_briqs", [
            {"pos":[4,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[3,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[2,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[1,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[1,1,0],"color":"#e6de83","voxelId":1},
            {"pos":[1,2,0],"color":"#e6de83","voxelId":1},
            {"pos":[2,2,0],"color":"#e6de83","voxelId":1},
            {"pos":[4,1,0],"color":"#62bdf6","voxelId":1},
            {"pos":[4,2,0],"color":"#62bdf6","voxelId":1},
            {"pos":[4,3,0],"color":"#62bdf6","voxelId":1},
            {"pos":[4,4,0],"color":"#e6de83","voxelId":1},
            {"pos":[3,4,0],"color":"#416aac","voxelId":1},
            {"pos":[2,4,0],"color":"#416aac","voxelId":1},
            {"pos":[1,4,0],"color":"#416aac","voxelId":1},
            {"pos":[-1,0,0],"color":"#394183","voxelId":1},
            {"pos":[-5,0,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,1,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,2,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,3,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,4,0],"color":"#416aac","voxelId":1},
            {"pos":[-1,1,0],"color":"#394183","voxelId":1},
            {"pos":[-1,2,0],"color":"#394183","voxelId":1},
            {"pos":[-1,3,0],"color":"#394183","voxelId":1},
            {"pos":[-1,4,0],"color":"#394183","voxelId":1},
            {"pos":[-2,4,0],"color":"#e6de83","voxelId":1},
            {"pos":[-4,4,0],"color":"#e6de83","voxelId":1},
            {"pos":[-3,3,0],"color":"#c5ac73","voxelId":1}
        ]);
        dispatch("change_set_name", { set: set, name: "GM" })
    }
}

var try_fetching_user_data_func;
export var builderDataStore = (() => {
    return {
        namespaced: true,
        state: () => ({
            wipSets: [initSet] as Array<SetData>,
            currentSet: initSet,
            briqsDB: briqsDB,
            chainSets: [],
            genericChainSets: [],
            fetchingBriqs: false,
            fetchingSets: false,
        }),
        actions: {
            initialize: {
                root: true,
                handler: async ({ state, dispatch, commit, getters, rootState }: any) => {
                    for (let [sid, setData] of Object.entries(window.localStorage))
                    {
                        if (!sid.startsWith("briq_set"))
                        continue;
                        try
                        {
                            let data = JSON.parse(setData);
                            await dispatch("create_wip_set", data);
                        }
                        catch (e)
                        {
                            console.info("Could not parse stored set", sid, "error:", e)
                            window.localStorage.removeItem(sid);
                        };
                    }
                    if (state.wipSets.length > 1)
                        await dispatch("delete_wip_set", state.wipSets[0].id);
                    else
                        await checkForInitialGMSet(dispatch, state.wipSets[0]);
                    await dispatch("select_set", state.wipSets[0]);
                    
                    watchEffect(() => {
                        // TODO: switch to IDB
                        window.localStorage.setItem("briq_set_" + state.currentSet.id, JSON.stringify(state.currentSet.serialize()));
                    });
                    
                    setupSync();
                },
            },
            async try_fetching_user_data({ state, dispatch, rootState }: any, data: any)
            {
                if (!try_fetching_user_data_func)
                try_fetching_user_data_func = (async () => {
                    let bricks = dispatch("get_briqs");
                    let sets = dispatch("get_chain_sets");
                    let gsets = dispatch("get_generic_chain_sets");
                    let awaiting = {
                        briqs: await bricks,
                        sets: await sets,
                        gsets: await gsets,
                    };
                    try_fetching_user_data_func = undefined;
                })();
                await try_fetching_user_data_func;
            },
            async get_briqs({ commit, state, rootState }: any)
            {
                if (!contractStore.briq)
                return;
                try {
                    commit("fetching_briqs", true);
                    let bricks = (await contractStore.briq.get_all_tokens_for_owner(rootState.wallet.userWalletAddress));
                    commit("set_briqs", bricks);
                    pushMessage("Successfully fetched " + bricks.length/3 + " briqs");
                }
                catch(err)
                {
                    pushMessage("Error fetching briqs - see console for details");
                    reportError(err);
                    console.error(err);
                }
                commit("fetching_briqs", false);
            },
            async get_chain_sets({ commit, state, rootState }: any)
            {
                if (!contractStore.set)
                return;
                try {
                    commit("fetching_sets", true);
                    let sets = (await contractStore.set.get_all_tokens_for_owner(rootState.wallet.userWalletAddress)).tokens;
                    commit("set_chain_sets", sets)
                    pushMessage("Successfully fetched " + sets.length + " sets");
                }
                catch(err)
                {
                    pushMessage("Error fetching sets - see console for details");
                    console.error(err);
                }
                commit("fetching_sets", false);
            },
            async get_generic_chain_sets({ commit, state, rootState }: any, data: any)
            {
                if (!contractStore.set)
                return;
                try {
                    let sets = (await contractStore.set.get_all_tokens_for_owner("0xe872a6192d04d0ca5c935cb1742bb3a48cb87338acf2d97cbe25d1898de5be")).tokens;
                    commit("set_generic_chain_sets", sets)
                    pushMessage("Successfully fetched " + sets.length + " sets");
                }
                catch(err)
                {
                    pushMessage("Error fetching sets - see console for details");
                    console.error(err);
                }
            },
            ////////////
            //// Local set Management
            ////////////
            async create_wip_set({ commit, dispatch, state }: any, data: any)
            {
                commit("create_wip_set", data);
                await dispatch("select_set", state.wipSets[state.wipSets.length - 1]);
                return state.wipSets[state.wipSets.length - 1];
            },
            async delete_wip_set({ commit, dispatch, state }: any, data: any)
            {
                commit("delete_wip_set", data);
                window.localStorage.removeItem("briq_set_" + data);
                if (!state.wipSets.length)
                await dispatch("create_wip_set")
                // TODO: only change if necessary
                await dispatch("select_set", state.wipSets[0]);
            },
            select_set({ commit }: any, data: any)
            {
                commit("select_set", data);
            },
            
            ////////////
            //// Set commands
            ////////////
            change_set_name({ commit }: any, payload: any)
            {
                commit("change_set_name", payload);
            },
            swap_for_real_briqs({ commit }: any)
            {
                commit("swap_for_real_briqs");
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

            swap_briqs({ commit }: any, data: Array<[string, string]>)
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
            create_wip_set(state: any, data: any)
            {
                let set = new SetData(data?.id ?? hexUuid(), state.briqsDB);
                if (!set.name)
                    set.name = "New Set";
                if (state.wipSets.find((x: SetData) => x.id === set.id))
                throw new Error("Set with ID " + set.id + " already exists");
                if (data)
                set.deserialize(data);
                state.wipSets.push(set);
            },
            delete_wip_set(state: any, data: any)
            {
                let idx = state.wipSets.findIndex((x: SetData) => x.id === data);
                state.wipSets.splice(idx, 1);
            },
            select_set(state: any, data: any)
            {
                if (data instanceof SetData)
                    state.currentSet = data;
                else
                    state.currentSet = state.wipSets.filter((x: SetData) => x.id === data)[0];
                palettesMgr.updateForSet(state.currentSet);
                inputStore.selectionMgr.selectSet(state.currentSet);
                dispatchBuilderAction("select_set", state.currentSet);
            },
                        
            fetching_briqs(state: any, data: boolean)
            {
                state.fetchingBriqs = data;
            },
            fetching_sets(state: any, data: boolean)
            {
                state.fetchingSets = data;
            },
            
            set_briqs(state: any, data: string[])
            {
                state.briqsDB.parseChainData(data);
            },
            set_chain_sets(state: any, data: string[])
            {
                state.chainSets = data;
            },
            set_generic_chain_sets(state: any, data: string[])
            {
                state.genericChainSets = data;
            },
            
            place_briq(state: any, data: any)
            {
                let ok = state.currentSet.placeBriq(...data.pos, data.color, data.voxelId);
                if (ok)
                dispatchBuilderAction("place_briq", data);
                else // Fail to prevent the action from being stored in the history.
                throw new Error();
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
            },
            
            place_multiple_briqs(state: any, data: any)
            {
                for (let briqData of data)
                {
                    let ok = state.currentSet.placeBriq(...briqData.pos, briqData.color, briqData.voxelId);
                    if (ok)
                    dispatchBuilderAction("place_briq", briqData);
                }
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
            swap_for_real_briqs(state: any)
            {
                state.currentSet.swapForRealBriqs(state.briqsDB);
            },
            swap_for_fake_briqs(state: any)
            {
                state.currentSet.swapForFakeBriqs();
            },
            
            clear: (state: any) => {
                state.currentSet.reset();
                dispatchBuilderAction("reset");
            },
            undo_clear: (state: any, data: any) => {
                state.currentSet.reset();
                state.currentSet.deserialize(data);
                dispatchBuilderAction("select_set", state.currentSet);
            },

            swap_briqs(state: any, data: Array<[string, string]>)
            {
                for (let [ogId, newId] of data)
                {
                    state.currentSet.swapBriq(ogId, state.briqsDB.get(newId));
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
