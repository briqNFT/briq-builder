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
        window.localStorage.setItem("transactions", JSON.stringify({
            version: CURR_VERSION,
            txs: this.transactions.map(x => [x.hash, x.keyword, x.metadata])
        }))
    }
}

export class Transaction
{
    status: "UNKNOWN" | "PENDING" | "ERROR" | "ACCEPTED" = "UNKNOWN";
    hash: string;
    keyword: string;
    mgr: TransactionsManager;
    metadata: any;

    constructor(hash: string, keyword: string, metadata?: any)
    {
        this.hash = hash;
        this.keyword = keyword;
        this.metadata = metadata;
        this.mgr = transactionsManager;
        this.mgr.add(this, keyword);
    }

    async poll()
    {
        console.log((await provider?.getTransactionStatus(this.hash)));
        let status = (await provider.getTransactionStatus(this.hash)).tx_status;
        console.log(status);
        if (status === "PENDING" || status === "RECEIVED")
            this.status = "PENDING";
        else if (status === "REJECTED")
            this.status = "ERROR";
        else if (status === "ACCEPTED_ONCHAIN")
            this.status = "ACCEPTED";
        else
            this.status = "PENDING";
    }
}

export const transactionsManager = reactive(new TransactionsManager());
transactionsManager.loadFromStorage();