<template>
    <div class="header m-auto flex justify-between items-center font-semibold text-white text-lg text-center font-sans alternate-buttons">
        <div class="text-xl">
            <a href="/"><h2 class="briq-logo">briq</h2></a>
        </div>
        <div class="flex items-center gap-4">
            <div class="flex gap-4 flex-wrap justify-center md:justify-end">
                <a href="/team"><p>Team</p></a>
                <a href="/gallery"><p>Gallery</p></a>
                <a href="https://insidious-ginger-0f9.notion.site/briq-ae6a1d92745044cc9c2274251a5212f3"><p>Resources</p></a>
            </div>
            <div class="alpha-pill flex-none">
                <button class="flex-none" @click="$router.push({ name: 'Builder' })"><span class="px-2">App</span></button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.header > div {
    @apply px-4 py-4;
}
.header {
    @apply container m-auto lg:w-[70rem];
}

h2 {
    @apply font-black my-4;
}

button {
    @apply btn;
}

.alpha-pill {
    position: relative;
}
.alpha-pill ::after {
    display: block;
    content: "alpha";
    font-style: italic;

    @apply bg-briq-light px-2 py-0.5 text-deep-blue text-sm;
    position: absolute;
    top: 0;
    right: 0;

    @apply rounded-xl shadow-sm;
}

</style>