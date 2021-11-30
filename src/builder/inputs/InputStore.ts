import { reactive } from 'vue';

import type { SetData } from '../SetData';

export const inputStore = reactive({
    currentInput: "place",
    currentColor: "#416aac",
    colorMap: {
        "#c5ac73": {
            name: "#c5ac73",
            color: "#c5ac73",
        },
        "#e6de83": {
            name: "#e6de83",
            color: "#e6de83",
        },
        "#625231": {
            name: "#625231",
            color: "#625231",
        },
        "#399ccd": {
            name: "#399ccd",
            color: "#399ccd",
        },
        "#62bdf6": {
            name: "#62bdf6",
            color: "#62bdf6",
        },
        "#ffeec5": {
            name: "#ffeec5",
            color: "#ffeec5",
        },
        "#416aac": {
            name: "#416aac",
            color: "#416aac",
        },
        "#394183": {
            name: "#394183",
            color: "#394183",
        },
        "#c5c5c5": {
            name: "#c5c5c5",
            color: "#c5c5c5",
        },
        "#ffffff": {
            name: "#ffffff",
            color: "#ffffff",
        },
        "#6a6a6a": {
            name: "#6a6a6a",
            color: "#6a6a6a",
        },
    } as { [key: string]: { name: string, color: string } },
    
    updateForSet(set: SetData) {
        set.forEach((cell, _) => {
            if (cell.color in this.colorMap)
                return;
            this.colorMap[cell.color] = {
                name: cell.color,
                color: cell.color,
            };
        });
    },
});
