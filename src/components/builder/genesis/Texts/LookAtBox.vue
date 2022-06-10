<script setup lang="ts">
const props = defineProps<{
    active: boolean,
    startUnbox: CallableFunction,
}>();
</script>

<template>
    <hr>
    <p>
        Space, ever the final-frontier, in your hands.
    </p>
    <p class="my-2">
        You shake the box in your hands. It rattles slightly.<br>
        The contents on the back side read:<br>
    </p>
    <blockquote>
        <h3>Spaceman</h3>
        <ul>
            <li>One high-quality construction booklet</li>
            <li>34 briqs required to build it</li>
            <li>One briq booster pack with unknown briqs</li>
        </ul>
    </blockquote>
    <p class="text-center my-4"><Btn @click="props.startUnbox" :disabled="!props.active">Unbox</Btn></p>
</template>