import contractStore from '@/chain/Contracts';
import { getCalls } from './migrate';

import { backendManager as bm2 } from '@/Backend';
import { SetOnDojoContract } from '@/chain/contracts/set';

const mockBackendManager = (() => {
    const ret = bm2;
    ret.fetch = vitest.fn();
    return ret;
})()


const data = {
    'boxes': [{
        'owner': '0x03eF5B02BCC5D30F3f0d35D55f365E6388fE9501ECA216cb1596940Bf41083E2',
        'box_id': '1',
    },
    {
        'owner': '0x03eF5B02BCC5D30F3f0d35D55f365E6388fE9501ECA216cb1596940Bf41083E2',
        'box_id': 4,
    },
    {
        'owner': '0x03eF5B02BCC5D30F3f0d35D55f365E6388fE9501ECA216cb1596940Bf41083E2',
        'box_id': 10,
    }],
    'booklets': [{
        'owner':  '0x03eF5B02BCC5D30F3f0d35D55f365E6388fE9501ECA216cb1596940Bf41083E2',
        'old_token_id': '0x2000000000000000000000000000000000000000000000001',
    }, {
        'owner':  '0x03eF5B02BCC5D30F3f0d35D55f365E6388fE9501ECA216cb1596940Bf41083E2',
        'old_token_id': '0xa3000000000000000000000000000000000000000000000003',
    }],
    'sets': [{
        'owner': '0x03eF5B02BCC5D30F3f0d35D55f365E6388fE9501ECA216cb1596940Bf41083E2',
        'old_token_id': '0x400000',
        'matching_booklet_name': 'briqmas/test',
    }],
}

const fakeBookletData = {
    token_id: '0x30000000000000009',
    briqs: [
        {
            'pos': [
                -2,
                0,
                1,
            ],
            'data': {
                'material': '0x1',
                'color': '#151515',
            },
        },
        {
            'pos': [
                -1,
                0,
                1,
            ],
            'data': {
                'material': '0x1',
                'color': '#151515',
            },
        },
        {
            'pos': [
                -2,
                1,
                1,
            ],
            'data': {
                'material': '0x1',
                'color': '#4f4f4f',
            },
        },
    ],
}

describe('Test migration call parsing', () => {
    beforeEach(() => {
        vitest.clearAllMocks();
        vitest.doMock('@/Backend', () => ({
            backendManager: mockBackendManager,
        }));
    });
    test('should parse stuff correctly', async () => {
        contractStore.set = new SetOnDojoContract('0xtoto');
        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === 'v1/booklet/data/starknet-testnet-dojo/briqmas%2Ftest.json')
                return fakeBookletData;
            throw new Error();
        });
        // console.log(JSON.stringify(data, null, 4))
        const parsedCalls = await getCalls(data);
        console.log(parsedCalls);
    });
});
