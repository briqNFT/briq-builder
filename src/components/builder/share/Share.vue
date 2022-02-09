<script setup lang="ts">
import WebGLCanvas from './../WebGLCanvas.vue'
import Modals from '../../Modals.vue'
import Messages from '../../Messages.vue'
import SplashScreen from './../SplashScreen.vue'
import AlphaBanner from '../../AlphaBanner.vue';
import AlphaLogo from './../AlphaLogo.vue';
</script>

<template>
    <SplashScreen/>
    <div>
        <WebGLCanvas style="height:calc(100vh - 200px)"/>
        <div class="text-center py-4 font-display">
            <div class="">
                <h1 class="my-2">{{ setData?.name }}</h1>
                <p class="font-lightest my-2">{{ setData?.id }}</p>
                <template v-if="author">
                    <p class="tracking-tighter font-mono self-align-center mx-2 text-2xl font-lightest break-all">
                        by {{ author }}
                    </p>
                </template>
            </div>
        </div>
        <div v-if="loadingStatus === 'loading'" class="bg-black bg-opacity-40 h-screen w-screen fixed left-0 top-0 flex justify-center items-center">
            <div class="rounded-md bg-base px-8 py-4">
                <h2 class="text-center p-2">Loading</h2>
                <p class="text-lg">Set {{ set_id ?? '' }} is currently loading...</p>
            </div>
        </div>
        <div v-else-if="loadingStatus === 'error'" class="bg-black bg-opacity-40 h-screen w-screen fixed left-0 top-0 flex justify-center items-center">
            <div class="rounded-md bg-base px-8 py-4">
                <h2 class="text-center p-2">Error loading set</h2>
                <p class="text-lg">{{ loadingData.text }}</p>
                <p class="alternate-buttons m-2"><router-link :to="{ name: 'Builder' }"><Btn class="m-auto block">Return to builder</Btn></router-link></p>
            </div>
        </div>
        <AlphaLogo/>
        <div class="absolute right-0 top-0 px-4 py-2 md:py-4 max-h-screen flex flex-col md:flex-row md:items-start items-end gap-2 pointer-events-none">
            <Btn v-if="loadingStatus === 'loaded'" @click="screenshot" class="pointer-events-auto"><i class="fab fa-twitter"></i> Tweet</Btn>
            <Btn v-if="loadingStatus === 'loaded'" @click="screenshot" class="pointer-events-auto"><i class="fas fa-camera"></i> Take Screenshot</Btn>
            <div :class="'w-32 max-h-screen overflow-auto flex flex-nowrap flex-col justify-start content-end' + (expanded ? ' expanded' : ' unexpanded')">
                <Btn class="pointer-events-auto" tooltip="Access local set operations, settings, etc." @click="expanded = !expanded"><i class="mx-1 fas fa-bars"></i><span class="mx-1">Menu</span></Btn>
                <div class="my-2">
                    <div class="flex flex-col flex-nowrap gap-1">
                        <Btn @click="$router.push({ name: 'Builder' })">Builder</Btn>
                        <Btn @click="openHelp">Help</Btn>
                        <Btn @click="openSettings">Settings</Btn>
                        <Btn @click="$router.push({ path: '/legal' })">Legal / Privacy</Btn>
                        <Btn @click="$router.push({ path: '/' })">Home</Btn>
                        <!--<Btn @click="$router.push({ path: '/admin' })">Admin</Btn>-->
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Modals/>
    <AlphaBanner/>
</template>

<script lang="ts">
import { pushMessage, setTooltip } from '../../../Messages';
import { pushModal } from '../../Modals.vue';
import Settings from '../modals/Settings.vue';
import Screenshot from './Screenshot.vue';
import { dispatchBuilderAction } from '../../../builder/graphics/Dispatch';
import { SetData } from '../../../builder/SetData';
import { inputStore } from '../../../builder/inputs/InputStore';
import { getProvider, getProviderForNetwork } from '../../../Provider';
import { fetchData } from '../../../url';
import { reportError } from '../../../Monitoring';
import { ticketing } from '../../../Async';
import contractStore, { forceNetwork } from '../../../Contracts';
import builderSettings from '../../../builder/graphics/Settings';

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    data() {
        return {
            expanded: false,
            setData: undefined as undefined | SetData,
            loadingStatus: "loading" as "loading" | "error" | "loaded",
            loadingData: undefined as any,
            author: "",
        };
    },
    props: ["set_id", "network", "version"],
    provide: {
        messages: {
            pushMessage, setTooltip
        },
    },
    beforeMount() {
        builderSettings.setSaveSettings(false);
    },
    unmounted() {
        builderSettings.setSaveSettings(true);
    },
    async mounted() {
        // this.$store.dispatch("wallet/force_provider", getProviderForNetwork(this.network));

        if (this.version == 1 && this.network == "testnet")
            forceNetwork("starknet-testnet-legacy");

        watchEffect(() => {
            this.fetchAuthor();
        })
        
        inputStore.currentInput = "camera";
        this.setData = undefined;
        dispatchBuilderAction("reset");

        if (!this.set_id)
        {
            this.loadingStatus = "error";
            this.loadingData = {
                "error": "bad_set_id",
                "text": `${this.set_id ?? '<empty set id>' } is not a valid set ID`
            };
            return;
        }
        try {
            let data = await fetchData("store_get/" + this.set_id);
            for (let key in data?.data?.recommendedSettings ?? {})
                builderSettings[key] = data.data.recommendedSettings[key];
            let set = new SetData(data.data.id)
            set.deserialize(data.data);
            this.setData = set;
            dispatchBuilderAction("select_set", set);
            this.loadingStatus = "loaded";
        }
        catch(err)
        {
            this.loadingStatus = "error";
            this.loadingData = {
                "error": "failed_loading",
                "text": `Failed loading set '${this.set_id}'. It may be an invalid set ID.`
            };
            reportError(err, "Failed to load set in Share");
        }
    },
    unmounted()
    {
        forceNetwork();
    },
    methods: {
        openHelp() {
            window.open('https://briqnft.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f','_blank');
        },
        openSettings() {
            pushModal(Settings);
        },
        fetchAuthor: ticketing(async function() {
            if (!contractStore.set || !this.set_id)
                return;
            try {
                let author = (await contractStore.set.ownerOf(this.set_id));
                if (author && author !== "0x0")
                    this.author = author;
            } catch(_) {}
        }),
        screenshot() {
            pushModal(Screenshot, { setData: this.setData, author: this.author });    
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
