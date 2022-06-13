import contractStore from '@/chain/Contracts';
import { WalletStore, walletStore } from '@/chain/Wallet';
import { reactive, toRef, watch } from 'vue';

class PerUser<Data> {
    _type: new () => Data;
    _perWallet = {} as { [wallet: string]: Data };
    _currentWallet = undefined as undefined | string;
    constructor(type: new () => Data) {
        this._type = type;
    }

    _initialise(walletStore: WalletStore) {
        watch([toRef(walletStore, 'userWalletAddress')], () => {
            if (this._currentWallet === walletStore.userWalletAddress)
                return;

            if (!(walletStore.userWalletAddress in this._perWallet))
                this._perWallet[walletStore.userWalletAddress] = new this._type();
            this._currentWallet = walletStore.userWalletAddress;
        }, {
            immediate: true,
        })
    }
}

const perUserProxyFactory = <Data>(type: new () => Data) => new Proxy(reactive(new PerUser(type)), {
    get(target: PerUser<Data>, prop: string, receiver: any) {
        if (target._perWallet[target._currentWallet!] && prop in target._perWallet[target._currentWallet!])
            return target._perWallet[target._currentWallet!][prop];
        return Reflect.get(target, prop, receiver);
    },
    set(target: PerUser<Data>, prop: string, value: any, receiver: any) {
        if (target._perWallet[target._currentWallet!] && prop in target._perWallet[target._currentWallet!])
            return Reflect.set(target._perWallet[target._currentWallet!], prop, value);
        return Reflect.set(target, prop, value, receiver);
    },
}) as Data & PerUser<Data>;

class GenesisUserStore {
    availableBoxes = [] as string[];

    async fetchData() {
        this.availableBoxes = await contractStore.box!.getUnopenedBoxes(walletStore.userWalletAddress);

    }
}

export const genesisUserStore = perUserProxyFactory(GenesisUserStore);
genesisUserStore._initialise(walletStore);

export const genesisStore = reactive({
});
