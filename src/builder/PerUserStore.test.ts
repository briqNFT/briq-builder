import { Ref, ref } from 'vue';
import { perUserStorable, perUserStore } from './PerUserStore';

class TestStore implements perUserStorable {
}

interface FakeWalletStore {
    get user_id(): string;
}

function fakeWalletStore(user_id: string) {
    const maybeStore = ref(undefined) as Ref<FakeWalletStore | undefined>;
    let resolver: any;
    const prom = new Promise(resolve => resolver = () => {
        maybeStore.value = { user_id };
        resolve(maybeStore)
    });
    return [prom, maybeStore, resolver];
}

describe('Test PerUserStore', () => {
    test('should initialise to nothing', async () => {
        const store = perUserStore('TestStore', TestStore);
        const [prom, wallet, resolver] = fakeWalletStore('fakeWallet');
        store.setup(prom, wallet);
        expect(store.currentWallet).toStrictEqual(undefined);
        resolver();
        await new Promise(resolve => {
            setTimeout(() => {
                expect(store.currentWallet).toStrictEqual('fakeWallet');
                resolve(undefined);
            }, 0);
        });
        wallet.value.user_id = 'tatara';
        await new Promise(resolve => {
            setTimeout(() => {
                expect(store.currentWallet).toStrictEqual('tatara');
                resolve(undefined);
            }, 0);
        });
    });
});
