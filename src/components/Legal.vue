<script setup lang="ts">
</script>

<template>
<h1>briq</h1>
<h2>Legal</h2>
<div class="section">
    <p class="goHome"><router-link to="/"><button>Return to builder</button></router-link></p>
</div>
<div class="section">
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
<div class="section">
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

    .goHome button {
        padding: 1rem;
        margin-bottom: 1rem;
        float:right;
    }
</style>