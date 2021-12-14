<template>
  <div id="floatingMenu" :class="hidden">
    <h1 class="font-bold p-8">briq</h1>
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
    props: ["shouldHide"],
    mounted: function() {
        if (!this.hidden)
        {
          setTimeout(() => {
              this.hidden = "shouldHide";
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
  @apply bg-briq;
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