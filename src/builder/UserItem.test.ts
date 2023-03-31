import { walletStore } from '@/chain/Wallet';
import { userBookletsStore } from './UserBooklets';
import { backendManager as bm2 } from '@/Backend';

const mockBackendManager = (() => {
    const ret = bm2;
    ret.fetch = vitest.fn();
    return ret;
})()

vitest.mock('@cartridge/controller')


describe('Test optimistic updates', () => {
    beforeEach(() => {
        vitest.clearAllMocks();
        vitest.doMock('@/Backend', () => ({
            backendManager: mockBackendManager,
        }));
    });

    afterEach(async () => {
        walletStore.disconnect();
    });

    test('should create new fetchables and work correctly on success', async () => {
        expect(userBookletsStore.current).toEqual(undefined);

        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === 'v1/user/data/localhost/0xcafe')
                return {
                    last_block: 50,
                    booklets: ['test/test_1'],
                }
            throw new Error();
        });

        walletStore.enableWallet({
            address: '0xcafe',
            signer: { gatewayUrl: 'toto' },
            isConnected: true,
            account: { gatewayUrl: 'toto', address: '0xcafe' },
            enable: () => true,
            on: () => {},
        });
        await new Promise(res => setTimeout(res, 0));

        expect(userBookletsStore.current!.booklets).toEqual(['test/test_1']);
        userBookletsStore.current!.showOne('test/test_2', '0xcafe1')
        expect(userBookletsStore.current!.booklets).toEqual(['test/test_1', 'test/test_2']);
        userBookletsStore.current!.hideOne('test/test_1', '0xcafe2')
        expect(userBookletsStore.current!.booklets).toEqual(['test/test_2']);
        userBookletsStore.current!.showOne('test/test_2', '0xcafe3')
        expect(userBookletsStore.current!.booklets).toEqual(['test/test_2','test/test_2']);
    });


    test('should correctly pop pending data', async () => {
        expect(userBookletsStore.current).toEqual(undefined);

        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === 'v1/user/data/localhost/0xcafe2')
                return {
                    last_block: 50,
                    booklets: ['test/test_1'],
                }
            throw new Error();
        });

        walletStore.enableWallet({
            address: '0xcafe2',
            signer: { gatewayUrl: 'toto' },
            isConnected: true,
            account: { gatewayUrl: 'toto', address: '0xcafe2' },
            enable: () => true,
            on: () => {},
        });
        await new Promise(res => setTimeout(res, 0));
        console.log('toto');

        expect(userBookletsStore.current?.booklets).toEqual(['test/test_1']);
        userBookletsStore.current!.showOne('test/test_2', '0xcafe')
        expect(userBookletsStore.current?.booklets).toEqual(['test/test_1', 'test/test_2']);
        userBookletsStore.current!._fetchData();
        expect(userBookletsStore.current?.booklets).toEqual(['test/test_1', 'test/test_2']);
        userBookletsStore.current!.metadata['test/test_2'].updates[0].block = 30;
        await userBookletsStore.current?._fetchData();
        expect(userBookletsStore.current?.booklets).toEqual(['test/test_1']);
    });
});
