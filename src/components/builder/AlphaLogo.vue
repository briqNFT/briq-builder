<template>
    <div class="absolute bottom-0 right-0 p-2">
        <a target="_blank" href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3">
            <h5 class="text-5xl font-bold drop-shadow-lg px-4 py-6 alpha-pill briq-logo">briq</h5></a>
    </div>
</template>

<style scoped>
.alpha-pill {
    position: relative
}
.alpha-pill::after {
    display: block;
    content: "alpha";
    font-style: italic;

    @apply bg-briq-light px-2 py-0.5 text-deep-blue text-sm;
    position: absolute;
    bottom: 0;
    right: 0;

    @apply rounded-xl shadow-sm;
}
</style>