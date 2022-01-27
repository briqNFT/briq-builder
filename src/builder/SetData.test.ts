jest.mock('./../Meta')

import { SetData } from './SetData';
import { ChainBriqs } from './ChainBriqs';

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

    it('should replace briqs correctly 1', () => {
        let chain = new ChainBriqs();
        chain.parseChainData({ ft_balance: "0xf", nft_ids: ["0xcafe", "0xfade"] });

        {
            let swaps = chain.findRealBriqs({ 
                "0x1": { need: [[0, 0, 1], [0, 0, 2]], ft_balance: 10, nft_ids: ["0xcafe"] }
            });
            expect(swaps.length).toEqual(2);
            expect(swaps[0].pos).toEqual([0, 0, 1]);
            expect(swaps[0].newBriq.id).toEqual("0x1");
            expect(swaps[1].pos).toEqual([0, 0, 2]);
            expect(swaps[1].newBriq.id).toEqual("0x1");
        }
        {
            expect(() => chain.findRealBriqs({ 
                "0x2": { need: [[0, 0, 1], [0, 0, 2]], ft_balance: 10, nft_ids: ["0xcafe"] }
            })).toThrowError();
        }
        {
            expect(() => chain.findRealBriqs({ 
                "0x1": { need: [[0, 0, 1], [0, 0, 2]], ft_balance: 15, nft_ids: ["0xcafe"] }
            })).toThrowError();
        }
        {
            let swaps = chain.findRealBriqs({ 
                "0x1": { need: [[0, 0, 1], [0, 0, 2]], ft_balance: 14, nft_ids: ["0xcafe"] }
            });
            expect(swaps.length).toEqual(2);
            expect(swaps[0].pos).toEqual([0, 0, 1]);
            expect(swaps[0].newBriq.id).toEqual("0x1");
            expect(swaps[1].pos).toEqual([0, 0, 2]);
            expect(swaps[1].newBriq.id).toEqual("0xfade");
        }
    })

    it('should replace briqs correctly 2', () => {
        let chain = new ChainBriqs();
        chain.parseChainData({ ft_balance: "0x1", nft_ids: ["0xcafe", "0xfade"] });
        
        let data = new SetData("");
        data.placeBriq(0, 0, 0, "#ffffff", "0x1");
        data.placeBriq(0, 0, 1, "#ffffff", "0x1");

        console.log(data.serialize().briqs.map(x => x.data));
        data.swapForRealBriqs(chain);
        console.log(data.serialize().briqs.map(x => x.data));
    })
})