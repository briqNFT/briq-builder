<template>
    <div class="burger" @click="open = !open"><p>---<br/>---<br/>---</p></div>
    <div class="menu" v-if="open">
        <p><router-link to="/" @click="open = false">Builder</router-link></p>
        <p><router-link to="/admin" @click="open = false">Admin</router-link></p>
        <p><router-link to="/legal" @click="open = false">Legal / Privacy</router-link></p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    data() {
        return {
            open: false
        };
    },
})
</script>

<style scoped>
.burger {
    position: fixed;
    top: 0;
    left: 0;
    line-height:6px;
    font-size: 30px;
    padding: 0.5rem 1rem 1rem 1rem;
    background: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    user-select: none;
    z-index:100;
}
.menu {
    position:fixed;
    top: 0;
    left: 0;
    background: #fff;
    width: 200px;
    height: 300px;
    padding: 1rem;
    padding-top:3rem;
    z-index:50;
}
.menu p {
    margin-bottom:1rem;
    text-align:left;
}
</style>
