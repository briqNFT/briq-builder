<script setup lang="ts">
import { maybeStore } from '@/chain/WalletLoading';
import Footer from '../landing_page/Footer.vue';
import Header from '../landing_page/Header.vue';
import jsondata from './file.json';

const declare = async () => {
    console.log('Parameters', {
        contract: JSON.stringify(jsondata),
        classHash: '0x59be27cf204cf5dc03e4a2c1289ba6378af503651c00ca2d0d602c0aab8e0c8',
    })
    console.log(await maybeStore.value!.signer.declare({
        contract: JSON.stringify(jsondata),
        classHash: '0x59be27cf204cf5dc03e4a2c1289ba6378af503651c00ca2d0d602c0aab8e0c8',
    }));
}

</script>

<template>
    <Header/>
    <div class="container m-auto py-8">
        <h1 class="text-center">Test</h1>
        <Btn @click="declare">Send Declare Transaction</Btn>
    </div>
    <Footer/>
</template>