<script setup lang="ts">
import { inject, ref } from 'vue';
import { setsManager } from '@/builder/SetsManager';
import { SetData } from '@/builder/SetData';
import { useBooklet } from '../BookletComposable';
import type { ChainBriqs } from '@/builder/ChainBriqs';
import { hexUuid } from '@/Uuid';
import builderSettings from '@/builder/graphics/Settings';
import contractStore from '@/chain/Contracts';
import { walletStore2 } from '@/chain/Wallet';
import { backendManager } from '@/Backend';

const props = defineProps<{
    metadata: {
        set: SetData;
    }
}>();

const set = props.metadata.set;

const chainBriqs = inject<ChainBriqs>("chainBriqs")!;

/////////
// Steps

const steps = ["ERROR", "RECAP"] as const;
type STEP = typeof steps[number];
const current_step = ref("RECAP" as STEP);

const at = (step: STEP) => steps.indexOf(step);
const getStepIcon = (step: STEP) => 'fas fa-check';
const getPageOffset = (step: STEP) => {
    return at(step) * 100;
}

/////////
// Booklet data

const { getImgSrc } = useBooklet();

/////////
// Export

const doSetExport = async () => {
    if (!contractStore.set)
        return;

    let setData = set.serialize();
    let exportSet = new SetData(setData.id);
    exportSet.deserialize(setData);
    try {
        exportSet.swapForRealBriqs(chainBriqs);
    } catch (err) {
        console.warn(err);
        return;
    }
    let token_hint = hexUuid();
    let exportData = exportSet.serialize();
    exportData.recommendedSettings = builderSettings.getSettingsForSetExport();
    const exportID = contractStore.set.precomputeTokenId(walletStore2.userWalletAddress, token_hint);

    let TX = await contractStore.set.assemble_with_box(
        walletStore2.userWalletAddress,
        token_hint,
        exportData.briqs,
        // Point to the 'permanent' API. TODO: IFPS?
        'https://api.briq.construction/' + backendManager.getMetadataRoute(exportID),
    );
}

</script>

<template>
    <Window class="md:!w-4/5 lg:!w-3/5 xl:!w-1/2 !w-auto min-h-[35rem]">
        <template #big-title>Minting / {{ set.getName() }} </template>
        <div class="overflow-hidden w-full">
            <div
                class="flex flex-nowrap relative"
                :style="{ left: `-${getPageOffset(current_step)}%` }">
                <div class="flex-none w-full">
                    <h2 class="text-center">Error</h2>
                    <div class="text-lg font-semibold">
                        <p>Some Text</p>
                    </div>
                </div>
                <div class="flex-none w-full flex items-center justify-around flex-col gap-2">
                    <p>{{ set.getNbBriqs() }} briqs</p>
                    <div class="flex w-full justify-around items-center">
                        <img :src="getImgSrc('spaceman', 8)"/>
                        <div>
                            <div class="w-[8rem] py-4 bg-accent rounded text-center font-semibold"><p>briq<br/>Seal of Authenticity</p></div>
                        </div>
                    </div>
                    <div class="flex flex-nowrap items-center gap-3 w-full">
                        <div class="w-full bg-accent rounded-md flex justify-around items-center p-2 my-4">
                            <button
                                class="flex flex-col justify-center items-center text-sm md:text-md"
                                :disabled="at(current_step) > at('CONFIRMATION')"
                                @click="current_step = 'METADATA'">
                                <i :class="getStepIcon('METADATA')"/>Details
                            </button>
                            <i class="text-sm fas fa-arrow-right"/>
                            <button
                                class="flex flex-col justify-center items-center text-sm md:text-md"
                                :disabled="at(current_step) > at('CONFIRMATION')"
                                @click="current_step = 'PREVIEW'">
                                <i :class="getStepIcon('PREVIEW')"/>Preview
                            </button>
                            <i class="text-sm fas fa-arrow-right"/>
                            <button
                                class="flex flex-col justify-center items-center text-sm md:text-md"
                                :disabled="at(current_step) > at('CONFIRMATION')"
                                @click="current_step = 'CONFIRMATION'">
                                <i :class="getStepIcon('CONFIRMATION')"/>Confirmation
                            </button>
                            <i class="text-sm fas fa-arrow-right"/>
                            <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="true">
                                <i :class="getStepIcon('TWEET')"/> Export
                            </button>
                        </div>
                    </div>
                    <p><Btn @click="doSetExport">Mint</Btn></p>
                </div>
            </div>
        </div>
    </Window>
</template>
