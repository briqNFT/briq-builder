<template>
    <div class="invisible absolute md:top-0 bottom-0 w-screen flex py-2 md:py-4">
        <!-- For easy placement, have invisible blocks for the left/right hand side items -->
        <div class="w-[16rem] flex-none md:block hidden"></div>
        <div class="w-full flex-shrink visibleChildren">
            <div class="flex justify-center">
                <div class="flex justify-around lg:justify-self-end flex-1">
                    <div class="flex-1 flex gap-1 mx-2 flex-wrap justify-center lg:justify-end">
                        <div class="flex justify-stretch gap-1">
                            <Button class="w-12" tooltip="Create a new WIP set." @click="newSet"><i class="far fa-file"></i></Button>
                            <Button class="w-12" tooltip="Copy a new WIP set." @click="copySet"><i class="far fa-copy"></i></Button>
                        </div>
                        <div class="flex justify-stretch gap-1">
                            <Button class="w-12" tooltip="Delete the current WIP set." @click="deleteSet"><i class="far fa-trash-alt"></i></button>
                            <Button class="w-12" tooltip="Import a local set." @click="importSet"><i class="fas fa-file-import"></i></button>
                        </div>
                    </div>
                    <div class="mx-2 justify-center lg:justify-self-end flex-none">
                        <Button><i class="fas fa-cloud-upload-alt"></i> Save on Chain</Button>
                    </div>
                </div>
            </div>
        </div>
        <div class="lg:w-[20rem] w-[11rem] flex-none md:block hidden"></div>
    </div>
</template>

<style scoped>
.visibleChildren * {
    @apply invisible;
}
.visibleChildren button, .visibleChildren button * {
    @apply visible;
}

</style>

<script setup lang="ts">
</script>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
})
</script>
