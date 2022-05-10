<script setup lang="ts">
import WebGLCanvas from './../WebGLCanvas.vue';
import Modals from '../../Modals.vue';
import Messages from '../../Messages.vue';
import SplashScreen from './../SplashScreen.vue';
import AlphaBanner from '../../AlphaBanner.vue';
import AlphaLogo from './../AlphaLogo.vue';
import { toBN } from '@/starknet_wrapper';
import { backendManager } from '@/Backend';
</script>

<template>
    <SplashScreen/>
    <div>
        <div class="relative" style="height: calc(100vh - 140px)">
            <WebGLCanvas class="!h-full"/>
            <AlphaLogo/>
        </div>
        <div class="text-center py-2 font-display min-h-[140px] alternate-buttons flex flex-col-reverse md:flex-row gap-4">
            <div class="basis-0 grow px-4 flex justify-center items-center">
                <div class="flex gap-2 flex-row md:flex-col w-max">
                    <a target="_blank" class="w-full" :href="playOasis"><Btn class="w-full">See on Aspect</Btn></a>
                    <a target="_blank" class="w-full" :href="mintSquare"><Btn class="w-full">See on MintSquare</Btn></a>
                </div>
            </div>
            <div class="grow flex flex-col h-full">
                <h2 class="my-1">{{ setData?.name }}</h2>
                <p class="font-lightest text-sm my-1 break-words">{{ setData?.id }}</p>
                <template v-if="author">
                    <p class="tracking-tighter font-mono self-align-center mx-2 text-md font-lightest break-words">
                        by {{ author }}
                    </p>
                </template>
            </div>
            <div class="basis-0 grow md:block hidden"></div>
        </div>
        <div
            v-if="loadingStatus === 'loading'"
            class="bg-black bg-opacity-40 h-screen w-screen fixed left-0 top-0 flex justify-center items-center">
            <div class="rounded-md bg-base px-8 py-4">
                <h2 class="text-center p-2">Loading</h2>
                <p class="text-lg">Set {{ set_id ?? '' }} is currently loading...</p>
            </div>
        </div>
        <div
            v-else-if="loadingStatus === 'error'"
            class="bg-black bg-opacity-40 h-screen w-screen fixed left-0 top-0 flex justify-center items-center">
            <div class="rounded-md bg-base px-8 py-4">
                <h2 class="text-center p-2">Error loading set</h2>
                <p class="text-lg">{{ loadingData.text }}</p>
                <p class="alternate-buttons m-2">
                    <router-link :to="{ name: 'Builder' }">
                        <Btn class="m-auto block">Return to builder</Btn>
                    </router-link>
                </p>
            </div>
        </div>
        <div
            v-if="!embed"
            class="absolute right-0 top-0 px-4 py-2 md:py-4 max-h-screen flex flex-col md:flex-row md:items-start items-end gap-2 pointer-events-none">
            <Btn class="pointer-events-auto" @click="openInfoWidget"><i class="fas fa-info-circle"/> Details</Btn>
            <Btn v-if="loadingStatus === 'loaded'" @click="screenshot" class="pointer-events-auto">
                <i class="fab fa-twitter"/> Tweet
            </Btn>
            <Btn v-if="loadingStatus === 'loaded'" @click="screenshot" class="pointer-events-auto">
                <i class="fas fa-camera"/> Take Screenshot
            </Btn>
            <div
                :class="
                    'w-32 max-h-screen overflow-auto flex flex-nowrap flex-col justify-start content-end' +
                        (expanded ? ' expanded' : ' unexpanded')
                ">
                <Btn
                    class="pointer-events-auto"
                    tooltip="Access local set operations, settings, etc."
                    @click="expanded = !expanded">
                    <i class="mx-1 fas fa-bars"/><span class="mx-1">Menu</span>
                </Btn>
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
    <AlphaBanner v-if="!embed"/>
</template>

<script lang="ts">
import { pushMessage, setTooltip } from '@/Messages';
import { pushModal } from '../../Modals.vue';
import Settings from '../modals/Settings.vue';
import InfoWidget from '../modals/InfoWidget.vue';
import Screenshot from './Screenshot.vue';
import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';
import { SetData } from '@/builder/SetData';
import { reportError } from '@/Monitoring';
import { ticketing } from '@/Async';
import contractStore, { forceNetwork } from '@/chain/Contracts';
import builderSettings from '@/builder/graphics/Settings';
import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { featureFlags } from '@/FeatureFlags';

import { defineComponent, watchEffect } from 'vue';
export default defineComponent({
    data() {
        return {
            expanded: false,
            setData: undefined as undefined | SetData,
            loadingStatus: 'loading' as 'loading' | 'error' | 'loaded',
            loadingData: undefined as any,
            author: '',
        };
    },
    props: ['set_id', 'network', 'version', 'embed'],
    provide: {
        messages: {
            pushMessage,
            setTooltip,
        },
        featureFlags,
    },
    beforeMount() {
        builderSettings.setSaveSettings(false);
    },
    unmounted() {
        builderSettings.setSaveSettings(true);
        forceNetwork();
    },
    async mounted() {
        if (this.version == 1 && this.network == 'testnet')
            forceNetwork('starknet-testnet-legacy');

        watchEffect(() => {
            this.fetchAuthor();
        });

        builderInputFsm.waitForInit().then(() => builderInputFsm.switchTo('camera'));

        this.setData = undefined;
        dispatchBuilderAction('reset');

        if (!this.set_id) {
            this.loadingStatus = 'error';
            this.loadingData = {
                error: 'bad_set_id',
                text: `${this.set_id ?? '<empty set id>'} is not a valid set ID`,
            };
            return;
        }
        try {
            let data = await backendManager.getMetadata(this.set_id);
            for (let key in data?.data?.recommendedSettings ?? {})
                builderSettings[key] = data.data.recommendedSettings[key];
            let set = new SetData(data.data.id);
            set.deserialize(data.data);
            this.setData = set;
            dispatchBuilderAction('select_set', set);
            dispatchBuilderAction('put_all_in_view');
            this.loadingStatus = 'loaded';
        } catch (err) {
            this.loadingStatus = 'error';
            this.loadingData = {
                error: 'failed_loading',
                text: `Failed loading set '${this.set_id}'. It may be an invalid set ID.`,
            };
            reportError(err, 'Failed to load set in Share');
        }
    },
    computed: {
        playOasis() {
            if (!contractStore.set?.getAddress() || !this?.setData?.id)
                return '';
            const addr = contractStore.set?.getAddress();
            const token_id = this?.setData?.id || '';
            return `https://testnet.playoasis.xyz/asset/${addr}/${token_id}`;
        },
        mintSquare() {
            if (!contractStore.set?.getAddress() || !this?.setData?.id)
                return '';
            const addr = contractStore.set?.getAddress();
            const token_id = this?.setData?.id || '';
            return `https://mintsquare.io/asset/StarkNet-Testnet/0x${toBN(addr).toString(16)}/${toBN(token_id).toString(10)}`;
        },
    },
    methods: {
        openHelp() {
            window.open('https://briqnft.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f', '_blank');
        },
        openInfoWidget() {
            pushModal(InfoWidget, {
                background: false,
                align: 'justify-end items-center',
                setData: this.setData,
            });
        },
        openSettings() {
            pushModal(Settings);
        },
        fetchAuthor: ticketing(async function () {
            if (!contractStore.set || !this.set_id)
                return;
            try {
                let author = await contractStore.set.ownerOf(this.set_id);
                if (author && author !== '0x0')
                    this.author = author;
            } catch (_) {}
        }),
        screenshot() {
            pushModal(Screenshot, { setData: this.setData, author: this.author });
        },
    },
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
