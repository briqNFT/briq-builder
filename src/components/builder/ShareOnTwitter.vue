<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps<{
    owned: boolean,
}>();

const encodedTweet = computed(() => {
    if (!props.owned)
        return encodeURIComponent('Check out this cool NFT built with @briqNFT!🧱\n');
    return encodeURIComponent('I\'ve built this with @briqNFT and you can too!🧱\nGo on https://briq.construction/, get some briqs and build the dream!\n');
});

const shareUrl = computed(() => `https://${window.location.hostname}${route.path}`);

</script>

<template>
    <a
        target="_blank"
        :href="`https://twitter.com/intent/tweet?text=${encodedTweet}&url=${encodeURIComponent(shareUrl)}`">
        <Btn v-bind="$attrs" icon class="text-sm justify-start font-normal"><i class="fa-brands fa-twitter text-md mr-2"/> Share on Twitter</Btn>
    </a>
</template>