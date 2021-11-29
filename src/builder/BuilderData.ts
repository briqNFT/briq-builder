import { toRef, watchEffect } from 'vue'
import { Briq, BriqsDB } from './BriqsDB';
import { SetData } from './SetData';

import { registerUndoableAction } from "./UndoRedo"

import { fetchData } from '../url'

import { dispatchBuilderAction } from "./graphics/dispatch";

import { inputStore } from './inputs/InputStore';

import BriqContract from '../contracts/briq'
import SetContract from '../contracts/set'
import { pushMessage } from '../Messages';

let briqsDB = new BriqsDB();
let initSet = new SetData(Date.now(), briqsDB);

export var builderDataStore = (() => {
    return {
        namespaced: true,
        state: () => ({
            wipSets: [initSet] as Array<SetData>,
            currentSet: initSet,
            briqsDB: briqsDB,
            briqContract: undefined as BriqContract | undefined,
            setContract: undefined as SetContract | undefined,
            chainSets: [],
            genericChainSets: [],
        }),
        actions: {
            initialize: {
                root: true,
                handler: ({ state, dispatch, commit, getters, rootState }: any) => {
                    for (let [sid, setData] of Object.entries(window.localStorage))
                    {
                        if (!sid.startsWith("briq_set"))
                            continue;
                        try
                        {
                            let data = JSON.parse(setData);
                            dispatch("create_wip_set", data);
                        }
                        catch (e)
                        {
                            console.info("Could not parse stored set", sid, "error:", e)
                            window.localStorage.removeItem(sid);
                        };
                    }
                    if (state.wipSets.length > 1)
                        dispatch("delete_wip_set", state.wipSets[0].id);
                    dispatch("select_set", state.wipSets[0]);

                    watchEffect(() => {
                        // TODO: switch to IDB
                        window.localStorage.setItem("briq_set_" + state.currentSet.id, JSON.stringify(state.currentSet.serialize()));
                    });
                    

                    fetchData("contract_addresses").then(async x => {
                        commit("set_briq_contract", new BriqContract(x.briq, toRef(rootState.wallet, "signer")));
                        commit("set_set_contract", new SetContract(x.set, toRef(rootState.wallet, "signer")));
                        if (rootState.wallet.userWalletAddress)
                            dispatch("try_fetching_user_data");
                    })
                },
            },
            async try_fetching_user_data({ dispatch }: any, data: any)
            {
                let bricks = dispatch("get_briqs");
                let sets = dispatch("get_chain_sets");
                let gsets = dispatch("get_generic_chain_sets");
                let awaiting = {
                    briqs: await bricks,
                    sets: await sets,
                    gsets: await gsets,
                };
            },
            async get_briqs({ commit, state, rootState }: any, data: any)
            {
                if (!state.briqContract)
                    return;
                try {
                    let bricks = (await state.briqContract.get_all_tokens_for_owner(rootState.wallet.userWalletAddress)).bricks;
                    commit("set_briqs", bricks);
                    pushMessage("Successfully fetched " + bricks.length/3 + " briqs");
                }
                catch(err)
                {
                    pushMessage("Error fetching briqs - see console for details");
                    console.error(err);
                }
            },
            async get_chain_sets({ commit, state, rootState }: any, data: any)
            {
                if (!state.setContract)
                    return;
                try {
                    let sets = (await state.setContract.get_all_tokens_for_owner(rootState.wallet.userWalletAddress)).tokens;
                    commit("set_chain_sets", sets)
                    pushMessage("Successfully fetched " + sets.length + " sets");
                }
                catch(err)
                {
                    pushMessage("Error fetching sets - see console for details");
                    console.error(err);
                }
            },
            async get_generic_chain_sets({ commit, state, rootState }: any, data: any)
            {
                if (!state.setContract)
                    return;
                try {
                    let sets = (await state.setContract.get_all_tokens_for_owner("0xe872a6192d04d0ca5c935cb1742bb3a48cb87338acf2d97cbe25d1898de5be")).tokens;
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
            create_wip_set({ commit, state }: any, data: any)
            {
                commit("create_wip_set", data);
                return state.wipSets[state.wipSets.length - 1];
            },
            delete_wip_set({ commit, dispatch, state }: any, data: any)
            {
                commit("delete_wip_set", data);
                window.localStorage.removeItem("briq_set_" + data);
                if (!state.wipSets.length)
                    dispatch("create_wip_set")
                // TODO: only change if necessary
                dispatch("select_set", state.wipSets[0]);
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
            set_briq_color: ({ commit }: any, data: any) => {
                commit("set_briq_color", data);
            },
            clear: ({ commit }: any) => {
                commit("clear");
            },
            undo_clear: ({ commit }: any, data: any) => {
                commit("undo_clear", data);
            }
        },
        mutations: {
            create_wip_set(state: any, data: any)
            {
                let set = new SetData(data?.id ?? Date.now(), state.briqsDB);
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
                inputStore.updateForSet(state.currentSet);
                dispatchBuilderAction("select_set", state.currentSet);
            },
            set_briq_contract(state: any, data: BriqContract)
            {
                state.briqContract = data;
            },
            set_set_contract(state: any, data: SetContract)
            {
                state.setContract = data;
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
                state.currentSet.placeBriq(...data.pos, data.color, data.voxelId);
                dispatchBuilderAction("place_briq", data);
            },
            undo_place_briq(state: any, data: any)
            {
                console.log(data);
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
                //state.currentSet.placeBriq(...data.pos, data.voxelId);
            },
            set_briq_color(state: any, data: any)
            {
                let cell = state.currentSet.modifyBriq(...data.pos, data);
                dispatchBuilderAction("place_briq", { ...cell.serialize(), pos: data.pos });
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
        },
        getters: {},
    };
})();

registerUndoableAction("builderData/place_briq", "builderData/undo_place_briq", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        let cell = (state.builderData.currentSet as SetData).getAt(...payload.pos);
        if (cell)
            transientActionState.cell = cell;
    },
    onAfter: ({ transientActionState, store }: any, payload: any, state: any) => {
        store.dispatch("push_command_to_history", {
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
});

registerUndoableAction("builderData/set_briq_color", "builderData/set_briq_color", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        let cell = (state.builderData.currentSet as SetData).getAt(...payload.pos);
        if (cell)
            transientActionState.cellColor = cell.color;
    },
    onAfter: ({ transientActionState, store }: any, payload: any, state: any) => {
        store.dispatch("push_command_to_history", {
            action: "builderData/set_briq_color",
            redoData: payload,
            undoData: {
                pos: payload.pos,
                color: transientActionState.cellColor
            }
        });
    }
});

registerUndoableAction("builderData/select_set", "builderData/select_set", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        transientActionState.set = state.builderData.currentSet.id;
    },
    onAfter: ({ transientActionState, store }: any, payload: any, state: any) => {
        store.dispatch("push_command_to_history", {
            action: "builderData/select_set",
            redoData: payload,
            undoData: transientActionState.set,
        });
    }
});

registerUndoableAction("builderData/clear", "builderData/undo_clear", {
    onBefore: ({ transientActionState }: any, payload: any, state: any) => {
        transientActionState.data = state.builderData.currentSet.serialize();
    },
    onAfter: ({ transientActionState, store }: any, payload: any, state: any) => {
        store.dispatch("push_command_to_history", {
            action: "builderData/clear",
            redoData: payload,
            undoData: transientActionState.data,
        });
    }
});
