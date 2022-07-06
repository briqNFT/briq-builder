<script setup lang="ts">
import { BidNotif } from './BidNotif';

const props = defineProps<{
    notif: BidNotif
}>();
</script>

<template>
    <p>Your bid of {{ notif.value }} is being processed.</p>
</template>
