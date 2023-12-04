import { legacyChainBriqs } from '@/builder/ChainBriqsLegacy';
import { ADDRESSES } from '../Contracts';
import { getCurrentNetwork } from '../Network';
import type { Call } from 'starknet';

export function migrateBriqsIfNeeded(calls: Call[]) {
    if (!legacyChainBriqs.current?.getNbBriqs())
        return calls;
    calls.unshift({
        contractAddress: ADDRESSES[getCurrentNetwork()].migrate_assets,
        entrypoint: 'migrate_legacy_briqs',
        calldata: [legacyChainBriqs.current!.getNbBriqs()],
    });
    return calls;
}
