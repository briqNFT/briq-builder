<template>
    <div v-if="needsGAPopup" id="ga-popup">
        <p>Hey ! We'd love to count you in our traffic stats.</p>
        <div class="buttons">
            <button @click="refuseGA">Refuse</button>
            <button @click="acceptGA">Allow Google Analytics</button>
        <!-- <button @click="clearGA">Clear</button> -->
        </div>
        <p class="legal"><router-link to="/legal">Legal / Privacy</router-link></p>
    </div>
</template>

<script type="ts">
import { defineComponent } from 'vue';
import { gaStore } from '../ga.js'
export default defineComponent({
    data() {
        return {
            needsGAPopup: gaStore.needGAPopup()
        }
    },
    methods: {
        acceptGA: function() {
            gaStore.agree();
            this.needsGAPopup = false;
        },
        refuseGA: function() {
            gaStore.reject();
            this.needsGAPopup = false;
        },
        clearGA: function() {
            gaStore.clear();
            this.needsGAPopup = true;
        }
    }
});
</script>

<style scoped>
#ga-popup {
    width: 17rem;
    background: #fff;
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.2);
    border: 2px solid #ccc;
    margin:0;
    padding:1rem;
    position:fixed;
    bottom:1rem;
    right:1rem;
    z-index:100;
    @apply text-deep-blue;
}
.buttons {
    display:flex;
    justify-content:space-around;
    gap:1rem;
    margin-top:1rem;
    margin-bottom: 0.5rem;
}
.buttons button {
    display:block;
    flex-basis:50%;
    border: 2px solid;
    @apply border-deep-blue rounded-md;
}
.legal {
    font-size: 0.8rem;
}
</style>