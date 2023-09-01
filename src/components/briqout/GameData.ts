import { reactive } from 'vue';

export const briqoutStore = reactive({
    // Cheat on the type - this will always be set for any relevant module, see Briqout.vue
    canvas: undefined as unknown as HTMLCanvasElement,
})
