<script lang="ts">
import { isLoaded } from '@/store/StoreLoading';
import { defineAsyncComponent } from 'vue';
export default defineAsyncComponent(async () => {
    let res = import('@/Dispatch');
    // Import three, we know we'll need it as well.
    import('@/three_wrapper');
    await isLoaded;
    const dispatch = await res;
    await dispatch.initializeBuilder();
    return dispatch.Builder;
});
</script>
