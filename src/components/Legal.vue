<script setup lang="ts">
</script>

<template>
<h1 class="text-center">briq</h1>
<h2 class="text-center">Legal</h2>
<div class="section">
    <p class="float-right"><router-link :to="{ name: 'Builder' }"><button>Return to builder</button></router-link></p>
</div>
<div class="md:container md:mx-auto">
    <p>This website is owned by S&amp;L Technologies. We're based in Paris.</p>
    <h3>Mentions Légales</h3>
    <p>S&amp;L Technologies<br/>
    SAS au capital de 100 €<br/>
    RCS Bobigny 901 570 754<br/>
    N° TVA : FR 67 901 570 754<br/>
    Siège social : 7 place de l'hôtel de ville 93600 Aulnay-Sous-Bois<br/>
    Président : Sylve Chevet<br/>
    Directeur général : Lancelot de Ferrière<br/>
    </p>
</div>
<div class="md:container md:mx-auto">
    <h3>Privacy</h3>
    <p>Google Analytics tracking: {{ gaStore.agreed ? "on" : "off" }} // <button @click="gaStore.clear()">Reset preferences</button></p>
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
button {
    @apply btn;
}
    .section {
        max-width: 800px;
        margin: auto;

        font-size: 1.2rem;
    }

    .section * {
        text-align: left;
    }

    h3 {
        margin-top: 2rem;
        margin-bottom: 0.5rem;
    }

</style>