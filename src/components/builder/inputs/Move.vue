<template>
    <div class="font-mono text-sm grid grid-cols-2 gap-1">
        <Button @click="moveX(1)">X+1</Button>
        <Button @click="moveX(-1)">X-1</Button>
        <Button @click="moveY(1)">Y+1</Button>
        <Button @click="moveY(-1)">Y-1</Button>
        <Button @click="moveZ(1)">Z+1</Button>
        <Button @click="moveZ(-1)">Z-1</Button>
    </div>
</template>

<style scoped>
button {
    @apply px-2 py-0;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
        };
    },
    inject: ["messages"],
    methods: {
        moveX(delta: number)
        {
            try {
                this.$store.dispatch("builderData/move_all_briqs", { x: delta });
            } catch(err) {
                this.messages.pushMessage("Cannot move set, briqs would be out of bounds");
            }
        },
        moveY(delta: number)
        {
            try {
                this.$store.dispatch("builderData/move_all_briqs", { y: delta });
            } catch(err) {
                this.messages.pushMessage("Cannot move set, briqs would be out of bounds");
            }
        },
        moveZ(delta: number)
        {
            try {
                this.$store.dispatch("builderData/move_all_briqs", { z: delta });
            } catch(err) {
                this.messages.pushMessage("Cannot move set, briqs would be out of bounds");
            }
        }
    }
})
</script>
