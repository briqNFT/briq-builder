import { Briq } from '../Briq';

export const dispatchedActions: Array<{ action: string; payload: any }> = [];

const preprocessor: { [key: string]: (payload: any) => any } = {
    select_set: (payload: any) => {
        // Fetch the minimum required data to place stuff.
        const data = { setId: payload.id, briqs: [] };
        payload.forEach((cell: Briq, pos: [number, number, number]) => {
            data.briqs.push({ pos, color: cell.color, material: cell.material, id: cell.id });
        });
        return data;
    },
    place_briqs: (payload: { pos: [number, number, number]; color?: string; material?: string }[]) => {
        return payload;
    },
    // New versions
    place_briq: (payload: { setId: number; briqData: any }) => {
        return payload;
    },
    remove_briq: (payload: { setId: number; position: [number, number, number] }) => {
        return payload;
    },
};

export function dispatchBuilderAction(action: string, payload?: any) {
    dispatchedActions.push({ action, payload: preprocessor?.[action]?.(payload) ?? payload });
}
