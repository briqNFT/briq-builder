import { ChainBriqs } from './ChainBriqs';
import { backendManager as bm2 } from '@/Backend';

const mockBackendManager = (() => {
    const ret = bm2;
    ret.fetch = vitest.fn();
    return ret;
})()

describe('Test ChainBriqs', () => {
    beforeEach(() => {
        vitest.clearAllMocks();
        vitest.doMock('@/Backend', () => ({
            backendManager: mockBackendManager,
        }));
    });

    test('Should cycle serialize/deserialize correctly', async () => {
        const briqs = new ChainBriqs();
        briqs.user_id = '0xcafe';

        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === `v1/user/briqs/${briqs.user_id}`)
                return {
                    last_block: 10,
                    '0x1': {
                        ft_balance: 10,
                        nft_ids: [],
                    },
                }
            throw new Error();
        });

        await briqs.loadFromChain();
        expect(briqs.getNbBriqs()).toEqual(10);
        await briqs.loadFromChain();
        expect(briqs.getNbBriqs()).toEqual(10);

        briqs._deserialize(briqs._serialize());
        expect(briqs.getNbBriqs()).toEqual(10);
        await briqs.loadFromChain();
        expect(briqs.getNbBriqs()).toEqual(10);
    });
    test('Should cycle serialize/deserialize correctly in the presence of Metadata', async () => {
        const briqs = new ChainBriqs();
        briqs.user_id = '0xcafe';

        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === `v1/user/briqs/${briqs.user_id}`)
                return {
                    last_block: 10,
                    '0x1': {
                        ft_balance: 10,
                        nft_ids: [],
                    },
                }
            throw new Error();
        });

        briqs.show('0x1', 2, '0xcafe', Date.now());

        await briqs.loadFromChain();
        expect(briqs.getNbBriqs()).toEqual(12);
        await briqs.loadFromChain();
        expect(briqs.getNbBriqs()).toEqual(12);

        briqs._deserialize(briqs._serialize());
        expect(briqs.getNbBriqs()).toEqual(12);
        await briqs.loadFromChain();
        expect(briqs.getNbBriqs()).toEqual(12);
    });
});
