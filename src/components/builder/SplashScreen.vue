<script setup lang="ts">
import { RealmsLogo } from '@/conf/realms';
</script>

<template>
  <div id="floatingMenu" :class="hidden">
    <h1 v-if="CONF.theme === 'realms'" class="font-bold p-8 briq-logo font-[4rem]">briq x <RealmsLogo class="inline-block relative bottom-[8%]" height="4rem" style="fill: rgba(var(--color-text))"/></h1>
    <h1 v-else="" class="font-bold p-8 briq-logo">briq</h1>
    <h2>Seize the briqs of construction</h2>
    <!--
    <PickMaterial/>
    <p class="hoverbutton">Hover to pick material</p>
    -->
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'

var localStore = reactive({
  hidden: false,
});

export default defineComponent({
    data() {
        return localStore;
    },
    inject: ["CONF"],
    props: ["shouldHide"],
    emit: ["done"],
    mounted: function() {
        if (!this.hidden)
        {
          setTimeout(() => {
              this.hidden = "shouldHide";
              this.$emit("done");
          }, 1000);
          setTimeout(() => {
              this.hidden = "noDisplay";
          }, 2000);
        }
    }
})
</script>

<style scoped>
#floatingMenu
{
  @apply fixed w-full h-full flex flex-wrap justify-center content-center text-center;
  @apply bg-base;
  z-index:10000;
  transition: all 1s;
}
#floatingMenu > * 
{
  @apply w-full
}
#floatingMenu.shouldHide {
    opacity: 0;
    @apply pointer-events-none;
}
#floatingMenu.noDisplay {
    opacity: 0;
    display:none;
}
</style>