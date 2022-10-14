import type { SetData } from '@/builder/SetData';
import { reactive, toRef, watchEffect, computed, Ref, onUnmounted, onBeforeUnmount } from 'vue';
import { useBuilder } from '@/components/builder/BuilderComposable';
import { bookletId, getStepImgSrc, getBookletDataSync } from '@/builder/BookletData';

export const bookletStore = reactive({
    minimized: false,
    // For speed we compute this at most in one code path
    // Note that this relies on 'one set == one booklet'
    shapeValidity: {} as { [booklet: bookletId]: number },
    shapeValidityCalculated: {} as { [booklet: bookletId]: boolean },
});

export function useBooklet(forceSet?: Ref<SetData>, forceBooklet?: Ref<string>) {
    const { currentSet, currentSetInfo } = useBuilder();

    const booklet = computed(() => forceBooklet?.value || currentSetInfo.value?.booklet as string);
    const bookletRef = computed(() => booklet.value ? getBookletDataSync(booklet.value).value : undefined);

    // Compute the progress
    // Do nothing if the calculator already exists.
    if (!bookletStore.shapeValidityCalculated?.[booklet.value]) {
        // Clean up when we get deleted.
        onBeforeUnmount(() => {
            delete bookletStore.shapeValidityCalculated[booklet.value];
        })
        bookletStore.shapeValidityCalculated[booklet.value] = true;
        watchEffect(() => {
            if (!booklet.value)
                return;
            if (!bookletRef.value) {
                bookletStore.shapeValidity[booklet.value] = 0;
                return;
            }
            const set = forceSet?.value || currentSet.value as SetData;
            if (!set) {
                bookletStore.shapeValidity[booklet.value] = 0;
                return;
            }
            set.briqs_;
            const currentBriqs = set.getAllBriqs();
            const targetBriqs = bookletRef.value.briqs.slice();

            const
                targetBounds = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]],
                selfBounds = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];

            for (const briq of currentBriqs) {
                selfBounds[0][0] = Math.min(selfBounds[0][0], briq.position![0]);
                selfBounds[0][1] = Math.min(selfBounds[0][1], briq.position![1]);
                selfBounds[0][2] = Math.min(selfBounds[0][2], briq.position![2]);
                selfBounds[1][0] = Math.max(selfBounds[1][0], briq.position![0]);
                selfBounds[1][1] = Math.max(selfBounds[1][1], briq.position![1]);
                selfBounds[1][2] = Math.max(selfBounds[1][2], briq.position![2]);
            }
            for (const briq of targetBriqs) {
                targetBounds[0][0] = Math.min(targetBounds[0][0], briq.pos![0]);
                targetBounds[0][1] = Math.min(targetBounds[0][1], briq.pos![1]);
                targetBounds[0][2] = Math.min(targetBounds[0][2], briq.pos![2]);
                targetBounds[1][0] = Math.max(targetBounds[1][0], briq.pos![0]);
                targetBounds[1][1] = Math.max(targetBounds[1][1], briq.pos![1]);
                targetBounds[1][2] = Math.max(targetBounds[1][2], briq.pos![2]);
            }
            let match = 0;
            if (currentBriqs.length !== 0)
                for (let xx = targetBounds[0][0] - selfBounds[0][0]; xx <= targetBounds[1][0] - selfBounds[1][0]; ++xx)
                    for (let zz = targetBounds[0][2] - selfBounds[0][2]; zz <= targetBounds[1][2] - selfBounds[1][2]; ++zz) {
                        let cmatch = 0;
                        let fails = 0;
                        for (let i = 0; i < currentBriqs.length; ++i) {
                            let best = 0;
                            const b = currentBriqs[i];
                            for (const a of targetBriqs)
                                if (a.pos[0] === b.position[0] + xx && a.pos[1] === b.position[1] && a.pos[2] === b.position[2] + zz) {
                                    if (a.data.color.toLowerCase() === b.color.toLowerCase() && a.data.material === b.material)
                                        best = 1;
                                    else
                                        best = Math.max(best, 0.5);
                                    if (best === 1)
                                        break;
                                }
                            cmatch += best;
                            if (best === 0)
                                fails++;
                        }
                        cmatch -= fails * 0.9;
                        if (cmatch > match)
                            match = cmatch;
                    }
            bookletStore.shapeValidity[booklet.value] = Math.min(1, Math.max(0, match / targetBriqs.length));
        })
    }

    return {
        minimized: toRef(bookletStore, 'minimized'),
        getStepImgSrc,
        shapeValidity: computed(() => bookletStore.shapeValidity[booklet.value]),
        booklet,
        bookletData: bookletRef,
    };
}
