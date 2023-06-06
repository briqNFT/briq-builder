<script setup lang="ts">
import Header from '@/components/landing_page/Header.vue';
import Footer from '@/components/landing_page/Footer.vue';
</script>

<style scoped>
a {
    @apply text-primary;
}
h3 {
    @apply mt-4 mb-2;
}
</style>

<template>
    <Header/>
    <div class="container mx-auto py-4 md:py-8 px-2 font-normal text-md">
        <div class="w-auto lg:w-3/4 mx-auto">
            <div>
                <p>This website is owned by S&amp;L Technologies. We're based in Paris.</p>
                <h3>Mentions Légales</h3>
                <p>
                    <span class="font-medium">S&amp;L Technologies<br></span>
                    SAS au capital de 100 €<br>
                    RCS Bobigny 901 570 754<br>
                    N° TVA : FR 67 901 570 754<br>
                    Siège social : 7 place de l'hôtel de ville 93600 Aulnay-Sous-Bois<br>
                    Président : Sylve Chevet<br>
                    Directeur général : Lancelot de Ferrière<br>
                </p>
            </div>
            <div class="my-4">
                <h3>Privacy</h3>
                <p>
                    Google Analytics tracking: {{ gaStore.agreed ? 'on' : 'off' }} //
                    <Btn @click="gaStore.clear()" secondary>Reset preferences</Btn>
                </p>
            </div>
            <div class="my-4">
                <h3>Legal Documents</h3>
                <p>Terms of Sale: <router-link :to="{ name: 'Legal Doc', params: { doc: '2022-05-05-terms-of-sale' } }">HTML</router-link> / <a href="/legal/2022-05-05-terms-of-sale.pdf" target="blank_">PDF</a></p>
                <p>Website Terms & Conditions: <router-link :to="{ name: 'Legal Doc', params: { doc: '2022-05-05-terms-conditions' } }">HTML</router-link> / <a href="/legal/2022-05-05-terms-conditions.pdf" target="blank_">PDF</a></p>
                <p>Privacy Policy: <router-link :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-privacy-policy' } }">HTML</router-link> / <a href="/legal/2022-09-23-privacy-policy.pdf" target="blank_">PDF</a></p>
            </div>
        </div>
    </div>
    <Footer/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { gaStore } from '../ga.js';
export default defineComponent({
    computed: {
        gaStore: function () {
            return gaStore;
        },
    },
});
</script>

<style scoped></style>
