<script setup lang="ts">
import Button from "../generic/Button.vue";
import Settings from '../builder/modals/Settings.vue';
import TransactionsMin from './TransactionsMin.vue';
import { transactionsManager } from '../../builder/Transactions';
</script>

<template>
    <div class="absolute right-0 top-0 px-4 py-4 flex flex-row gap-2 pointer-events-none">
        <div class="flex flex-col items-end">
        <div :class="' max-h-screen overflow-auto flex flex-nowrap flex-col justify-start content-end' + (expandedCW ? ' expanded' : ' unexpanded')">
            <Button class="pointer-events-auto" @click="CWClick">{{ CWTitle() }}
                <i v-if="transactionsManager.transactions.length" class="fas fa-spinner animate-spin-slow"></i>
            </Button>
            <div class="my-2">
                <div class="flex flex-col flex-nowrap gap-1">
                    <Button v-if="contractStore.isConnected" @click="expandedCW = false; $store.dispatch('wallet/disconnect')">Disconnect</Button>
                </div>
            </div>
        </div>
        <div :class="'relative bg-briq rounded-md ' + (expandedCW ? 'visible pointer-events-auto' : 'invisible')">
            <TransactionsMin/>
        </div>
        </div>
        <div :class="' max-h-screen overflow-auto flex flex-nowrap flex-col justify-start content-end' + (expanded ? ' expanded' : ' unexpanded')">
            <Button class="pointer-events-auto" @click="expanded = !expanded"><i class="mx-1 fas fa-bars"></i><span class="mx-1">Menu</span></Button>
            <div class="my-2">
                <div class="flex flex-col flex-nowrap gap-1">
                    <Button @click="openHelp">Help</button>
                    <Button @click="setModal(Settings)">Settings</button>
                    <Button @click="$router.push({ path: '/legal' })">Legal / Privacy</button>
                    <!--<Button @click="$router.push({ path: '/admin' })">Admin</button>-->
                </div>
                <div class="flex flex-col content-end my-8">
                    <Button class="my-1" tooltip="Create a new WIP set." @click="newSet">New</Button>
                    <Button class="my-1" tooltip="Copy a new WIP set." @click="copySet">Copy</Button>
                    <Button class="my-1" tooltip="Delete the current WIP set." @click="deleteSet">Delete</button>
                    <Button class="my-1" tooltip="Import a local set." @click="importSet">Import file</button>
                    <div class="my-2"></div>
                    <Button class="my-1" tooltip="Rename the current set" @click="rename">Rename</button>
                    <Button class="my-1" tooltip="Export the set to the blockchain" @click="exportSet">Export</button>
                </div>
                <div class="flex flex-col content-end my-4">
                    <h4 class="text-center font-bold twshadow">WIP SETS</h4>
                    <Button v-for="wipset in wipSets"
                        class="my-1 h-auto"
                        @click="selectSet(wipset.id)"
                        :disabled="set.id == wipset.id"
                        :tooltip="(set.id == wipset.id) ? 'Set ' + set.id + ' is active.' : 'Click to switch to set ' + (wipset.name || wipset.id)"
                        >{{ wipset.name || wipset.id }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { openSelector } from '../WalletSelector.vue';

import { setModal } from '../MiddleModal.vue';

import RenameSet from './modals/RenameSet.vue';
import ExportSet from './modals/ExportSet.vue';

import { defineComponent, toRef, ref } from "vue";
export default defineComponent({
    data() {
        return {
            expanded: false,
            expandedCW: false,
            openSelector: openSelector,
            contractStore: this.$store.state.wallet,
            set: toRef(this.$store.state.builderData, "currentSet"),
            wipSets: toRef(this.$store.state.builderData, "wipSets"),
            transactionsManager
        };
    },
    inject: ["messages"],
    methods: {
        setModal,

        CWTitle() {
            if (this.contractStore.isConnected)
                return this.contractStore.userWalletAddress.substr(0, 5) + '...' + this.contractStore.userWalletAddress.substr(-5, 5);
            return "Connect Wallet";
        },
        CWClick() {
            if (this.contractStore.isConnected)
                this.expandedCW = ! this.expandedCW;
            else
                this.openSelector = true;
        },

        titleText: function() {
            let ret = "Briq";
            if (this.contractStore.isConnected)
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
    @apply bg-black bg-opacity-40 rounded-md md:bg-transparent;
    @apply pointer-events-auto;
}
.unexpanded {
    overflow: hidden;
}
.expanded > div {
    visibility: visible;
}
.unexpanded > div {
    visibility: hidden;
}
</style>
