import { walletStore } from '@/chain/Wallet';
import { userBookletsStore } from './UserBooklets';

import { MockAgent, setGlobalDispatcher } from 'undici';
import type { Interceptable } from 'undici/types/mock-interceptor';

let mockAgent: MockAgent;
let mockPool: Interceptable;

describe('Test optimistic updates', () => {
    beforeEach(() => {
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect(); // prevent actual requests to Discord
        setGlobalDispatcher(mockAgent); // enabled the mock client to intercept requests
        mockPool = mockAgent.get('http://localhost:5055');
    });

    afterEach(async () => {
        await mockAgent.close();
    });

    test('should create new fetchables and work correctly on success', async () => {
        expect(userBookletsStore.current).toEqual(undefined);

        mockPool.intercept({
            path: '/v1/user/data/localhost/0xcafe',
            method: 'GET',
        }).reply(() => ({
            data: { booklets: ['test/test_1'] },
            statusCode: 200,
        }));

        walletStore.enableWallet({
            address: '0xcafe',
            signer: { gatewayUrl: 'toto' },
            isConnected: true,
            account: { gatewayUrl: 'toto', address: '0xcafe' },
            enable: () => true,
            on: () => {},
        });
        await new Promise(res => setTimeout(res, 0));

        expect(userBookletsStore.current?.booklets).toEqual(['test/test_1']);
        userBookletsStore.current?.showOne('test/test_2', '0xcafe')
        expect(userBookletsStore.current?.booklets).toEqual(['test/test_1', 'test/test_2']);
        userBookletsStore.current?.hideOne('test/test_1', '0xcafe2')
        expect(userBookletsStore.current?.booklets).toEqual(['test/test_2']);
        userBookletsStore.current?.showOne('test/test_2', '0xcafe3')
        expect(userBookletsStore.current?.booklets).toEqual(['test/test_2','test/test_2']);
    });
});
