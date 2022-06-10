<script setup lang="ts">
import { watch, onMounted, ref } from 'vue';
import FireplaceAudio from '@/assets/genesis/FirePlace.mp3';
import { APP_ENV } from '@/Meta';

const fireaudio = ref(null as unknown as HTMLAudioElement);

const playing = ref(false);

onMounted(() => {
    if (APP_ENV === 'dev')
        return;
    const promise = fireaudio.value.play();
    if (promise !== undefined)
        promise.then(_ => {
            playing.value = true;
        }).catch(_ => {
            playing.value = false;
        });
})
watch([playing], () => {
    if (!playing.value)
        fireaudio.value.pause();
    else
        fireaudio.value.play();
    fireaudio.value.muted = !playing.value;
});
</script>

<template>
    <button v-if="!playing" @click="playing = true">Play fireplace sounds</button>
    <button v-else @click="playing = false">Stop fireplace sounds</button>
    <audio :src="FireplaceAudio" ref="fireaudio" autoplay="true" muted="false" loop="true"/>
</template>