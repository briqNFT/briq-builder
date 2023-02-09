<script setup lang="ts">
import { useGenesisStore } from '@/builder/GenesisStore';
import { setsManager } from '@/builder/SetsManager';
import { computed, ComputedRef, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import GenericItemPage from './GenericItemPage.vue';
import { useUnboxHelpers } from '@/builder/Unbox';
import { useSetHelpers } from '../SetComposable';
import { userSetStore } from '@/builder/UserSets';
import { router } from '@/Routes';
import ProgressBar from '@/components/generic/ProgressBar.vue';
import { useBooklet } from '../BookletComposable';
import { backendManager } from '@/Backend';
import { doDownload } from '@/url';

import ItemActivity from './ItemActivity.vue';

import briqIcon from '@/assets/landing/briq-icon.svg';

import AspectLogo from '@/assets/landing/aspect.png';
import MintsquareLogo from '@/assets/landing/mintsquare.svg?skipsvgo';
import { pushModal } from '@/components/Modals.vue';
import ExportSetVue from '../modals/ExportSet.vue';
import { userBookletsStore } from '@/builder/UserBooklets';
import { SetData } from '@/builder/SetData';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { pushPopup } from '@/Notifications';
import DownloadSet from '../modals/DownloadSet.vue';
import Tooltip from '@/components/generic/Tooltip.vue';
import * as starknet from 'starknet';
import { bookletDataStore } from '@/builder/BookletData';
import MenuDropdown from '@/components/generic/MenuDropdown.vue';
import { auctionDataStore, AuctionItemData, getAuctionData, setToAuctionMapping, userBidsStore } from '@/builder/AuctionData';
import { ExplorerContractUrl, ExplorerTxUrl } from '@/chain/Explorer';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import BidModal from './BidModal.vue';
import { externalSetCache } from '@/builder/ExternalSets';
import { Fetchable } from '@/DataFetching';

const route = useRoute();
const genesisStore = useGenesisStore();

const { openSetInBuilder, disassembleSet } = useSetHelpers();
const { createBookletSet } = useUnboxHelpers();

const createSet = () => {
    if (!bookletData.value)
        return;
    openSetInBuilder(createBookletSet(booklet_id.value!, bookletData.value!.name, bookletData.value!.description));
}

const doDisassembly = async () => {
    if (await disassembleSet(set.value!.id))
        router.push({ name: 'Profile' });
}

const chain_id = computed(() => (route.params.network as string) || getCurrentNetwork());

const mode = route.name === 'UserBooklet' ? 'BOOKLET' : 'CREATION';

const useExternalData = ref(false);
const externalSetDataFetchable = computed(() => useExternalData.value && externalSetCache[route.params.network as string][route.params.set_id as string]);
const externalSetData = computed<SetData>(() => useExternalData.value && externalSetDataFetchable.value._data);

const booklet_id = computed(() => {
    if (mode === 'BOOKLET')
        return `${route.params.theme}/${route.params.booklet}`;
    if (externalSetData.value)
        return externalSetData.value.booklet_id;
    return userSetStore.current?.setData[route.params.set_id as string]?.booklet;
});

const setKind = computed(() => booklet_id.value ? 'OFFICIAL' : 'PERSONAL');

const isOwned = computed(() => !!userSetStore.current?.setData[route.params.set_id as string]);

const setData = computed(() => {
    if (mode === 'BOOKLET')
        return undefined;
    if (externalSetData.value)
        return {
            data: externalSetData.value,
            booklet: externalSetData.value.booklet_id,
            created_at: externalSetData.value.created_at,
        }
    return userSetStore.current?.setData[route.params.set_id as string];
});


const set = computed(() => {
    if (mode === 'BOOKLET')
        return setsManager.getBookletSet(booklet_id.value);
    if (externalSetData.value)
        return externalSetData.value;
    return userSetStore.current?.setData[route.params.set_id as string]?.data;
});

let shapeValidity: ComputedRef<number> | undefined;
watch([booklet_id], () => {
    if (mode === 'BOOKLET')
        // Changing shapeValidity isn't reactive itself but we'll always update regardless,
        // because this means we've changed booklet_id.
        shapeValidity = useBooklet(booklet_id.value).shapeValidity;
}, { immediate: true })

const bookletQuery = computed(() => {
    if (!booklet_id.value)
        return undefined;
    return bookletDataStore[chain_id.value][booklet_id.value];
});

const bookletData = computed(() => {
    return bookletQuery.value?._data;
});

// Fallback case for sharing sets.
watchEffect(() => {
    if (mode !== 'CREATION')
        return;
    if (userSetStore.state !== 'WALLET_LOADED')
        return;
    if (userSetStore.currentWallet) {
        if (userSetStore.current?.status === 'FETCHING')
            return;
        if (userSetStore.current?.sets.indexOf(route.params.set_id as string) !== -1) {
            useExternalData.value = false;
            return;
        }
    }
    if (useExternalData.value)
        return;
    // At this point, we assume the set is external and we must load its data explicitly.
    useExternalData.value = true;
})


// Auction stuff.
// TODO: move this elsewhere by splitting this file into more componental chunks.
const auctionId = computed(() => {
    return setToAuctionMapping[route.params.set_id as string];
});

const auctionData = computed<AuctionItemData | undefined>(() => {
    if (!auctionId.value)
        return undefined;
    return getAuctionData(route.params.network as string, auctionId.value)?._data;
});

const showAuctionInterface = computed(() => {
    if (!auctionData.value)
        return false;
    if (auctionData.value.start_date > Date.now() / 1000)
        return false;
    if (auctionData.value.start_date + auctionData.value.duration < Date.now() / 1000)
        return false;
    return true;
})

const hasHighestBid = computed(() => {
    if (!auctionData.value)
        return false;
    return auctionData.value.highest_bid != '0' && auctionData.value.highest_bidder == maybeStore.value?.userWalletAddress;
})

const hasBid = computed(() => {
    if (auctionData.value?.bids.some(x => x.bidder === maybeStore.value?.userWalletAddress))
        return true;
    return !!userBidsStore.current?.getBid(auctionId.value);
})

const hasPendingBid = computed(() => {
    const bid = userBidsStore.current?.getBid(auctionId.value);
    if (!bid)
        return false;
    // If the pending bid is lower than the current highest known bid, don't show it.
    return starknet.number.toBN(bid.bid_amount).cmp(starknet.number.toBN(auctionData.value!.highest_bid)) > 0;
});

const pendingBidString = computed(() => {
    if (!hasPendingBid.value)
        return '';
    const bid = userBidsStore.current?.getBid(auctionId.value);
    return `${readableNumber(bid?.bid_amount)} ${readableUnit(bid?.bid_amount)}`;
})

const cannotBidReason = computed(() => {
    if (!userBidsStore.current)
        return 'You must connect a wallet to bid';
    if (maybeStore.value?.userWalletAddress === 'toto')
        return 'You are not part of the allowlist, and cannot bid until the general auction starts.';
    return '';
})

const doBid = async () => {
    await pushModal(BidModal, { item: auctionId.value })
}

const timerCountdown = (date: number) => {
    let tl = Math.max(date - Date.now(), 0) / 1000;
    const days = Math.floor(tl / 24 / 3600);
    if (days > 0)
        return days > 1 ? `${days} days` : `${days} day`;
    tl -= days * 24 * 3600;
    const hours = Math.floor(tl / 3600);
    if (hours > 0)
        return hours > 1 ? `${hours} days` : `${hours} day`;
    tl -= hours * 3600;
    const minutes = Math.floor(tl / 60);
    if (minutes > 0)
        return minutes > 1 ? `${minutes} days` : `${minutes} day`;
    tl -= minutes * 60;
    const seconds = Math.floor(tl);
    if (seconds > 0)
        return seconds > 1 ? `${seconds} days` : `${seconds} day`;
};

watchEffect(async () => {
    // Hack: always use external data when using auction, so that my dev env (where I use sets I made) works.
    if (auctionId.value)
        useExternalData.value = true;
});

watchEffect(async () => {
    // Touch max bid to reload when that changes.
    auctionData.value?.highest_bidder;
    auctionDataStore[chain_id.value][auctionId.value.split('/')[0]].fetchBids(auctionId.value);
})

// Bidding starknet.id stuff
const bidderAddresses = ref({} as Record<string, Fetchable<string | false>>);
watchEffect(() => {
    if (!auctionData.value?.bids)
        return;
    for (const bid of auctionData.value.bids) {
        if (bidderAddresses.value[bid.bidder] !== undefined)
            continue;
        bidderAddresses.value[bid.bidder] = new Fetchable<string>();
        bidderAddresses.value[bid.bidder].fetch(async () => {
            const response = await fetch('https://app.starknet.id/api/indexer/addr_to_domain?addr=' + starknet.number.toBN(bid.bidder).toString());
            const json = await response.json()
            if (json.domain)
                return json.domain;
            return false;
        });
    }
})

// End of auction stuff

const description = computed(() => {
    if (mode === 'CREATION' && set.value?.description)
        return set.value.description.split('\n\n');
    if (mode === 'BOOKLET' && bookletData.value?.description)
        return bookletData.value.description.split('\n\n');
    return [];
});


const attributes = computed(() => {
    if (mode === 'BOOKLET') {
        if (!bookletData?.value)
            return [];
        const props = bookletData.value?.properties;
        return [
            { name: 'Serial Number', value: `#${bookletData.value.serial_number}` },
            { name: 'Theme', value: genesisStore.themedata[route.params.theme]._data?.name },
            { name: 'Artist', value: props.artist.value },
            { name: 'Year', value: new Date(props.date.value).getFullYear() },
            { name: '# of steps', value: props.nb_steps.value },
            { name: '# of briqs', value: bookletData!.value.briqs.length },
        ]
    } else if (setKind.value === 'OFFICIAL') {
        const setmetadata = bookletData.value;
        if (!setmetadata)
            return [];
        const props = setmetadata.properties;
        return [
            { name: 'Serial Number', value: `#${setmetadata.serial_number}` },
            { name: 'Theme', value: genesisStore.themedata[setmetadata.booklet_id.split('/')[0]]._data?.name },
            { name: 'Artist', value: props.artist.value },
            { name: 'Year', value: new Date(props.date.value).getFullYear() },
            { name: '# of briqs', value: bookletData.value!.briqs.length },
        ]
    } else
        return [
            { name: 'Year', value: new Date(userSetStore.current?.setData?.[route.params.set_id as string]?.created_at ?? Date.now()).getFullYear() },
            { name: '# of briqs', value: set.value?.getNbBriqs() },
        ]
});

const nbItems = computed(() => {
    if (mode === 'BOOKLET')
        return userBookletsStore.current?.booklets?.filter(x => x === booklet_id.value).length ?? '...';
    return 1;
});

const hasPendingActivity = computed(() => {
    if (mode === 'BOOKLET')
        return (userBookletsStore.current?.metadata?.[booklet_id.value]?.updates.length ?? 0) > 0;
    return userSetStore.current?.metadata[route.params.set_id as string]?.status === 'TENTATIVE';
});


const copySetId = () => {
    navigator.clipboard.writeText(route.params.set_id);
    pushPopup('info', 'Set ID copied');
}

const downloadPng = () => {
    doDownload(previewURL.value, 'briq.png');
}

const shareUrl = computed(() => `https://${window.location.hostname}${route.path}`);

const encodedTweet = computed(() => {
    if (externalSetData.value)
        return encodeURIComponent('Check out this cool NFT built with @briqNFT!🧱');
    return encodeURIComponent('I\'ve built this with @briqNFT and you can too!🧱');
});

const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl.value);
};

const modelViewerLoading = ref(true);
let modelViewerLoadingPromise: Promise<any>;

if (mode === 'CREATION') {
    modelViewerLoadingPromise = import('@google/model-viewer');
    modelViewerLoadingPromise.then(() => modelViewerLoading.value = false);
}

const previewURL = computed(() => backendManager.getPreviewUrl(set.value?.id, chain_id.value));

const token_decimal = computed(() => {
    if (route.params.set_id)
        return starknet.number.toBN(route.params.set_id as string).toString();
    return bookletData.value?.token_id || '0';
})

const view = ref((mode === 'BOOKLET' ? 'BOOKLET' : 'PREVIEW') as 'PREVIEW' | '3D' | 'BOOKLET');
</script>

<template>
    <GenericItemPage
        :status="bookletQuery?._status ?? (set ? 'LOADED' : 'FETCHING')"
        :attributes="attributes">
        <template #full-image="{ status }">
            <div class="relative h-[24rem] md:h-[36rem] bg-grad-lightest rounded-lg overflow-hidden border-grad-light border">
                <Tooltip
                    v-if="hasPendingActivity"
                    tooltip="Some items of this type have pending transactions. Transaction failure could lead to UI changes.">
                    <div class="absolute top-4 select-none right-4 z-10 rounded bg-info-info bg-opacity-10 text-sm text-info-info px-2 py-1">
                        Pending activity
                    </div>
                </Tooltip>
                <template v-if="status === 'LOADED'">
                    <div class="flex justify-center items-center h-full w-full select-none">
                        <component
                            v-show="view === '3D'" v-if="mode === 'CREATION'"
                            :poster="previewURL"
                            class="w-full h-full"
                            :exposure="0.9"
                            :is="'model-viewer'" shadow-intensity="0.5" shadow-softness="1" disable-pan camera-controls auto-rotate="true"
                            :src="backendManager.getRoute(`model/${chain_id}/${set.id}.glb`)"/>
                        <div v-if="booklet_id" v-show="view === 'BOOKLET'" class="w-full h-full  p-4 xl:p-8 xl:pb-10 bg-contain bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${genesisStore.coverBookletRoute(booklet_id!)}), url(${genesisStore.coverBookletRoute(booklet_id!, true)})` }"/>
                        <div
                            v-if="mode === 'CREATION'" v-show="view === 'PREVIEW'" class="w-full h-full p-4 lg:p-12 xl:p-16 bg-contain bg-origin-content bg-center bg-no-repeat"
                            :style="{ backgroundImage: `url(${previewURL})`, backgroundColor: set?.background_color ? `#${set.background_color}` : undefined }"
                            :src="previewURL"/>
                        <!-- Buttons to switch views -->
                        <div class="absolute top-4 left-4 flex flex-col gap-4" v-if="mode === 'CREATION'">
                            <Btn no-style :class="`${ view === 'PREVIEW' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" @click="view='PREVIEW'"><img class="max-w-full max-h-full" :src="previewURL"></Btn>
                            <Btn no-style :class="`${ view === '3D' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20 p-0 text-xl relative`" @click="view='3D'"><img class="absolute z-[-1] p-2 max-w-full max-h-full" :src="previewURL"><div class="w-full h-full flex justify-center items-center backdrop-blur-[2px] rounded-md bg-grad-lightest bg-opacity-70"><i class="far fa-360-degrees"/></div></Btn>
                            <Btn no-style :class="`${ view === 'BOOKLET' ? 'border-primary' : ''} border border-bg-lighter bg-grad-lightest rounded hover:border-primary w-20 h-20`" v-if="bookletData" @click="view='BOOKLET'"><img :src="genesisStore.coverBookletRoute(booklet_id!, true)"></Btn>
                        </div>
                    </div>
                </template>
                <template v-else-if="status === 'FETCHING'">
                    <p>Loading image</p>
                </template>
                <div v-else><p>Error while loading data</p></div>
            </div>
        </template>
        <template #quick_actions>
            <MenuDropdown v-if="mode === 'CREATION'" icon no-background no-marker :must-click="true" class="!h-8 px-2 font-normal text-sm">
                <template #button>
                    <i class="fa-regular fa-share-nodes text-lg"/> <span class="font-medium">Share</span>
                </template>
                <Btn no-background ico class="text-sm justify-start font-normal" @click="copyShareLink"><i class="far fa-copy mr-2"/> Copy link</Btn>
                <a
                    target="_blank"
                    :href="`https://twitter.com/intent/tweet?text=${encodedTweet}&url=${encodeURIComponent(shareUrl)}`">
                    <Btn no-background ico class="text-sm justify-start font-normal"><i class="fa-brands fa-twitter text-md mr-2"/> Share on Twitter</Btn>
                </a>
            </MenuDropdown>
            <MenuDropdown v-if="mode === 'CREATION'" icon no-background no-marker :must-click="true" class="!h-8 px-2 font-normal text-sm">
                <template #button>
                    <i class="far fa-cloud-arrow-down text-lg"/> <span class="font-medium">Download</span>
                </template>
                <Btn no-background class="text-sm justify-start font-normal" @click="downloadPng">Download image</Btn>
                <Btn no-background class="text-sm justify-start font-normal" @click="pushModal(DownloadSet, { setId: set?.id })">Download set data</Btn>
            </MenuDropdown>
        </template>
        <template #default>
            <h1>{{ set?.name || bookletData?.name }}</h1>
            <template v-if="mode === 'BOOKLET'">
                <h5 class="mt-1">Booklet<span class="font-normal"> - {{ genesisStore.themedata[route.params.theme]._data?.name }}</span></h5>
                <div v-if="route.params.theme === 'starknet_planet'" class="mb-8">
                    <p class="mt-6 mb-4 font-medium whitespace-pre-line">{{ description?.[0] ?? 'Loading' }}</p>
                    <p
                        v-for="par, i in description?.slice(1) || []" :key="i"
                        class="whitespace-pre-line mb-2 text-justify">
                        {{ par }}
                    </p>
                </div>
                <div v-else class="mb-8 mt-6">
                    <p
                        v-for="par, i in description || []" :key="i"
                        class="whitespace-pre-line mb-2 text-justify">
                        {{ par }}
                    </p>
                </div>
                <template v-if="!set">
                    <h2>Unstarted booklet</h2>
                    <p>Click on the button below to open the briq builder and create your official Genesis set.</p>
                </template>
                <template v-else-if="shapeValidity !== 1">
                    <h2>Work in progress</h2>
                    <p>Your booklet set is unfinished. Make sure that it has all the pieces positioned at the right place to be able to mint it.</p>
                </template>
                <template v-else>
                    <h2>Ready to mint</h2>
                    <p>Your set is now 100% completed. You can now mint the Official Genesis Set.</p>
                </template>
                <div class="rounded border border-grad-light overflow-hidden mt-4 mb-10">
                    <div class="p-6 flex justify-between items-stretch bg-grad-lightest gap-4">
                        <div class="flex-1">
                            <h5 class="font-normal text-grad-dark">Progress</h5>
                            <p class="text-xl font-semibold pt-1 flex justify-center items-center gap-3">
                                {{ Math.floor(shapeValidity * 100) || 0 }}%<ProgressBar class="h-3" :percentage="shapeValidity * 100 || 0"/>
                            </p>
                        </div>
                        <template v-if="!set">
                            <Btn class="!h-auto text-md px-6 w-fit" @click="createSet()">Start building</Btn>
                        </template>
                        <template v-else-if="shapeValidity !== 1">
                            <Btn class="!h-auto text-md px-6 w-fit" @click="openSetInBuilder(set!.id)">Keep building</Btn>
                        </template>
                        <template v-else>
                            <Btn v-if="shapeValidity === 1" class="!h-auto text-md px-6 " secondary @click="pushModal(ExportSetVue, { setId: set!.id })">Mint</Btn>
                            <Btn class="!h-auto text-md px-6 w-max" @click="openSetInBuilder(set!.id)">Open builder</Btn>
                        </template>
                    </div>
                    <div class="p-6 py-4 flex flex-col gap-4">
                        <p class="text-grad-dark">Currently owned: <span class="text-grad-darkest">{{ nbItems }}</span></p>
                    </div>
                </div>
                <h2>Want to list your booklet?</h2>
                <p>Seeling your booklet means you will no longer be able to mint the authenticated officiel set.</p>
                <div class="flex gap-2 mt-4 mb-10">
                    <a :href="`https://aspect.co/asset/0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4/${token_decimal}`" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                    <a :href="`https://mintsquare.io/asset/starknet/0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4/${token_decimal}`" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                </div>
                <div v-if="booklet_id">
                    <Suspense>
                        <ItemActivity type="booklet" :user="maybeStore?.user_id" :network="chain_id" :item="booklet_id"/>
                    </Suspense>
                </div>
            </template>
            <template v-else>
                <h5 class="mt-1">
                    {{ setKind === 'OFFICIAL' ? 'Official set' : 'Personal creation' }}<span class="font-normal"> - minted</span>
                </h5>
                <div v-if="route.params.theme === 'starknet_planet'" class="mb-8">
                    <p class="mt-6 mb-4 font-medium whitespace-pre-line">{{ description?.[0] ?? 'Loading' }}</p>
                    <p
                        v-for="par, i in description?.slice(1) || []" :key="i"
                        class="whitespace-pre-line mb-2 text-justify">
                        {{ par }}
                    </p>
                </div>
                <div v-else class="mb-8 mt-6">
                    <p
                        v-for="par, i in description || []" :key="i"
                        class="whitespace-pre-line mb-2 text-justify">
                        {{ par }}
                    </p>
                </div>
                <p class="my-6 font-semibold cursor-pointer select-none w-fit" @click="copySetId">
                    ID: <span class="font-normal">{{ `${route.params.set_id.slice(0, 6)}...${route.params.set_id.slice(-4)}` }} <i class="far fa-copy"/></span>
                </p>
                <div class="rounded border border-grad-light overflow-hidden mb-10">
                    <!-- latter part just for VSCode to understand things -->
                    <template v-if="showAuctionInterface && auctionData">
                        <!-- Auction -->
                        <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                            <div v-if="auctionData.highest_bid !== '0'">
                                <h5 class="font-normal text-grad-dark">Winning bid</h5>
                                <p class="text-xl font-semibold pt-1">
                                    {{ readableNumber(auctionData.highest_bid) }} {{ readableUnit(auctionData.highest_bid) }}
                                </p>
                            </div>
                            <div v-else>
                                <h5 class="font-normal text-grad-dark">Minimum Bid</h5>
                                <p class="text-xl font-semibold pt-1">
                                    {{ readableNumber(auctionData.minimum_bid) }} {{ readableUnit(auctionData.minimum_bid) }}
                                </p>
                            </div>
                            <div class="flex justify-between items-stretch gap-2">
                                <Btn v-if="!hasPendingBid" :disabled="hasPendingActivity || !!cannotBidReason" @click="doBid" :secondary="hasHighestBid" class="!h-auto text-md px-6">Make a {{ hasHighestBid ? 'higher ' : '' }} bid</Btn>
                                <template v-else>
                                    <Btn secondary :disabled="hasPendingActivity || !!cannotBidReason" @click="doBid" class="!h-auto text-md px-4 font-normal">
                                        <i class="text-md far fa-loader animate-spin mr-3"/>  Make a higher bid
                                    </Btn>
                                </template>
                            </div>
                        </div>
                        <div class="p-6 py-4 flex flex-col gap-4">
                            <p v-if="hasHighestBid" class="text-grad-dark">You currently have the winning bid.</p>
                            <p v-else-if="hasPendingBid" class="text-grad-dark"><i class="text-info-info far fa-circle-exclamation"/> You have a pending winning bid at {{ pendingBidString }}.</p>
                            <p v-else-if="hasBid" class="text-grad-dark"><i class="text-info-error far fa-circle-exclamation"/> You have been outbid by another user.</p>
                            <p>Auction ends in <span class="font-medium">{{ timerCountdown(auctionData.end_date) }}</span></p>
                        </div>
                    </template>
                    <template v-else>
                        <div class="p-6 flex justify-between items-stretch bg-grad-lightest">
                            <div>
                                <h5 class="font-normal text-grad-dark">briqs used</h5>
                                <p class="text-xl font-semibold pt-1">
                                    <span class="w-6 h-6 inline-flex justify-center items-center bg-primary-lightest bg-opacity-50 rounded-[50%]"><briqIcon :width="12"/></span> {{ set?.getNbBriqs?.() }}
                                </p>
                            </div>
                            <div class="flex justify-between items-stretch gap-2">
                                <RouterLink v-if="set?.id" :to="`/briqmas_next_day?token=${set.id}`"><Btn v-if="isOwned && booklet_id === 'briqmas/briqmas_tree'" class="!h-full text-md px-6 py-0">View in<br>living room</Btn></RouterLink>
                                <Btn v-if="isOwned" :disabled="hasPendingActivity" secondary @click="doDisassembly" class="!h-auto text-md px-6">Disassemble</Btn>
                            </div>
                        </div>
                        <div class="p-6 py-4 flex flex-col gap-4">
                            <p><span class="font-medium">Created on: </span> {{ new Date(setData?.created_at).toLocaleString("en-uk", { dateStyle: "full", timeStyle: "short" }) }}</p>
                        </div>
                    </template>
                </div>
                <template v-if="auctionData">
                    <div>
                        <h4>Latest bids</h4>
                        <div class="mt-4 flex flex-col bg-grad-lightest rounded border border-grad-light">
                            <p v-if="!auctionData?.bids || auctionData.bids?.length === 0" class="px-4 py-3 text-sm italic text-center">...There are currently no bids...</p>
                            <a
                                v-else
                                v-for="bid, i in auctionData.bids.slice(0, 10)" :key="i"
                                :href="ExplorerTxUrl(bid.tx_hash)" target="_blank"
                                class="block border-b border-grad-light last:border-none px-4 py-3">
                                <div class="flex justify-between">
                                    <a :href="ExplorerContractUrl(bid.bidder)" target="_blank">
                                        <p v-if="bidderAddresses[bid.bidder]._data">By <span class="text-primary">{{ bidderAddresses[bid.bidder]._data }}</span></p>
                                        <p v-else>By <span class="text-primary">{{ bid.bidder.substring(0, 8) + "..." + bid.bidder.slice(-8) }}</span></p>
                                    </a>
                                    <p>{{ readableUnit(bid.bid) }} {{ readableNumber(bid.bid) }} <i class="pl-2 fa-solid fa-arrow-up-right-from-square"/></p>
                                </div>
                            </a>
                            <p v-if="auctionData?.bids?.length > 10" class="px-4 py-3 text-sm italic text-center">...Older bids are hidden...</p>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div>
                        <h4>See on</h4>
                        <p class="flex gap-3 mt-4 mb-10">
                            <a :href="`https://aspect.co/asset/0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672/${token_decimal}`" rel="noopener" target="_blank"><Btn secondary><img class="w-4 mr-3" :src="AspectLogo"> Aspect</Btn></a>
                            <a :href="`https://mintsquare.io/asset/starknet/0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672/${token_decimal}`" rel="noopener" target="_blank"><Btn secondary><MintsquareLogo class="mr-3" height="1rem" width="1rem"/> Mintsquare</Btn></a>
                        </p>
                    </div>
                    <div v-if="set?.id">
                        <Suspense>
                            <ItemActivity type="set" :network="chain_id" :item="set.id"/>
                        </Suspense>
                    </div>
                </template>
            </template>
        </template>
    </GenericItemPage>
</template>
