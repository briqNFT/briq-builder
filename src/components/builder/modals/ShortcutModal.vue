<script setup lang="ts">
import Window from '@/components/generic/Window.vue';
</script>

<style scoped>
h3 {
    @apply text-sm font-medium mb-1 mt-2;
}

p {
    @apply text-sm flex justify-between border-t border-grad-light py-1;
}

p :last-child {
    @apply tracking-tighter whitespace-nowrap;
}
</style>
<template>
    <Window size="max-w-[40rem]">
        <template #title>Keyboard shortcuts</template>
        <div>
            <p><span>Move Camera</span><span>Left click + Drag</span></p>
            <p><span>Pan Camera</span><span>Right click + Drag</span></p>
            <p><span>Zoom</span><span>Scroll</span></p>
            <h3>Global shortcuts</h3>
            <p><span>Undo</span><span>Ctrl + Z</span></p>
            <p><span>Redo</span><span>Ctrl + Shift + Z</span></p>
            <p><span>Copy</span><span>Ctrl + C</span></p>
            <p><span>Paste</span><span>Ctrl + V</span></p>
            <p><span>Select all objects</span><span>Ctrl + A</span></p>
            <h3>Select mode</h3>
            <p><span>Select briqs</span><span>Shift + Drag</span></p>
            <p><span>Voxel-based selection</span><span>Shift + Alt + Drag</span></p>
            <p><span>Delete briqs</span><span>Delete</span></p>
            <p><span>Rotate gizmo: allow arbitrary angles</span><span>Shift</span></p>
            <h3>Place Mode</h3>
            <p><span>Place multiple briqs</span><span>Shift + Drag</span></p>
            <p><span>Delete briq at cursor</span><span>Right click</span></p>
            <h3>Paint Mode</h3>
            <p><span>Paint multiple briqs</span><span>Shift + Drag</span></p>
            <p><span>Sample briq color</span><span>Right click</span></p>
            <h3>Erase Mode</h3>
            <p><span>Erase multiple briqs</span><span>Shift + Drag</span></p>
        </div>
    </Window>
</template>