import { Briq } from "./BriqsDB";
import { SetData } from "./SetData";

const undoActions = {
    "builderData/place_briq": "builderData/undo_place_briq",
}

export const UndoRedo = (store: any) => {
    let transientActionState: any = {};

    const onBefore = {
        "builderData/place_briq": (payload: any, state: any) => {
            let cell = (state.builderData.currentSet as SetData).getAt(...payload.pos);
            if (cell)
                transientActionState.cell = cell;
        }
    };
    const onAfter = {
        "builderData/place_briq": (payload: any, state: any) => {
            store.dispatch("push_command_to_history", {
                action: "builderData/place_briq",
                payload: { ...payload, _replay: true },
                undoData: {
                    briq: (transientActionState.cell as Briq)?.serialize() ?? null
                }
            });
        }
    };

    store.subscribeAction({
        before: (action: any, state: any) => {
            if (!(action.type in onBefore) || action.payload._replay)
                return;
            transientActionState = {};
            onBefore[action.type](action.payload, state);
        },
        after: (action: any, state: any) => {
            if (!(action.type in onAfter) || action.payload._replay)
                return;
            onAfter[action.type](action.payload, state);
        }
    })
}

export const undoRedoStore = {
    state: {
        command_history: [],
        command_index: -1,
    },
    actions: {
        push_command_to_history: ({ commit }: any, data: any) => {
            commit("push_command_to_history", data);
        },
        undo_history: ({ dispatch, commit, state }: any) => {
            if (state.command_index < 0)
                return;
            dispatch(undoActions[state.command_history[state.command_index].action], state.command_history[state.command_index]);
            commit("undo_history");
        },
        redo_history: ({ dispatch, commit, state }: any) => {
            if (state.command_index + 1 >= state.command_history.length)
                return;
            dispatch(state.command_history[state.command_index + 1].action, state.command_history[state.command_index + 1].payload);
            commit("redo_history");
        }
    },
    mutations: {
        push_command_to_history: (state: any, data: any) => {
            state.command_history = state.command_history.slice(0, state.command_index + 1);
            state.command_history.push(data);
            ++state.command_index;
        },
        undo_history: (state: any) => {
            --state.command_index;
        },
        redo_history: (state: any) => {
            ++state.command_index;
        },
    },
};