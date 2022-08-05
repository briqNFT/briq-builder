import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { productBidsStore } from '@/builder/BidStore';
import { toBN } from 'starknet/utils/number';
import { computed } from 'vue';

export function useBids(box_id: string) {
    const currentBid = computed(() => {
        let max = toBN(0);
        for (const bid in productBidsStore.bids(box_id).bids) {
            const bidAmnt = toBN(productBidsStore.bids(box_id).bids[bid].bid_amount);
            if (bidAmnt.cmp(max) > 0)
                max = bidAmnt;
        }
        return max;
    });

    const currentBidString = computed(() => {
        return `${readableUnit(currentBid.value)} ${readableNumber(currentBid.value)}`
    });

    return {
        currentBid,
        currentBidString,
    }
}