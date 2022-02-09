import { reactive, watch, watchEffect, toRef } from 'vue';
import { store } from "../store/Store";

const CURR_VERSION = 2;

var provider = toRef(store.state.wallet, "provider");
var address = toRef(store.state.wallet, "userWalletAddress");

function getUserAddress(): string {
    return address.value;
}

class TransactionsManager
{
    transactions: Array<Transaction>;
    transactionsByKW: { [key: string]: Array<Transaction> };
    constructor()
    {
        this.transactions = [];
        this.transactionsByKW = {};
    }

    loadFromStorage()
    {
        this.transactions = [];
        this.transactionsByKW = {};

        if (!address)
            return;
        try {
            let storedTxs = window.localStorage.getItem("transactions_" + getUserAddress());
            if (!storedTxs)
                return;
            let txs = JSON.parse(storedTxs);
            if (txs.version !== CURR_VERSION)
                throw new Error("bad version");
            for (let txdata of txs.txs)
            {
                // TX is too old, skip
                if (Date.now() - txs.metadata?.timestamp > 3600*24)
                    continue;
                new Transaction(...txdata);
            }
            this.transactions.forEach(x => x.poll());
        }
        catch(err)
        {
            console.warn("Failed to load transactions:", err);
            window.localStorage.removeItem("transactions_" + getUserAddress());
        }
    }

    add(tx: Transaction, keyword: string)
    {
        this.transactions.push(tx);
        if (!this.transactionsByKW[keyword])
            this.transactionsByKW[keyword] = [];
        this.transactionsByKW[keyword].push(tx);
        this.transactions.forEach(x => x.poll());
        this.serialize();
    }

    delete(tx: Transaction)
    {
        this.transactions.splice(this.transactions.findIndex(x => x.hash === tx.hash), 1);
        this.transactionsByKW[tx.keyword].splice(this.transactionsByKW[tx.keyword].findIndex(x => x.hash === tx.hash), 1);
        
        this.serialize();
    }

    serialize()
    {
        // Shouldn't really happen, and won't matter.
        if (!getUserAddress())
            return;
        window.localStorage.setItem("transactions_" + getUserAddress(), JSON.stringify({
            version: CURR_VERSION,
            txs: this.transactions.map(x => [x.hash, x.keyword, x.status, x.metadata])
        }))
    }

    getTx(hash: string): Transaction | undefined
    {
        return this.transactions.find(x => x.hash === hash);
    }

    get(keyword: string): Array<Transaction>
    {
        return this.transactionsByKW?.[keyword] ?? [];
    }

    anyPending(): boolean
    {
        return this.transactions.some(x => x.isPending());
    }
}

type TxStatus = "UNKNOWN" | "PENDING" | "ERROR" | "ACCEPTED";

export class Transaction
{
    status: TxStatus;
    hash: string;
    keyword: string;
    mgr: TransactionsManager;
    metadata: any;

    refreshing: boolean = false;

    constructor(hash: string, keyword: string, status?: TxStatus, metadata?: any)
    {
        this.hash = hash;
        this.keyword = keyword;
        this.mgr = transactionsManager;
        this.mgr.add(this, keyword);

        this.metadata = metadata || {};
        this.metadata.timestamp = Date.now();
        this.status = status || "UNKNOWN";
    }

    delete()
    {
        this.mgr.delete(this);
    }

    async poll()
    {
        if (!provider.value)
            return;

        if (this.refreshing)
            return;
        this.refreshing = true;
        try {
            let status = (await provider.value.getTransactionStatus(this.hash)).tx_status;
            // Treat 'not received' as pending, as the TX shouldn't stay in that state for long.
            if (status === "PENDING" || status === "RECEIVED" || status === "NOT_RECEIVED")
                this.status = "PENDING";
            else if (status === "REJECTED")
                this.status = "ERROR";
            else if (status === "ACCEPTED_ON_L2" || status === "ACCEPTED_ON_L1" || status === "ACCEPTED_ONCHAIN") // Last one ought be temporary
                this.status = "ACCEPTED";
            else
                this.status = "ERROR";
            this.mgr.serialize();
        }
        catch(err)
        { /*ignore*/ }
        this.refreshing = false;
    }

    isOk()
    {
        return this.status !== "ERROR";
    }

    async getMetadata()
    {
        return await provider.value.getTransaction(this.hash);
    }

    isOnChain()
    {
        return this.status === "ACCEPTED";
    }

    isPending()
    {
        return this.status === "PENDING" || this.status === "UNKNOWN";
    }
}

export const transactionsManager = reactive(new TransactionsManager());
watch(provider, () => transactionsManager.loadFromStorage());
watch(address, () => transactionsManager.loadFromStorage());
transactionsManager.loadFromStorage();
