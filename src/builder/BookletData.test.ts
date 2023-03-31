
// More of a Fetchable test really.

import { bookletDataStore } from './BookletData';

import { backendManager as bm2 } from '@/Backend';

const mockBackendManager = (() => {
    const ret = bm2;
    ret.fetch = vitest.fn();
    return ret;
})()

describe('Test Booklet data setup', () => {
    beforeEach(() => {
        vitest.clearAllMocks();
        vitest.doMock('@/Backend', () => ({
            backendManager: mockBackendManager,
        }));
    });

    test('should create new fetchables and work correctly on success', async () => {
        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === 'v1/booklet/data/test_network/test.json')
                return {
                    test: true,
                }
            throw new Error();
        });

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
        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === '/v1/booklet/data/test_network/test2.json')
                return {
                    statusCode: 500,
                }
            throw new Error();
        });

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
        vitest.mocked(mockBackendManager.fetch).mockImplementation(async (path) => {
            if (path === '/v1/booklet/data/test_network/test3.json')
                return {
                    statusCode: 500,
                }
            throw new Error();
        });

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
