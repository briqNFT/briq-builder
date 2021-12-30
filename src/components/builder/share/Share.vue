<script setup lang="ts">
import WebGLCanvas from './../WebGLCanvas.vue'
import MiddleModal from '../../MiddleModal.vue'
import Messages from '../../Messages.vue'
import SplashScreen from './../SplashScreen.vue'
import AlphaBanner from '../../AlphaBanner.vue';
import AlphaLogo from './../AlphaLogo.vue';
</script>

<template>
    <SplashScreen/>
    <div>
        <WebGLCanvas/>
        <AlphaLogo/>
        <div class="absolute right-0 top-0 px-4 py-2 md:py-4 max-h-screen flex flex-col md:flex-row md:items-start items-end gap-2 pointer-events-none">
            <div :class="'w-32 max-h-screen overflow-auto flex flex-nowrap flex-col justify-start content-end' + (expanded ? ' expanded' : ' unexpanded')">
                <Button class="pointer-events-auto" tooltip="Access local set operations, settings, etc." @click="expanded = !expanded"><i class="mx-1 fas fa-bars"></i><span class="mx-1">Menu</span></Button>
                <div class="my-2">
                    <div class="flex flex-col flex-nowrap gap-1">
                        <Button @click="openHelp">Help</button>
                        <Button @click="openSettings">Settings</button>
                        <Button @click="$router.push({ path: '/legal' })">Legal / Privacy</button>
                        <Button @click="$router.push({ path: '/' })">Home</button>
                        <!--<Button @click="$router.push({ path: '/admin' })">Admin</button>-->
                    </div>
                </div>
            </div>
        </div>
        <Messages/>
        <MiddleModal/>
        <h1 class="fixed bottom-0 left-0 right-0 text-center py-8 font-display drop-shadow-md">
            <span>{{ setData?.name }}</span>
        </h1>
        <h5 class="fixed bottom-0 left-0 right-0 text-center py-4 drop-shadow-md">{{ setData?.id }}</h5>
    </div>
    <AlphaBanner/>
</template>

<script lang="ts">
import { pushMessage, setTooltip } from '../../../Messages';
import { setModal } from '../../MiddleModal.vue';
import Settings from '../modals/Settings.vue';
import { dispatchBuilderAction } from '../../../builder/graphics/dispatch';
import { SetData } from '../../../builder/SetData';
import { inputStore } from '../../../builder/inputs/InputStore';
import { getProviderForNetwork } from '../../../Provider';
import { fetchData } from '../../../url';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            expanded: false,
            setData: undefined as undefined | SetData,
        };
    },
    props: ["set_id", "network"],
    provide: {
        messages: {
            pushMessage, setTooltip
        },
    },
    async mounted() {
        // this.$store.dispatch("wallet/force_provider", getProviderForNetwork(this.network));
        inputStore.currentInput = "camera";
        this.setData = undefined;
        try {
            let data = await fetchData("store_get/" + this.set_id);
            let set = new SetData(data.data.id, undefined)
            set.deserialize(data.data);
            this.setData = set;
            dispatchBuilderAction("select_set", set);
        }
        catch(err)
        {
            console.log(err);
        }
    },
    methods: {
        openHelp() {
            window.open('https://insidious-ginger-0f9.notion.site/briq-help-center-4a4958337970483dbfc2c1184290b42f','_blank');
        },
        openSettings() {
            setModal(Settings);
        }
    }
});
</script>


<style scoped>

.tshadow {
    text-shadow: 0 0 2px rgb(0, 0, 0, 0.3);
}

.expanded {
    overflow: auto;
    /*@apply bg-black bg-opacity-40 rounded-md md:bg-transparent;*/
    @apply pointer-events-auto;
}
.unexpanded {
    overflow: hidden;
}
.expanded > div {
    @apply visible block;
}
.unexpanded > div {
    @apply invisible;
}
</style>
