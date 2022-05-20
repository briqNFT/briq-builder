<template>
    <Window size="md:w-3/5 w-4/5">
        <template #big-title>Purchase box</template>
        <p>This is a pretend screen that a box is being confirmed</p>
        <p>TODO</p>
        <p class="flex justify-center my-4"><Btn @click="$emit('close', 'ok')">Pretend actual purchase</Btn></p>
    </Window>
</template>
