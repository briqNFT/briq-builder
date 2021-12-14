import * as starknet from 'starknet';

import { provider } from '../Provider'

import { reactive } from 'vue';

const CURR_VERSION = 1;

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
        try {
            let txs = JSON.parse(window.localStorage.getItem("transactions")!);
            if (txs.version !== CURR_VERSION)
                throw new Error("bad version");
            for (let txdata of txs.txs)
                new Transaction(...txdata);
            if (provider)
                this.transactions.forEach(x => x.poll());
        }
        catch(err)
        {
            console.error(err);
            window.localStorage.removeItem("transactions");
        }
    }

    add(tx: Transaction, keyword: string)
    {
        this.transactions.push(tx);
        if (!this.transactionsByKW[keyword])
            this.transactionsByKW[keyword] = [];
        this.transactionsByKW[keyword].push(tx);
        if (provider)
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
        window.localStorage.setItem("transactions", JSON.stringify({
            version: CURR_VERSION,
            txs: this.transactions.map(x => [x.hash, x.keyword, x.metadata, x.status])
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
}

type TxStatus = "UNKNOWN" | "PENDING" | "ERROR" | "ACCEPTED";

export class Transaction
{
    status: TxStatus = "UNKNOWN";
    hash: string;
    keyword: string;
    mgr: TransactionsManager;
    metadata: any;

    refreshing: boolean;

    constructor(hash: string, keyword: string, metadata?: any, status?: TxStatus)
    {
        this.hash = hash;
        this.keyword = keyword;
        this.metadata = metadata;
        this.mgr = transactionsManager;
        this.mgr.add(this, keyword);
        // Assume status is correct.
        if (status)
            this.status = status;
    }

    delete()
    {
        this.mgr.delete(this);
    }

    async poll()
    {
        if (this.refreshing)
            return;
        this.refreshing = true;
        let status = (await provider.getTransactionStatus(this.hash)).tx_status;
        if (status === "PENDING" || status === "RECEIVED")
            this.status = "PENDING";
        else if (status === "REJECTED")
            this.status = "ERROR";
        else if (status === "ACCEPTED_ON_L2" || status === "ACCEPTED_ON_L1")
            this.status = "ACCEPTED";
        else
            this.status = "ERROR";
        this.refreshing = false;
        this.mgr.serialize();
    }

    isOk()
    {
        return this.status !== "ERROR";
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
transactionsManager.loadFromStorage();