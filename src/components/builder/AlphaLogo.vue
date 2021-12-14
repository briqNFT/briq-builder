<template>
    <div class="fixed bottom-0 right-0 p-2">
        <a target="_blank" href="https://insidious-ginger-0f9.notion.site/Alpha-paper-fd11fbbb6ac449129797e5f4ecb24d7a">
            <h5 class="text-5xl font-bold drop-shadow-lg px-4 py-6 alpha-pill">briq</h5></a>
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