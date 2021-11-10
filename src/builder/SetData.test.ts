import { SetData } from './SetData'

describe('Test BriqsData', () => {
    it('should calculate positions correctly', () => {
        let data = new SetData(0, undefined);
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