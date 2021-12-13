<template>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            hk: undefined
        };
    },
    inject: ["hotkeyMgr"],
    props:["name", "handler", "data"],
    mounted() {
        if (this.data)
            this.hotkeyMgr.register(this.name, this.data);
        this.hk = this.hotkeyMgr.subscribe(this.name, this.handler);
    },
    unmounted() {
        this.hotkeyMgr.unsubscribe(this.hk);
    },
})
</script>