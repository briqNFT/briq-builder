import type { Call } from 'starknet';
import { getBookletAddress } from '@/chain/Collections';
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { getCurrentNetwork, getPremigrationNetwork } from '@/chain/Network';
import { bookletDataStore } from '@/builder/BookletData';

export const MIGRATION_ENABLED = false;

export const getCalls = async (mapping: Record<string, unknown>) => {
    const calls: Call[] = [];
    const set_migrations: { old_token_id: string, new_token_id: string }[] = [];
    for (const box of (mapping.boxes as { owner: string, box_id: string}[])) {
        calls.push({
            contractAddress: ADDRESSES[getPremigrationNetwork(getCurrentNetwork())].box,
            entrypoint: 'safeTransferFrom_',
            calldata: [
                box.owner,
                ADDRESSES[getCurrentNetwork()].migrate_assets,
                box.box_id,
                1,
                0,
            ],
        });
        const contract = BigInt(box.box_id) == 10n ? ADDRESSES[getCurrentNetwork()].box_nft_briqmas : ADDRESSES[getCurrentNetwork()].box_nft_sp;
        calls.push({
            contractAddress: contract,
            entrypoint: 'mint',
            calldata: [
                box.owner,
                box.box_id,
                1,
            ],
        });
    }
    for (const booklet of (mapping.booklets as { owner: string, old_token_id: string}[])) {
        const collec = BigInt(booklet.old_token_id) % 100n;
        const attribute_id = BigInt(booklet.old_token_id) / (2n**192n);
        const new_token_id = collec * (2n**64n) + attribute_id;
        calls.push({
            contractAddress: ADDRESSES[getPremigrationNetwork(getCurrentNetwork())].booklet,
            entrypoint: 'safeTransferFrom_',
            calldata: [
                booklet.owner,
                ADDRESSES[getCurrentNetwork()].migrate_assets,
                booklet.old_token_id,
                1,
                0,
            ],
        });
        const contract = getBookletAddress(ADDRESSES[getCurrentNetwork()], collec.toString());
        calls.push({
            contractAddress: contract,
            entrypoint: 'mint',
            calldata: [
                booklet.owner,
                new_token_id.toString(),
                1,
            ],
        });
    }
    // Actual sets
    for (const set of (mapping.sets as { owner: string, old_token_id: string, matching_booklet_name: string }[]))
        if (set.matching_booklet_name.startsWith('starknet'))
            bookletDataStore[getCurrentNetwork()][set.matching_booklet_name]
    for (const set of (mapping.sets as { owner: string, old_token_id: string, matching_booklet_name: string }[])) {
        if (!set.matching_booklet_name.startsWith('starknet'))
            continue;
        await bookletDataStore[getCurrentNetwork()][set.matching_booklet_name]._fetch;
        const bookletData = bookletDataStore[getCurrentNetwork()][set.matching_booklet_name]._data!;
        console.log(bookletData);
        calls.push({
            contractAddress: ADDRESSES[getCurrentNetwork()].migrate_assets,
            entrypoint: 'migrate_legacy_set_briqs',
            calldata: [set.old_token_id, bookletData.briqs.length],
        });
        // At this point we're supposed to have briqs.
        // Mint the booklet
        const contract = getBookletAddress(ADDRESSES[getCurrentNetwork()], set.matching_booklet_name.split('/')[0]);
        calls.push({
            contractAddress: contract,
            entrypoint: 'mint',
            calldata: [
                set.owner,
                bookletData.token_id,
                1,
            ],
        });
        set_migrations.push({
            old_token_id: set.old_token_id,
            new_token_id: contractStore.set!.precomputeTokenId(set.owner, '1', bookletData.briqs.length, set.matching_booklet_name, bookletData),
        });
        // Then mint the set
        calls.push(contractStore.set!.prepareAssemble(set.owner, '1', bookletData, bookletData.token_id));
    }
    return { calls, set_migrations };
};