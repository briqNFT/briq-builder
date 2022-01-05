<script setup lang="ts">
import Button from "../generic/Button.vue";
import Settings from '../builder/modals/Settings.vue';
import TransactionsMin from './TransactionsMin.vue';
import BriqDetails from './BriqDetails.vue';
import BlockchainStatus from './BlockchainStatus.vue';
</script>

<template>
    <div class="absolute right-0 top-0 px-4 py-2 md:py-4 max-h-screen flex flex-col lg:flex-row lg:items-start items-end gap-2 pointer-events-none">
        <BlockchainStatus class="max-h-screen"/>
        <div :class="'w-32 max-h-screen overflow-auto flex flex-nowrap flex-col justify-start content-end' + (expanded ? ' expanded' : ' unexpanded')">
            <Button class="pointer-events-auto" tooltip="Access local set operations, settings, etc." @click="expanded = !expanded"><i class="mx-1 fas fa-bars"></i><span class="mx-1">Menu</span></Button>
            <div class="my-2">
                <div class="flex flex-col flex-nowrap gap-1">
                    <Button @click="openHelp">Help</button>
                    <Button @click="setModal(Settings)">Settings</button>
                    <Button @click="$router.push({ path: '/legal' })">Legal / Privacy</button>
                    <Button @click="$router.push({ path: '/' })">Home</button>
                    <!--<Button @click="$router.push({ path: '/admin' })">Admin</button>-->
                </div>
                <div class="flex flex-col content-end my-4">
                    <h4 class="text-center font-bold twshadow">LOCAL SETS</h4>
                    <Button v-for="wipset in wipSets"
                        class="my-1 h-auto break-all"
                        @click="selectSet(wipset.id)"
                        :disabled="set.id == wipset.id"
                        :tooltip="(set.id == wipset.id) ? 'Set ' + set.id + ' is active.' : 'Click to switch to set ' + (wipset.name || wipset.id)"
                        >{{ wipset.name || wipset.id }} <i v-if="isViewOnly(wipset.id)" class="fas fa-cloud"></i></button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { setModal } from '../MiddleModal.vue';

import { transactionsManager } from '../../builder/Transactions';
import { setsManager } from '../../builder/SetsManager';

import WalletSelectorVue from '../WalletSelector.vue';

import RenameSet from './modals/RenameSet.vue';
import ExportSet from './modals/ExportSet.vue';

import { defineComponent, toRef, ref } from "vue";
export default defineComponent({
    data() {
        return {
            expanded: false,
            expandedCW: false,
            contractStore: this.$store.state.wallet,
            wallet: this.$store.state.wallet,
            set: toRef(this.$store.state.builderData, "currentSet"),
            transactionsManager
        };
    },
    inject: ["messages"],
    computed: {
        isConnected() {
            return this.wallet.userWalletAddress;
        },
        wipSets() {
            return setsManager.setList.map(x => setsManager.setsInfo[x].local).filter(x => x);
        }
    },
    methods: {
        setModal,

        isViewOnly(sid: string) {
            return setsManager.getInfo(sid).status !== 'LOCAL';
        },

        CWTitle() {
            if (this.isConnected)
                return this.contractStore.userWalletAddress.substr(0, 5) + '...' + this.contractStore.userWalletAddress.substr(-5, 5);
            return "Connect Wallet";
        },
        CWNet() {
            if (!this.isConnected)
                return '';
            return this.wallet.signer.baseUrl.search("mainnet") !== -1 ? 'mainnet' : 'testnet';
        },
        CWClick() {
            if (this.isConnected)
                this.expandedCW = ! this.expandedCW;
            else
                setModal(WalletSelectorVue);
        },

        titleText: function() {
            let ret = "Briq";
            if (this.isConnected)
                ret += ': ' + this.contractStore.userWalletAddress.substr(0, 5) + '...' + this.contractStore.userWalletAddress.substr(-5, 5);
            return ret;
        },

        newSet: function() {
            this.$store.dispatch("builderData/create_wip_set");
        },
        copySet: function() {
            let data = this.set.serialize();
            delete data.id;
            this.$store.dispatch("builderData/create_wip_set", data);
        },
        async importSet() {
            let fileHandles = await window.showOpenFilePicker();
            for (let fileHandle of fileHandles)
            {
                try
                {
                    let file = await fileHandle.getFile();
                    let contents = JSON.parse(await file.text());
                    this.$store.dispatch("builderData/create_wip_set", contents);
                }
                catch(err) {
                    this.messages.pushMessage("Error while loading file " + fileHandle.name + " - check console for details");
                    console.log(err);
                }
            }
        },
        deleteSet: function() {
            this.$store.dispatch("builderData/delete_wip_set", this.set.id);
        },
        selectSet: function(setId: number) {
            this.$store.dispatch("builderData/select_set", setId);
        },
        rename: function() {
            setModal(RenameSet, { set: this.set.id });
        },
        exportSet: function() {
            setModal(ExportSet, { set: this.set.id });
        },
        openHelp() {
            window.open('https://insidious-ginger-0f9.notion.site/briq-help-center-4a4958337970483dbfc2c1184290b42f','_blank');
        }
    }
})
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
