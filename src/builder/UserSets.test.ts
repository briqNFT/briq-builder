import { walletStore } from '@/chain/Wallet';
import { backendManager as bm2 } from '@/Backend';
import { userSetStore } from './UserSets';
import { SetData } from './SetData';
import { Briq } from './Briq';
import contractStore from '@/chain/Contracts';
import { watchSignerChanges } from '@/chain/ContractsLoader';

const mockBackendManager = (() => {
    const ret = bm2;
    ret.fetch = vitest.fn();
    ret.post = vitest.fn().mockRejectedValue(null);
    return ret;
})()

watchSignerChanges(walletStore);

vitest.mock('@cartridge/controller')

describe('Test Set minting', () => {
    beforeEach(() => {
        vitest.clearAllMocks();
        vitest.doMock('@/Backend', () => ({
            backendManager: mockBackendManager,
        }));
    });

    afterEach(async () => {
        walletStore.disconnect();
    });

    test('Should be able to mint a set', async () => {
        // Setup
        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === 'v1/user/data/localhost/0xcafe')
                return {
                    last_block: 50,
                    booklets: ['test/test_1'],
                    sets: [],
                }
            if (path === 'v1/booklet/data/localhost/test%2Ftest_1.json')
                return {
                }
            throw new Error(path);
        });
        walletStore.enableWallet({
            address: '0xcafe',
            isConnected: true,
            signer: { gatewayUrl: 'toto' },
            account: { gatewayUrl: 'toto', address: '0xcafe', execute: vitest.fn().mockResolvedValue({ transaction_hash: '0x4321' }) },
            enable: () => true,
            on: () => {},
        });
        await new Promise(res => setTimeout(res, 0));

        //contractStore.briq_factory = vitest.fn();

        const setData = new SetData('0xfade');
        setData.placeBriq(1, 2, 3, new Briq('0x1', '0xff0000'));
        let tx = await userSetStore.current!.mintSet([], '0xcafe', setData.serialize(), '');
        expect(tx.transaction_hash).toEqual('0x4321');
        tx = undefined;
        tx = await userSetStore.current!.mintBookletSet([], '0xcafe', setData.serialize(), 'BINARYDATA', 'test/test_1');
        expect(tx.transaction_hash).toEqual('0x4321');
    });
});