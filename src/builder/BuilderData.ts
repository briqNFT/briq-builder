import { toRef, watchEffect } from 'vue'
import { Briq, BriqsDB } from './BriqsDB';
import { SetData } from './SetData';

import { registerUndoableAction } from "./UndoRedo"

import { fetchData } from '../url'

import { dispatchBuilderAction } from "./graphics/dispatch"

import BriqContract from '../contracts/briq'

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
                            //let set = new SetData(data.id, state.briqsDB).deserialize();
                            dispatch("create_wip_set", data) //this.wipSets.push(set);
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
                        if (rootState.wallet.userWalletAddress)
                            dispatch("get_briqs");
                    })
                },
            },
            async get_briqs({ commit, state, rootState }: any)
            {
                let bricks = await state.briqContract.get_all_tokens_for_owner(rootState.wallet.userWalletAddress);
                commit("set_briqs", bricks.bricks);
            },

            ////////////
            //// Set Management
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
            //// Special set commands
            ////////////
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
                if (data)
                    set.deserialize(data);
                state.wipSets.push(set);
            },
            delete_wip_set(state: any, data: any)
            {
                let idx = state.wipSets.findIndex(x => x.id === data);
                state.wipSets.splice(idx, 1);
            },
            select_set(state: any, data: any)
            {
                if (data instanceof SetData)
                    state.currentSet = data;
                else
                    state.currentSet = state.wipSets.filter(x => x.id === data)[0];
                dispatchBuilderAction("select_set", state.currentSet);
            },
            set_briq_contract(state: any, data: BriqContract)
            {
                state.briqContract = data;
            },
            set_briqs(state: any, data: string[])
            {
                state.briqsDB.parseChainData(data);
            },
            place_briq(state: any, data: any)
            {
                state.currentSet.placeBriq(...data.pos, data.voxelId);
                dispatchBuilderAction("place_briq", data);
            },
            undo_place_briq(state: any, data: any)
            {
                if (data.undoData.briq)
                {
                    state.currentSet.placeBriq(...data.payload.pos, 0);
                    state.currentSet.placeBriq(...data.payload.pos, data.undoData.briq.material);
                }
                else
                {
                    state.currentSet.placeBriq(...data.payload.pos, 0);   
                }
                dispatchBuilderAction("place_briq", { pos: data.payload.pos, voxelId: data?.undoData?.briq?.material ?? 0 });
                //state.currentSet.placeBriq(...data.pos, data.voxelId);
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
                // TODO
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
