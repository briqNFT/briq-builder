import { SetData } from './SetData';
import { ChainBriqs } from './ChainBriqs';
import { Briq } from './Briq';

describe('Test SetData', () => {
    test('should calculate positions correctly', () => {
        const data = new SetData('');

        {
            const x = data.regionSize * data.regionSize - 1;
            const y = data.regionSize * data.regionSize - 1;
            const z = data.regionSize * data.regionSize - 1;
            const [regionId, cellId] = data.computeIDs(x, y, z);
            expect(data.to3DPos(regionId, cellId)).toEqual([x, y, z]);
        }

        for (let i = 0; i < 20; ++i) {
            const x = Math.floor(Math.random() * data.regionSize * 2 - data.regionSize);
            const y = Math.floor(Math.random() * data.regionSize * 2 - data.regionSize);
            const z = Math.floor(Math.random() * data.regionSize * 2 - data.regionSize);
            const [regionId, cellId] = data.computeIDs(x, y, z);
            expect(data.to3DPos(regionId, cellId)).toEqual([x, y, z]);
        }
    });

    test('should overwrite briqs correctly', () => {
        const data = new SetData('');
        data.placeBriq(0, 0, 0, new Briq('0x1', '0xfafafa'));
        data.placeBriq(0, 0, 0, new Briq('0x1', '0xafafaf'));
        expect(data.getAt(0, 0, 0)?.color).toEqual('0xafafaf');
    });
});

describe('Test SetData replacing briqs', () => {
    it('should should find real briqs correctly. ', () => {
        const chain = new ChainBriqs();
        chain._parseChainData({ 'last_block': 2400, '0x1': { ft_balance: 15, nft_ids: ['0xcafe', '0xfade'] } });

        {
            const swaps = chain.findRealBriqs({
                '0x1': { ft_balance: 10, nft_ids: ['0xcafe'] },
            });
            // All fungible, nothing to do.
            expect(swaps.length).toEqual(0);
        }
        {
            expect(() =>
                chain.findRealBriqs({
                    '0x2': { ft_balance: 10, nft_ids: ['0xcafe'] },
                }),
            ).toThrowError();
        }
        {
            expect(() =>
                chain.findRealBriqs({
                    '0x1': { ft_balance: 20, nft_ids: ['0xcafe'] },
                }),
            ).toThrowError();
        }
        {
            expect(() =>
                chain.findRealBriqs({
                    '0x1': { ft_balance: 0, nft_ids: ['0xdead'] },
                }),
            ).toThrowError();
        }
        {
            const swaps = chain.findRealBriqs({
                '0x1': { ft_balance: 16, nft_ids: ['0xcafe'] },
            });
            expect(swaps.length).toEqual(1);
            expect(swaps[0].id).toEqual('0xfade');
        }
    });

    it('should replace briqs correctly', () => {
        const chain = new ChainBriqs();
        chain._parseChainData({ '0x1': { ft_balance: 1, nft_ids: ['0xcafe', '0xfade'] } });

        const data = new SetData('');
        data.placeBriq(0, 0, 0, new Briq('0x1'));
        data.placeBriq(0, 0, 1, new Briq('0x1'));

        data.swapForRealBriqs(chain);
        expect(data.serialize().briqs.map((x: any) => x.data?.id)).toEqual(['0xfade', undefined]);
    });
});
