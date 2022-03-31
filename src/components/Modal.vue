<template>
    <div v-if="data?.modal" class="fixed top-0 overflow-auto h-screen visible">
        <div
            :class="'flex h-screen w-screen overflow-auto fixed top-0 justify-center items-center ' + (visible ? 'visible' : 'invisible')"
            :style="modalBackground"
            @mousedown.self.stop="close()"
        >
        </div>
        <Hotkey name="escape" :handler="() => close()"/>
        <div
            :class="'flex min-h-screen w-screen invisible ' + modalAlignment"
        >
            <component :metadata="data.metadata" :is="data.modal"
                :class="'container rounded-lg bg-base alternate-buttons m-8 px-8 py-4 shadow-xl relative ' + (visible ? 'visible' : 'invisible')"
                @close="close"
                @hide="toggleVisibility(false)"
                @show="toggleVisibility(true)"
                @toggleVisibility="toggleVisibility"></component>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            visible: true,
        }
    },
    props: ["data"],
    computed: {
        modalBackground() {
            return { background: this.data?.metadata?.background || "rgba(0, 0, 0, 0.3)" };
        },
        modalAlignment() {
            return this.data?.metadata?.align || 'justify-center items-center';
        }
    },
    methods: {
        close(data?: any) {
            this.data.callback(data);
        },
        toggleVisibility(value: boolean) {
            this.visible = value;
        }
    }
})
</script>
