import './default.css';

export const MATERIAL_GENESIS = "0x1"

export const CONF = {
    theme: "default",
    useLanding: true,
    briqMaterials: [MATERIAL_GENESIS],
    defaultMaterial: MATERIAL_GENESIS,
    builderSettings: {
        darkMode: {
            planeColor: "#591f00",
            gridColor: "#999999",
            backgroundColor: "#1e2229",
        },
        lightMode: {
            planeColor: "#a93a00",
            gridColor: "#eaeaea",
            backgroundColor: "#eaeaea",
        },
        canvasSize: 10,
    },
    defaultPalette: {
        // Default colours come from #138
        "#c5ac73": "#c5ac73",
        "#e6de83": "#e6de83",
        "#625231": "#625231",
        "#399ccd": "#399ccd",
        "#62bdf6": "#62bdf6",
        "#ffeec5": "#ffeec5",
        "#416aac": "#416aac",
        "#394183": "#394183",
        "#c5c5c5": "#c5c5c5",
        "#ffffff": "#ffffff",
        "#6a6a6a": "#6a6a6a",
    }
}
