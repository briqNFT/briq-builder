
<template>
    <Window class="md:!w-4/5 lg:!w-3/5 xl:!w-1/2 !w-auto min-h-[35rem]">
        <template #big-title>Briquify your Ethereum NFT</template>
         <div class="flex flex-nowrap items-center gap-3">
            <div class="w-full bg-accent rounded-md flex justify-around items-center p-2 my-4">
                <button
                    class="flex flex-col justify-center items-center text-sm md:text-md"

                    @click="exporting = 'CONNECT METAMASK WALLET'">
                      <i :class="getStepIcon('CONNECT METAMASK WALLET')"/>
                    Connect Wallet
                </button>
                <i class="text-sm fas fa-arrow-right"/>
                <button
                    class="flex flex-col justify-center items-center text-sm md:text-md"
                    @click="exporting = 'CHOOSE NFTs COLLECTION'">
                     <i :class="getStepIcon('CHOOSE NFTs COLLECTION')"/>
                    Choose your Collection
                </button>
                <i class="text-sm fas fa-arrow-right"/>
                <button
                    class="flex flex-col justify-center items-center text-sm md:text-md"
                    @click="exporting = 'DISPLAY NFTs OWNED'">
                     <i :class="getStepIcon('DISPLAY NFTs OWNED')"/>
                    Choose your NFT
                </button>
            </div>
        </div>
            <div class="flex justify-center" v-if="step(exporting) == step('CONNECT METAMASK WALLET')">
                <Btn v-if="!account" @click="connectMetamask()"> Connect your Wallet</Btn>
                <p v-if="account">{{account}}</p>
            </div>
            <div v-if="step(exporting) == step('CHOOSE NFTs COLLECTION')">
                 <h3 class="text-center break-words">Select Your Collection</h3>
                <div class="flex justify-center" v-for="collection in collections">
                    <Btn class="m-2" :class="(collectionSelected.name == collection.name ? 'text-black dark:border-black' : '')" @click="setCollectionSelected(collection)"> {{collection.name}}</Btn>
                </div>
            </div>
            <div v-if="step(exporting) == step('DISPLAY NFTs OWNED')">
             <h3 v-if="!(balanceNFTs == 0)" class="text-center break-words">Select Your NFT</h3>
             <h3 v-else="" class="text-center break-words">You don't have any NFT in this collection...</h3>
            <div class="flex justify-center" v-for="NFT in NFTs">
                <Btn class="m-2" :class="(NFTSelected.ID == NFT.ID ? 'text-black dark:border-black' : '')" @click="setNFTSelected(NFT)"> {{NFT.ID}} + {{NFT.metadata}}</Btn>
            </div>
            </div>
            <div class='w-full bg-accent rounded-md flex justify-between items-center p-2 my-2 '>
            <Btn
                :disabled="!canGoBack" @click="exporting = exportSteps[step(exporting) - 1]">
                <span class="mx-4">Back</span>
            </Btn>
            <Btn v-if="step(exporting) < step('DISPLAY NFTs OWNED')"
                :disabled="!(canGoForward && ((step(exporting) == step('CONNECT METAMASK WALLET') && walletIsConnected) || (step(exporting) == step('CHOOSE NFTs COLLECTION') && NFTsDisplay)))"
                @click="exporting = exportSteps[step(exporting) + 1]">
                <span class="mx-4">Next</span>
            </Btn>
            <Btn v-if="step(exporting) == step('DISPLAY NFTs OWNED')"
                @click="">
                <span class="mx-4">Briquify</span>
            </Btn>
        </div>
    </Window>
</template>

<script lang="ts">

type ExportSteps =
    | 'CONNECT METAMASK WALLET'
    | 'CHOOSE NFTs COLLECTION'
    | 'DISPLAY NFTs OWNED'

const exportSteps = [
    'CONNECT METAMASK WALLET',
    'CHOOSE NFTs COLLECTION',
    'DISPLAY NFTs OWNED',
];

interface NFT {
    ID: number;
    metadata: string;
}
interface Collection {
    name : string;
    contract: string;
    ABI: string;
}

import GRAOU from '@/assets/GRAOU';


const collections: Array<Collection> = [{
        name: "First Collection",
        contract: "0x1C4Ab6F671eC2527E1b35C0ce5AE18e8cDCdA276",
        ABI: GRAOU.abi,
        }
    ,   {
        name: "Second Collection",
        contract: "0x0",
        ABI:"",}
    ,   {
        name:"Third Collection",
        contract: "0x0",
        ABI:"",}
]

import { defineComponent } from 'vue';
import { ethers } from 'ethers';


export default defineComponent({
    data() {
        return {
            GRAOU,
            exporting: 'CONNECT METAMASK WALLET' as ExportSteps,
            exportSteps,
            account: '' as string,
            collectionSelected: {name:'', contract:'', ABI:''} as Collection,
            collections,
            connectedProvider: undefined,
            NFTSelected: {ID: undefined as number, image:'', metadata:'',} as NFT,
            NFTs: [] as Array<NFT>,
            walletIsConnected: false as boolean,
            NFTsDisplay: false as boolean,
            totalNFTs: 0 as number,
            collectionIsSelected: false as boolean

        };
    },
    emits: ['hide', 'show'],

    computed: {

        balanceNFTs() {
            return(
                this.totalNFTs
            );
        },
        canGoBack() {
            return (
                this.step(this.exporting) >= this.step('CHOOSE NFTs COLLECTION')
            );
        },
        canGoForward() {
            return this.step(this.exporting) < this.step('DISPLAY NFTs OWNED');
        },
    },
    methods: {
        step(step: ExportSteps) {
            return exportSteps.indexOf(step);
        },
            getStepIcon(step: ExportSteps) {
            if (this.step(step) === this.step(this.exporting))
                return 'fas fa-circle';
            else if (this.step(step) > this.step(this.exporting))
                return 'far fa-circle';
            else
                return 'fas fa-check';
        },
            async connectMetamask() {
            if (window.ethereum) {
                try {
                window.ethereum.request({method: 'eth_requestAccounts'})
                .then(result => {this.account = result[0], this.walletIsConnected = true})
                this.connectedProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
                await this.connectedProvider.send("eth_requestAccounts", [])
                }
                catch (error){
                    console.log(error)
                }
                }
        },

        async getNFTsInWallet(collection: Collection) {
            if (this.walletIsConnected && this.collectionIsSelected) {

            try {
            const NFTContract = new ethers.Contract(this.collectionSelected.contract, this.collectionSelected.ABI, this.connectedProvider)
            await NFTContract.balanceOf(this.account).then(balance => {this.totalNFTs = balance.toNumber()})
            for (let i = 0; i < this.totalNFTs; i++){
                await NFTContract.tokenOfOwnerByIndex(this.account, i).then(NFTID => {
                        NFTContract.tokenURI(NFTID).then(NFTURI => {this.NFTs[i] = ({ID: NFTID.toNumber(), metadata:NFTURI})})
                    })
                }
                this.NFTsDisplay = true
                }
                catch (error) {
                    this.NFTs = []
                    this.totalNFTs = 0
                    this.NFTsDisplay = true
                }
            }

            },

        async setCollectionSelected(collection: Collection) {
            this.collectionSelected.name = collection.name
            this.collectionSelected.contract = collection.contract
            this.collectionSelected.ABI = collection.ABI
            this.collectionIsSelected = true
            this.NFTsDisplay = false
            await this.getNFTsInWallet(this.collectionSelected)
        },
        setNFTSelected(NFT: NFT) {

            this.NFTSelected.ID = NFT.ID
            this.NFTSelected.metadata = NFT.metadata
            console.log(this.NFTSelected)
        },

    },
    components: {},
});
</script>
