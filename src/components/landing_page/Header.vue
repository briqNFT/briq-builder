<template>
    <div
        class="header m-auto flex justify-between items-center text-center alternate-buttons">
        <div class="flex">
            <a href="/"><h2 class="briq-logo text-[32px]">briq</h2></a>
            <a href="/"><h2 class="briq-logo briq text-[32px]">briq</h2></a>
        </div>
        <div class="flex items-center gap-4">
            <div class="flex gap-4 flex-wrap justify-center md:justify-end font-normal">
                <a href="/team"><p>Team</p></a>
                <a href="/gallery"><p>Gallery</p></a>
                <a href="https://briqnft.notion.site/briqnft/briq-hub-ae6a1d92745044cc9c2274251a5212f3" rel="noopener"><p>Resources</p></a>
            </div>
            <div class="alpha-pill flex-none">
                <Btn class="flex-none" @click="$router.push({ name: 'Builder' })"><span class="px-2">App</span></Btn>
            </div>
        </div>
    </div>
</template>

<style scoped>
.header > div {
    @apply px-4 py-4;
}
.header {
    @apply container m-auto;
}

.alpha-pill {
    position: relative;
}
.alpha-pill ::after {
    display: block;
    content: 'alpha';
    font-style: italic;

    @apply bg-accent px-2 py-0.5 text-text-on-accent text-sm;
    position: absolute;
    top: -1rem;
    right: -1rem;

    @apply rounded-md shadow-sm;
}
</style>
