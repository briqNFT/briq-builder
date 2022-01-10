<template>
    <div class="header m-auto flex justify-between items-center font-semibold text-white text-lg text-center font-sans alternate-buttons">
        <div class="text-xl">
            <a href="/"><h2 class="briq-logo">briq</h2></a>
        </div>
        <div class="flex gap-4 items-center alpha-pill">
            <a href="/team"><p>Team</p></a>
            <a href="https://insidious-ginger-0f9.notion.site/Alpha-paper-fd11fbbb6ac449129797e5f4ecb24d7a"><p>Whitepaper</p></a>
            <a href="https://insidious-ginger-0f9.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f"><p>Resources</p></a>
            <button @click="$router.push({ name: 'Builder' })"><span class="px-2">App</span></button>
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