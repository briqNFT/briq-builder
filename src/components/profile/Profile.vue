<script setup lang="ts">
</script>

<style scoped>
.imagePlaceholder {
    background: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        10px,
        rgba(247, 137, 74, 0.5) 10px,
        rgba(247, 137, 74, 0.5) 15px
    );
}

.item-gallery {
    @apply bg-primary rounded-md p-4 my-4;
}

.item-gallery .items {
    @apply flex gap-2;
}
.item-gallery .item {
    @apply bg-grad-light rounded p-2 h-[10rem] w-[10rem];
}
</style>

<template>
    <div class="container m-auto alternate-buttons min-h-screen">
        <div class="grid-cols-2 grid">
            <div class="row-span-full flex flex-col justify-between">
                <h1 class="my-8 text-max">0xCafeBabe</h1>
                <div class="item-gallery">
                    <h2>briqs</h2>
                    <div class="items">
                        <div class="item"/>
                    </div>
                </div>
                <div class="item-gallery">
                    <h2>Booklets</h2>
                    <div class="items">
                        <div class="item"/>
                    </div>
                </div>
                <div class="item-gallery">
                    <h2>Sets</h2>
                    <div class="items">
                        <div class="item"/>
                        <div class="item"/>
                    </div>
                </div>
            </div>
            <div class="flex flex-col justify-around">
                <div class="flex justify-center items-center text-[3rem] font-medium">
                    IMAGE 820/1000 briqs used
                </div>
                <div>
                    <h2>DAOs</h2>
                    <div>Stuff here</div>
                </div>
            </div>
        </div>
    </div>
</template>
