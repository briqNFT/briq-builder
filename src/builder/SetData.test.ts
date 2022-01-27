jest.mock('./../Meta')

import { SetData } from './SetData';
import { ChainBriqs } from './ChainBriqs';
import { Briq } from './Briq';

describe('Test SetData', () => {
    it('should calculate positions correctly', () => {
        let data = new SetData("");

        for (let i = 0; i < 20; ++i)
        {
            let x = Math.floor(Math.random() * 100 - 50);
            let y = Math.floor(Math.random() * 100 - 50);
            let z = Math.floor(Math.random() * 100 - 50);
            let [regionId, cellId] = data.computeIDs(x, y, z);
            expect(data.to3DPos(regionId, cellId)).toEqual([x, y, z]);    
        }
    })

    it('should should find real briqs correctly. ', () => {
        let chain = new ChainBriqs();
        chain.parseChainData({ ft_balance: "0xf", nft_ids: ["0xcafe", "0xfade"] });

        {
            let swaps = chain.findRealBriqs({ 
                "0x1": { ft_balance: 10, nft_ids: ["0xcafe"] }
            });
            // All fungible, nothing to do.
            expect(swaps.length).toEqual(0);
        }
        {
            expect(() => chain.findRealBriqs({ 
                "0x2": { ft_balance: 10, nft_ids: ["0xcafe"] }
            })).toThrowError();
        }
        {
            expect(() => chain.findRealBriqs({ 
                "0x1": { ft_balance: 20, nft_ids: ["0xcafe"] }
            })).toThrowError();
        }
        {
            expect(() => chain.findRealBriqs({ 
                "0x1": { ft_balance: 0, nft_ids: ["0xdead"] }
            })).toThrowError();
        }
        {
            let swaps = chain.findRealBriqs({ 
                "0x1": { ft_balance: 16, nft_ids: ["0xcafe"] }
            });
            expect(swaps.length).toEqual(1);
            expect(swaps[0].id).toEqual("0xfade");
        }
    })

    it('should replace briqs correctly', () => {
        let chain = new ChainBriqs();
        chain.parseChainData({ ft_balance: "0x1", nft_ids: ["0xcafe", "0xfade"] });
        
        let data = new SetData("");
        data.placeBriq(0, 0, 0, new Briq("0x1"));
        data.placeBriq(0, 0, 1, new Briq("0x1"));

        data.swapForRealBriqs(chain);
        expect(data.serialize().briqs.map((x: any) => x.data?.id)).toEqual(["0xfade", undefined]);
    })
})