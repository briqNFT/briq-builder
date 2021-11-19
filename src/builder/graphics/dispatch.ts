// Temp method until I find a better system.

import { Briq } from '../BriqsDB';

import { store } from '../../store/Store'

export const dispatchedActions: Array<{ action: string, payload: any }> = [];

const preprocessor: { [key: string]: (payload: any) => any } = {
    "select_set": (payload: any) => {
        // Fetch the minimum required data to place stuff.
        let data: Array<any> = [];
        payload.forEach((cell: Briq, pos: [number, number, number]) => {
            data.push({ pos, material: cell.material });
        })
        return data;
    },
    "place_briq": (payload: any) => {
        return payload;
    }
};

export function dispatchBuilderAction(action: string, payload: any)
{
    dispatchedActions.push({ action, payload: preprocessor[action](payload) });
};
