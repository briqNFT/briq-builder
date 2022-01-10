
jest.mock('../Meta');

import { SetData } from './SetData'
import { setsManager } from './SetsManager';

describe('Load from storage', () => {
    it('should load fine', async () => {
        window.localStorage.setItem("briq_set_0xtoto", '{ "id": "0xtoto", "status": "LOCAL", "local": { "id": "0xtoto", "name": "toto", "briqs": [] } }');
        await setsManager.loadFromStorage();
        expect(setsManager.setList.length).toEqual(1);
        setsManager.getLocalSet()!.name = "toto";
    })
})