import { BuilderAction, MoveBriqs, PlaceOrRemoveBriqs, RotateBriqs } from './BuilderActions';
import { inputStore } from './inputs/InputStore';
import { SetData } from './SetData';
import { THREE, threeSetupComplete } from '@/three';

await threeSetupComplete;

describe('Should create and modify sets', () => {
    test('Simple do/redo with new files', async () => {
        const setData = new SetData('0xfafa');
        const actions = [] as BuilderAction<any>[];
        const act = (data: BuilderAction<any>) => {
            actions.push(data);
            data.redo(setData);
        };
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 0], color: '0xfafafa', material: '0x1' }]));
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 1], color: '0xfafafb', material: '0x2' }]));
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 2], color: '0xfafbfa', material: '0x3' }]));

        expect(setData.getNbBriqs()).toEqual(3);
        expect(setData.getAt(0, 1, 0)).toHaveProperty('color', '0xfafafa');
        expect(setData.getAt(0, 1, 1)).toHaveProperty('color', '0xfafafb');
        expect(setData.getAt(0, 1, 2)).toHaveProperty('material', '0x3');

        actions[actions.length - 1]!.undo(setData);

        expect(setData.getNbBriqs()).toEqual(2);
        expect(setData.getAt(0, 1, 0)).toHaveProperty('color', '0xfafafa');
        expect(setData.getAt(0, 1, 1)).toHaveProperty('color', '0xfafafb');
        expect(setData.getAt(0, 1, 2)).toBeUndefined();

        actions[actions.length - 1]!.redo(setData);

        expect(setData.getNbBriqs()).toEqual(3);
        expect(setData.getAt(0, 1, 0)).toHaveProperty('color', '0xfafafa');
        expect(setData.getAt(0, 1, 1)).toHaveProperty('color', '0xfafafb');
        expect(setData.getAt(0, 1, 2)).toHaveProperty('material', '0x3');
    });

    test('Selection matches after moving - new method', async () => {
        const setData = new SetData('0xfafa');

        const actions = [] as BuilderAction<any>[];
        const act = (data: BuilderAction<any>) => {
            actions.push(data);
            data.redo(setData);
        };
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 0], color: '0xfafafa', material: '0x1' }]));
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 1], color: '0xfafafb', material: '0x2' }]));
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 2], color: '0xfafbfa', material: '0x3' }]));

        inputStore.selectionMgr.selectSet(setData);
        inputStore.selectionMgr.selectAt(0, 1, 1);

        act(new MoveBriqs(setData, { delta: { x: 1 }, briqs: inputStore.selectionMgr.selectedBriqs, allow_overwrite: true }));

        expect(setData.getNbBriqs()).toEqual(3);
        expect(setData.getAt(0, 1, 0)).toHaveProperty('color', '0xfafafa');
        expect(setData.getAt(1, 1, 1)).toHaveProperty('color', '0xfafafb');
        expect(setData.getAt(0, 1, 2)).toHaveProperty('color', '0xfafbfa');

        expect(inputStore.selectionMgr.selectedBriqs[0].position).toEqual([1, 1, 1]);

        actions[actions.length - 1]!.undo(setData);

        expect(setData.getAt(0, 1, 1)).toHaveProperty('color', '0xfafafb');
        expect(inputStore.selectionMgr.selectedBriqs[0].position).toEqual([0, 1, 1]);

        actions[actions.length - 1]!.redo(setData);

        expect(setData.getAt(1, 1, 1)).toHaveProperty('color', '0xfafafb');
        expect(inputStore.selectionMgr.selectedBriqs[0].position).toEqual([1, 1, 1]);
    });

    test('Selection matches after rotation - new method', async () => {
        const setData = new SetData('0xfafa');

        const actions = [] as BuilderAction<any>[];
        const act = (data: BuilderAction<any>) => {
            actions.push(data);
            data.redo(setData);
        };
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 0], color: '0xfafafa', material: '0x1' }]));
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 1], color: '0xfafafb', material: '0x2' }]));
        act(new PlaceOrRemoveBriqs(setData, [{ pos: [0, 1, 2], color: '0xfafbfa', material: '0x3' }]));

        inputStore.selectionMgr.selectSet(setData);
        inputStore.selectionMgr.add(0, 1, 0);
        inputStore.selectionMgr.add(0, 1, 1);
        inputStore.selectionMgr.add(0, 1, 2);

        act(new RotateBriqs(setData, { axis: 'y', angle: Math.PI / 2, rotationCenter: new THREE.Vector3(0, 1, 0), briqs: inputStore.selectionMgr.selectedBriqs, allow_overwrite: true }));

        expect(setData.getNbBriqs()).toEqual(3);
        expect(setData.getAt(0, 1, -1)).toHaveProperty('color', '0xfafafa');
        expect(setData.getAt(1, 1, -1)).toHaveProperty('color', '0xfafafb');
        expect(setData.getAt(2, 1, -1)).toHaveProperty('color', '0xfafbfa');

        expect(inputStore.selectionMgr.selectedBriqs[2].position).toEqual([2, 1, -1]);

        actions[actions.length - 1]!.undo(setData);

        expect(setData.getAt(0, 1, 0)).toHaveProperty('color', '0xfafafa');
        expect(setData.getAt(0, 1, 1)).toHaveProperty('color', '0xfafafb');
        expect(setData.getAt(0, 1, 2)).toHaveProperty('color', '0xfafbfa');
        expect(inputStore.selectionMgr.selectedBriqs[2].position).toEqual([0, 1, 2]);

        actions[actions.length - 1]!.redo(setData);

        expect(setData.getAt(0, 1, -1)).toHaveProperty('color', '0xfafafa');
        expect(setData.getAt(1, 1, -1)).toHaveProperty('color', '0xfafafb');
        expect(setData.getAt(2, 1, -1)).toHaveProperty('color', '0xfafbfa');
        expect(inputStore.selectionMgr.selectedBriqs[2].position).toEqual([2, 1, -1]);
    });
});
