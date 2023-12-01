import type { Call } from 'starknet';
import { getBookletAddress } from '@/chain/Collections';
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { getCurrentNetwork, getPremigrationNetwork } from '@/chain/Network';
import { bookletDataStore } from '@/builder/BookletData';

export const getCalls = async (mapping: Record<string, unknown>) => {
    const calls: Call[] = [];
    const set_migrations: { old_token_id: string, new_token_id: string }[] = [];
    for (const box of (mapping.boxes as { owner: string, box_id: string, quant: number}[])) {
        calls.push({
            contractAddress: ADDRESSES[getPremigrationNetwork(getCurrentNetwork())].box,
            entrypoint: 'safeTransferFrom_',
            calldata: [
                box.owner,
                ADDRESSES[getCurrentNetwork()].migrate_assets,
                box.box_id,
                box.quant,
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
                box.quant,
            ],
        });
    }
    for (const booklet of (mapping.booklets as { owner: string, old_token_id: string, new_booklet_id: string, quant: number }[])) {
        const new_token_id = BigInt(booklet.new_booklet_id);
        const collec = BigInt(booklet.new_booklet_id) / 0x10000000000000000n;
        calls.push({
            contractAddress: ADDRESSES[getPremigrationNetwork(getCurrentNetwork())].booklet,
            entrypoint: 'safeTransferFrom_',
            calldata: [
                booklet.owner,
                ADDRESSES[getCurrentNetwork()].migrate_assets,
                booklet.old_token_id,
                booklet.quant,
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
                booklet.quant,
            ],
        });
    }
    // Actual sets
    for (const set of (mapping.sets as { owner: string, old_token_id: string, new_booklet_id: string, new_booklet_name: string }[]))
        bookletDataStore[getCurrentNetwork()][set.new_booklet_name]
    for (const set of (mapping.sets as { owner: string, old_token_id: string, new_booklet_id: string, new_booklet_name: string }[])) {
        await bookletDataStore[getCurrentNetwork()][set.new_booklet_name]._fetch;
        const bookletData = bookletDataStore[getCurrentNetwork()][set.new_booklet_name]._data!;
        console.log(bookletData);
        calls.push({
            contractAddress: ADDRESSES[getCurrentNetwork()].migrate_assets,
            entrypoint: 'admin_migrate_legacy_set_briqs',
            calldata: [set.owner, set.old_token_id, bookletData.briqs.length],
        });
        // At this point we're supposed to have briqs.
        // Mint the booklet
        const contract = getBookletAddress(ADDRESSES[getCurrentNetwork()], set.new_booklet_name.split('/')[0]);
        calls.push({
            contractAddress: contract,
            entrypoint: 'mint',
            calldata: [
                set.owner,
                set.new_booklet_id,
                1,
            ],
        });
        set_migrations.push({
            old_token_id: set.old_token_id,
            new_token_id: contractStore.set!.precomputeTokenId(set.owner, '1', bookletData.briqs.length, set.new_booklet_name, bookletData),
        });
        // Then mint the set
        calls.push(contractStore.set!.prepareAssemble(set.owner, '1', bookletData, set.new_booklet_id));
    }
    return { calls, set_migrations };
};