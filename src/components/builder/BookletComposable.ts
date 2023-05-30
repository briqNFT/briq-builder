import type { SetData } from '@/builder/SetData';
import { reactive, toRef, watchEffect, computed, Ref, onBeforeUnmount } from 'vue';
import { useBuilder } from '@/components/builder/BuilderComposable';
import { bookletId, getStepImgSrc, bookletDataStore } from '@/builder/BookletData';
import { setsManager } from '@/builder/SetsManager';
import { getCurrentNetwork } from '@/chain/Network';

export const bookletStore = reactive({
    minimized: false,
    // For speed we compute this at most in one code path
    // Note that this relies on 'one set == one booklet'
    shapeValidity: {} as { [booklet: bookletId]: number },
    // If this exists, we are currently computing the offset
    shapeValidityCalculated: {} as { [booklet: bookletId]: boolean },
    // Just a cache for minting.
    shapeValidityOffset: {} as { [booklet: bookletId]: number[] },
});

// NB -> The way I handle the shape validity function here is not amazing
// but largely good enough for my current use case.
export function useBooklet(forceBooklet?: string) {
    const { currentSet, currentSetInfo } = useBuilder();

    const booklet = computed(() => forceBooklet || currentSetInfo.value?.booklet as string);
    const bookletFetch = computed(() => booklet.value ? bookletDataStore[getCurrentNetwork()][booklet.value] : undefined);
    const bookletRef = computed(() => bookletFetch.value?._data);

    // Compute the progress
    // Do nothing if the calculator already exists.
    if (!bookletStore.shapeValidityCalculated?.[booklet.value]) {
        // Make a copy so this is is closure-like.
        const booklet_value = booklet.value;
        const currentSetStick = currentSet.value as SetData;
        // Clean up when we get deleted.
        onBeforeUnmount(() => {
            if (bookletStore.shapeValidityCalculated[booklet_value]) {
                bookletStore.shapeValidityCalculated[booklet_value]();
                delete bookletStore.shapeValidityCalculated[booklet_value];
            }
        })
        bookletStore.shapeValidityCalculated[booklet_value] = watchEffect(() => {
            if (!booklet_value)
                return;
            if (!bookletRef.value) {
                bookletStore.shapeValidity[booklet_value] = 0;
                return;
            }
            const set = (forceBooklet ? setsManager.getBookletSet(forceBooklet) : undefined) || currentSetStick;
            if (!set) {
                bookletStore.shapeValidity[booklet_value] = 0;
                return;
            }
            set.briqs_;
            const currentBriqs = set.getAllBriqs();
            const targetBriqs = bookletRef.value.briqs.slice();

            const rotatePos = (vec: any, index = 0) => {
                if (index === 0)
                    return vec;
                if (index === 1)
                    return [-vec[2], vec[1], vec[0]];
                if (index === 2)
                    return [-vec[0], vec[1], -vec[2]];
                if (index === 3)
                    return [vec[2], vec[1], -vec[0]];
            }

            const targetBounds = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];

            for (const briq of targetBriqs) {
                const bp = briq.pos;
                targetBounds[0][0] = Math.min(targetBounds[0][0], bp[0]);
                targetBounds[0][1] = Math.min(targetBounds[0][1], bp[1]);
                targetBounds[0][2] = Math.min(targetBounds[0][2], bp[2]);
                targetBounds[1][0] = Math.max(targetBounds[1][0], bp[0]);
                targetBounds[1][1] = Math.max(targetBounds[1][1], bp[1]);
                targetBounds[1][2] = Math.max(targetBounds[1][2], bp[2]);
            }

            let bestMatch = 0;
            for (let rotation = 0; rotation < 4; ++rotation) {
                const selfBounds = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];

                for (const briq of currentBriqs) {
                    const bp = rotatePos(briq.position!, rotation);
                    selfBounds[0][0] = Math.min(selfBounds[0][0], bp[0]);
                    selfBounds[0][1] = Math.min(selfBounds[0][1], bp[1]);
                    selfBounds[0][2] = Math.min(selfBounds[0][2], bp[2]);
                    selfBounds[1][0] = Math.max(selfBounds[1][0], bp[0]);
                    selfBounds[1][1] = Math.max(selfBounds[1][1], bp[1]);
                    selfBounds[1][2] = Math.max(selfBounds[1][2], bp[2]);
                }
                if (currentBriqs.length !== 0)
                    for (let xx = targetBounds[0][0] - selfBounds[0][0]; xx <= targetBounds[1][0] - selfBounds[1][0]; ++xx)
                        for (let zz = targetBounds[0][2] - selfBounds[0][2]; zz <= targetBounds[1][2] - selfBounds[1][2]; ++zz) {
                            let cmatch = 0;
                            let fails = 0;
                            for (let i = 0; i < currentBriqs.length; ++i) {
                                let best = 0;
                                const b = currentBriqs[i];
                                let bPos = b.position!.slice();
                                bPos = rotatePos(bPos, rotation);
                                bPos[0] += xx;
                                bPos[2] += zz;
                                for (const a of targetBriqs) {
                                    const aPos = a.pos;
                                    if (aPos[0] === bPos[0] && aPos[1] === bPos[1] && aPos[2] === bPos[2]) {
                                        if (a.data?.any_color || (a.data.color.toLowerCase() === b.color.toLowerCase() && a.data.material === b.material))
                                            best = 1;
                                        else
                                            best = Math.max(best, 0.33);
                                        if (best === 1)
                                            break;
                                    }
                                }
                                cmatch += best;
                                if (best === 0)
                                    fails++;
                            }
                            cmatch -= fails * 0.9;
                            if (cmatch > bestMatch) {
                                bestMatch = cmatch;
                                bookletStore.shapeValidityOffset[booklet_value] = [rotation, xx, zz];
                            }
                        }
            }
            bookletStore.shapeValidity[booklet_value] = Math.min(1, Math.max(0, bestMatch / targetBriqs.length));
        })
    }

    return {
        minimized: toRef(bookletStore, 'minimized'),
        getStepImgSrc,
        shapeValidity: computed(() => bookletStore.shapeValidity[booklet.value]),
        booklet,
        bookletData: bookletRef,
        bookletFetch,
    };
}
