import { getCurrentNetwork } from '@/chain/Network';
import { useGenesisStore } from './GenesisStore';
import { backendManager as bm2 } from '@/Backend';

vitest.mock('@/chain/Network', () => ({
    getCurrentNetwork: vitest.fn(),
}));

const mockFn = (() => {
    const ret = bm2;
    ret.fetch = vitest.fn();
    return ret;
})()

describe('Genesis Store', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        vitest.clearAllMocks();

        // Mock any external dependencies
        vitest.doMock('@/Backend', () => ({
            backendManager: mockFn,
        }));
    });

    test('Initial network is set correctly', () => {
        const store = useGenesisStore();
        expect(store.network).toBe(getCurrentNetwork());
    });

    test('setNetwork updates network and refreshes boxes', () => {
        const store = useGenesisStore();
        const initialNetwork = store.network;
        const newNetwork = 'starknet-mainnet';

        const refreshBoxesSpy = vitest.spyOn(store, 'refreshBoxes');

        store.setNetwork(newNetwork);

        expect(store.network).not.toBe(initialNetwork);
        expect(store.network).toBe(newNetwork);
        expect(refreshBoxesSpy).toHaveBeenCalled();
    });

    test('refreshBoxes clears all data', () => {
        const store = useGenesisStore();

        // Add some mock data to the state
        store._metadata['mockBox'] = { status: 'loaded', data: {} };
        store._saledata['mockSale'] = { status: 'loaded', data: {} };
        store._boxes['mockTheme'] = { status: 'loaded', data: [] };
        store._themedata['mockTheme'] = { status: 'loaded', data: {} };

        store.refreshBoxes();

        expect(Object.keys(store._metadata)).toHaveLength(0);
        expect(Object.keys(store._saledata)).toHaveLength(0);
        expect(Object.keys(store._boxes)).toHaveLength(0);
        expect(Object.keys(store._themedata)).toHaveLength(0);
    });

    test('metadata getter returns correct data', async () => {
        const store = useGenesisStore();
        const mockBoxUid = 'mockBoxUid';
        const mockBoxMetadata = { [mockBoxUid] : { name: 'Mock Box' } };

        // Mock the backendManager fetch method to return mockBoxMetadata
        mockFn.fetch.mockResolvedValue(mockBoxMetadata);

        const metadata = store.metadata[mockBoxUid];

        expect(metadata._status).toBe('FETCHING');

        // Wait for the async fetch to complete
        await metadata._fetch

        expect(metadata._status).toBe('LOADED');
        expect(metadata._data).toEqual({ name: 'Mock Box' });
    });

    test('themedata getter returns correct data', async () => {
        const store = useGenesisStore();
        const mockBoxUid = 'mockBoxUid';
        const mockBoxMetadata = { id: mockBoxUid, name: 'Mock Box' };

        // Mock the backendManager fetch method to return mockBoxMetadata
        vitest.mocked(mockFn.fetch).mockResolvedValue(mockBoxMetadata);

        const metadata = store.themedata[mockBoxUid];

        expect(metadata._status).toBe('FETCHING');

        // Wait for the async fetch to complete
        await metadata._fetch;

        expect(metadata._status).toBe('LOADED');
        expect(metadata._data).toEqual(mockBoxMetadata);
    });

    test('coverItemRoute returns correct route', () => {
        const store = useGenesisStore();
        const booklet_id = 'test_booklet_id';
        const lowQuality = false;

        const coverItemRoute = store.coverItemRoute(booklet_id, lowQuality);

        expect(coverItemRoute).toBe(`http://localhost:5055/v1/box/cover_item/${store.network}/${encodeURIComponent(booklet_id)}.${lowQuality ? 'jpg' : 'png'}`);
    });
});