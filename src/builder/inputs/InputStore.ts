import { reactive } from 'vue';

import type { SetData } from '../SetData';

export const inputStore = reactive({
    currentInput: "place",
    currentColor: "#999999",
    colorMap: {
        "#999999": {
            name: "Gray",
            color: "#999999",
        },
        "#DD0000": {
            name: "Red",
            color: "#DD0000",
        },
        "#0000DD": {
            name: "Blue",
            color: "#0000DD",
        },
        "#00DD00": {
            name: "Green",
            color: "#00DD00",
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
