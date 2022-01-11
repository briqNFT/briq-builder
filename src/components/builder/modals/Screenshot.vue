<template>
<div ref="myself" class="invisible">
    <h2 class="visible text-center text-[5rem] opacity-50 pointer-events-none">SCREENSHOTTING</h2>
    <teleport to="#inputComp">
        <div class="flex flex-col my-4 gap-2">
            <Btn @click="$emit('close')">Cancel</Btn>
            <Btn @click="returnScreen">Take Screenshot</Btn>
        </div>
    </teleport>
</div>
</template>

<script lang="ts">
import { takeScreenshot } from '../../../builder/graphics/builder.js';
import { inputStore } from '../../../builder/inputs/InputStore';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            oldInput: "",
            screenshot: "",
            screenshotPromise: undefined as Promise<string> | undefined,
        };
    },
    mounted() {
        // Hide the parent to hide the gray background.
        this.$refs.myself.parentNode.style.visibility = "hidden";
        this.oldInput = inputStore.currentInput;
        inputStore.currentInput = "camera";
        inputStore.forceInput = true;
    },
    unmounted() {
        inputStore.currentInput = this.oldInput;
        inputStore.forceInput = false;
    },
    props: ["metadata"],
    emits: ["close"],

    methods: {
        takeScreen()
        {
            let uri = takeScreenshot();
            let img = new Image();
            img.src = uri;
            this.screenshotPromise = new Promise((resolve: (data: string) => void) => {
                img.decode().then(() => {
                    this.screenshot = img.src;
                    resolve(this.screenshot);
                });
            })
        },
        async returnScreen() {
            this.takeScreen();
            this.$emit('close', await this.screenshotPromise!);
        }
    }
})
</script>
