<script setup lang="ts">
import Window from '@/components/generic/Window.vue';
</script>

<style scoped>
h3 {
    @apply text-sm font-medium mb-2 mt-6;
}

p {
    @apply tracking-tight text-sm flex justify-between border-t border-grad-light py-2 gap-4;
}

p :last-child {
    @apply whitespace-nowrap;
}
</style>
<template>
    <Window size="w-auto md:max-w-[60rem]">
        <template #title>Keyboard Shortcuts</template>
        <div class="grid md:grid-cols-2 gap-16">
            <div>
                <h3>Tools</h3>
                <p><span>Select</span><span>1</span></p>
                <p><span>Place</span><span>2</span></p>
                <p><span>Paint</span><span>3</span></p>
                <p><span>Erase</span><span>4</span></p>

                <h3>Global shortcuts</h3>
                <p><span>Move Camera</span><span>Left click + Drag</span></p>
                <p><span>Pan Camera</span><span>Right click + Drag</span></p>
                <p><span>Zoom</span><span>Scroll</span></p>
                <p><span>Undo</span><span>Ctrl + Z</span></p>
                <p><span>Redo</span><span>Ctrl + Shift + Z</span></p>
                <p><span>Copy</span><span>Ctrl + C</span></p>
                <p><span>Paste</span><span>Ctrl + V</span></p>
                <p><span>Select all objects</span><span>Ctrl + A</span></p>
            </div>
            <div>
                <h3>Select mode</h3>
                <p><span>Select briqs</span><span>Shift + Drag</span></p>
                <p><span>Voxel-based selection</span><span>Shift + Alt + Drag</span></p>
                <p><span>Delete briqs</span><span>Delete</span></p>
                <p><span>Rotate gizmo: allow arbitrary angles</span><span>Shift while rotating</span></p>
                <h3>Place Mode</h3>
                <p><span>Place multiple briqs</span><span>Shift + Drag</span></p>
                <p><span>Delete briq at cursor</span><span>Right click</span></p>
                <h3>Paint Mode</h3>
                <p><span>Paint multiple briqs</span><span>Shift + Drag</span></p>
                <p><span>Sample briq color</span><span>Right click</span></p>
                <h3>Erase Mode</h3>
                <p><span>Erase multiple briqs</span><span>Shift + Drag</span></p>
            </div>
        </div>
    </Window>
</template>