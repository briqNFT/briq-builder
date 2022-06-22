<script setup lang="ts">
import type { HotkeyManager, HotkeyData, HotkeyHandle } from '@/Hotkeys';
import { inject, onMounted, onUnmounted, ref } from 'vue';

const hotkeyMgr = inject<HotkeyManager>('hotkeyMgr')!;

const hk = ref(undefined as unknown as HotkeyHandle);

const props = defineProps<{
    name: string,
    handler: () => void,
    data?: HotkeyData
}>();

onMounted(() => {
    if (props.data)
        hotkeyMgr.register(props.name, props.data);
    hk.value = hotkeyMgr.subscribe(props.name, props.handler);
});

onUnmounted(() => {
    hotkeyMgr.unsubscribe(hk.value);
});

</script>
