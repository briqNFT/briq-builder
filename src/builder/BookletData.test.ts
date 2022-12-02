
// More of a Fetchable test really.

import { bookletDataStore } from './BookletData';

import { MockAgent, setGlobalDispatcher } from 'undici';
import type { Interceptable } from 'undici/types/mock-interceptor';

let mockAgent: MockAgent;
let mockPool: Interceptable;


describe('Test Booklet data setup', () => {
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
        mockPool.intercept({
            path: '/v1/booklet/data/test_network/test.json',
            method: 'GET',
        }).reply(() => ({
            data: { test: true },
            statusCode: 200,
        }));
        const data = bookletDataStore['test_network']['test'];
        expect(data._data).toEqual(undefined);
        expect(data._fetch).toBeInstanceOf(Promise);
        expect(data._status).toEqual('FETCHING');
        // Wait until the request is done.
        await data._fetch;
        expect(data._status).toEqual('LOADED');
        expect(data._data).toEqual({ test: true });
        expect(data._fetch).toBeInstanceOf(Promise);
    });

    test('should fail on error', async () => {
        mockPool.intercept({
            path: '/v1/booklet/data/test_network/test2.json',
            method: 'GET',
        }).reply(() => ({
            statusCode: 500,
        }));
        const data = bookletDataStore['test_network']['test2'];
        expect(data._data).toEqual(undefined);
        expect(data._fetch).toBeInstanceOf(Promise);
        expect(data._status).toEqual('FETCHING');
        // Wait until the request is done. Has to be wrapped in case of error.
        try {
            await data._fetch;
        } catch(_) {
            _
        }
        expect(data._status).toEqual('ERROR');
        expect(data._data).toEqual(undefined);
        expect(data._fetch).toBeInstanceOf(Promise);
    });

    test('should fail on error (no explicit _fetch await)', async () => {
        mockPool.intercept({
            path: '/v1/booklet/data/test_network/test3.json',
            method: 'GET',
        }).reply(() => ({
            statusCode: 500,
        }));
        const data = bookletDataStore['test_network']['test3'];
        expect(data._data).toEqual(undefined);
        expect(data._fetch).toBeInstanceOf(Promise);
        expect(data._status).toEqual('FETCHING');
        await new Promise((resolve) => {
            setTimeout(() => resolve(null), 0);
        });
        expect(data._status).toEqual('ERROR');
        expect(data._data).toEqual(undefined);
        expect(data._fetch).toBeInstanceOf(Promise);
    });
});
