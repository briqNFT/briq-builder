import { BriqsDB } from './BriqsDB';
import { SetData } from './SetData'

describe('Test BriqsDB', () => {
    it('should calculate positions correctly', () => {
        let data = new SetData(0, new BriqsDB());
        for (let i = 0; i < 10; ++i)
        {
            let x = Math.floor(Math.random() * 100);
            let y = Math.floor(Math.random() * 100);
            let z = Math.floor(Math.random() * 100);
            let [regionId, cellId] = data.computeIDs(x, y, z);
            expect(data.to3DPos(regionId, cellId)).toEqual([x, y, z]);    
        }
    })
})