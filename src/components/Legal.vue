<script setup lang="ts">
</script>

<template>
    <div class="alternate-buttons container mx-auto py-4 md:py-8 px-2 font-normal text-lg">
        <div class="w-auto lg:w-3/4 mx-auto">
            <div class="py-2 md:py-4">
                <h1 class="text-center my-2 briq-logo">briq</h1>
                <h2 class="text-center text-2xl">LEGAL</h2>
            </div>
            <div class="float-right">
                <p><router-link :to="{ name: 'Builder' }"><Btn>Return to builder</Btn></router-link></p>
            </div>
            <div>
                <p>This website is owned by S&amp;L Technologies. We're based in Paris.</p>
                <h3 class="text-2xl my-2 font-bold">Mentions Légales</h3>
                <p>S&amp;L Technologies<br/>
                SAS au capital de 100 €<br/>
                RCS Bobigny 901 570 754<br/>
                N° TVA : FR 67 901 570 754<br/>
                Siège social : 7 place de l'hôtel de ville 93600 Aulnay-Sous-Bois<br/>
                Président : Sylve Chevet<br/>
                Directeur général : Lancelot de Ferrière<br/>
                </p>
            </div>
            <div class="my-4">
                <h3 class="text-2xl my-2 font-bold">Privacy</h3>
                <p>Google Analytics tracking: {{ gaStore.agreed ? "on" : "off" }} // <Btn @click="gaStore.clear()">Reset preferences</Btn></p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { gaStore } from '../ga.js'
export default defineComponent({
    computed: {
        gaStore: function () { return gaStore; }
    }
})
</script>


<style scoped>
</style>