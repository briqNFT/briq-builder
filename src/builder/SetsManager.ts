
import { reactive } from 'vue';
import SetContract from '../contracts/set';
import { SetData} from './SetData';

import { hexUuid } from '../Uuid';
import { ignoreOutdated, ticketing } from '../Async';
import { reportError } from '../Monitoring';
import { fetchData } from '../url';

import { toRef, watch, watchEffect } from 'vue';
import { pushMessage } from '../Messages';

export type SET_STATUS = "ONCHAIN_ONLY" | "ONCHAIN_LOADED" | "ONCHAIN_EDITING" | "LOCAL";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export class SetInfo {
    id: string;
    local?: SetData;
    chain?: SetData;
    status: SET_STATUS = 'LOCAL';
    
    chain_owner: string = '';
    // True if we are currently syncing with the chain.
    syncing = false;

    constructor(sid: string, status?: SET_STATUS) {
        this.id = sid;
        if (status)
            this.status = status;
    }

    serialize() {
        return {
            id: this.id,
            status: this.status,
            chain_owner: this.chain_owner,
            local: this.local?.serialize(),
        }
    }

    deserialize(data: any)
    {
        this.syncing = false;
        this.status = data.status;
        this.id = data.id;
        this.chain_owner = data.chain_owner;
        if (data.local)
            this.local = new SetData(this.id).deserialize(data.local);
        // TODO: check coherence.
        return this;
    }

    getSet() {
        return this.local || this.chain;
    }

    setLocal(set: SetData) {
        this.local = set;
        return this;
    }

    /**
     * @returns Whether this set currently exists on chain. LOCAL & ONCHAIN_EDITING thus return false.
     */
     isOnChain() {
        return this.status === 'ONCHAIN_ONLY' || this.status === 'ONCHAIN_LOADED';
    }

    /**
     * @returns Whether the current set is being edited. Semantically !isOnChain
     */
    isEditing() {
        return this.status === 'ONCHAIN_EDITING' || this.status === 'LOCAL';
    }

    isLocalOnly() {
        return this.status === 'LOCAL';
    }

    // TODO: maybe move those mostly to setManager? Except maybe the ticketing?
    _fetchFromChain = ticketing(async function(sid: string) {
        return (await fetchData("store_get/" + sid)).data;
    });

    async _loadFromChain() {
        let data;
        try {
            data = await this._fetchFromChain(this.id);
            await sleep(5000);
            try {
                data = new SetData(data.id).deserialize(data);
            } catch(err) {
                reportError(err as Error, "Error while parsing set data from chain");
            }
        } catch(err) {
            reportError(err as Error, "Error while loading chain set data");
        }
        if (data)
            this.chain = data;
        else
            delete this.chain;
    }

    async loadFromChain(force = false) {
        if (this.chain && !force)
            return this.chain;
        this.syncing = true;
        await this._loadFromChain();
        this.syncing = false;
        return this;
    }

    async loadLocally() {
        await this.loadFromChain();
        this.local = new SetData(this.id).deserialize(this.chain?.serialize());
        this.status = "ONCHAIN_LOADED";
    }
}

class SetsManager
{
    setList: Array<string> = [];
    setsInfo: { [setId: string]: SetInfo } = {};

    fetchingChainSets = false;

    /**
     * Load all sets from local storage. Note that this doesn't clear any preloaded sets (such as on-chain ones).
     */
    async loadFromStorage() {
        for (let [sid, setData] of Object.entries(window.localStorage))
        {
            if (!sid.startsWith("briq_set"))
               continue;
            try
            {
                let data = JSON.parse(setData);
                let info = new SetInfo(sid).deserialize(data);
                this.setList.push(info.id);
                this.setsInfo[info.id] = info;
                if (!info.isLocalOnly())
                    info.loadFromChain();
            }
            catch (e)
            {
                console.info("Could not parse stored set", sid, "error:", e)
                window.localStorage.removeItem(sid);
            };
        }
    }

    getSets = ticketing(async function(setContract: SetContract, owner: string) {
        return await setContract.get_all_tokens_for_owner(owner);
    })

    async loadOnChain(setContract: SetContract, owner: string) {
        this.fetchingChainSets = true;
        try {
            await ignoreOutdated(async () => {
                let sets = await this.getSets(setContract, owner);
                for (let id of sets)
                {
                    if (!this.setsInfo[id])
                        this.setList.push(id);
                    if (this.setsInfo[id])
                    {
                        // If we found a same-ID set marked local, then assume we're editing it.
                        if (this.setsInfo[id].status === "LOCAL")
                            this.setsInfo[id].status = "ONCHAIN_EDITING";
                        // Otherwise keep the local set, it's probably got good data.
                    }
                    else
                        this.setsInfo[id] = new SetInfo(id, "ONCHAIN_ONLY");
                    this.setsInfo[id].loadFromChain();
                    // TODO: we probably should set this elsewhere
                    this.setsInfo[id].chain_owner = owner;
                }
            });
        } catch(err) {
            console.log(err);
            pushMessage("Error loading sets from chain - see console for details");
        }
        this.fetchingChainSets = false;
    };

    // TODO: move this elsewhere?
    watchForChain(contractStore: any, wallet: any) {
        watch([toRef(contractStore, "set"), toRef(wallet, "userWalletAddress")], () => {
            for (let sid in this.setsInfo)
            {
                // If the set is onchain & unedited, drop it.
                if (this.setsInfo[sid].isOnChain() && this.setsInfo[sid].chain_owner !== wallet.userWalletAddress)
                    this._deleteSet(sid);
                // Otherwise, switch it to local (TODO: maybe acknowledge it's on-chain but you don't own it?)
                else if (!this.setsInfo[sid].isOnChain())
                {
                    this.setsInfo[sid].status = 'LOCAL';
                    delete this.setsInfo[sid].chain;
                }
            }
            if (contractStore.set && wallet.userWalletAddress)
            {
                //console.log("LOADING CHAIN SETS", contractStore.set.connectedTo, wallet.userWalletAddress);
                setsManager.loadOnChain(contractStore.set, wallet.userWalletAddress);
            }
        })
    }

    getInfo(sid: string) {
        return this.setsInfo[sid];
    }

    /**
     * Return a random local set. Used to easily query a local set, since the builder needs to always have one for now.
     * @returns a local set, or undefined if none exist.
     */
    getLocalSet() {
        for (let sid in this.setsInfo)
            if (this.setsInfo[sid].local)
                return this.setsInfo[sid].local;
    }

    createLocalSet() {
        let set = new SetData(hexUuid());
        set.name = "New Set";
        this.registerLocalSet(set);
        return set;
    }

    _deleteSet(sid: string) {
        if (!this.setsInfo[sid])
            return;
        let idx = this.setList.indexOf(sid);
        if (idx === -1)
            throw new Error("Set part of setData but not part of setList, this should be impossible.");
        this.setList.splice(idx, 1);
        delete this.setsInfo[sid];
        // Delete localstorage after for it may have been reloaded otherwise.
        window.localStorage.removeItem("briq_set_" + sid);
    }

    /**
     * Register a new local set.
     */
    registerLocalSet(set: SetData) {
        if (this.setsInfo[set.id])
            throw new Error("Set with ID " + set.id + " already exists");
        this.setsInfo[set.id] = new SetInfo(set.id, 'LOCAL').setLocal(set);
        this.setList.push(set.id);
        return this.setsInfo[set.id];
    }

    /**
     * Delete the local copy of a set, possibly revealing the on-chain copy.
     * @param sid ID of the set.
     */
    deleteLocalSet(sid: string) {
        let data = this.setsInfo[sid];
        if (!data)
            return;
        if (data.status === 'LOCAL')
            return this._deleteSet(sid);
        data.status = 'ONCHAIN_ONLY';
        delete data.local;
        // Delete localstorage after for it may have been reloaded otherwise.
        window.localStorage.removeItem("briq_set_" + sid);
        // TODO: reload set
    }

    duplicateLocally(set: SetData) {
        let copy = setsManager.createLocalSet();
        let data = set.serialize();
        delete data.id;
        copy.deserialize(data);
        return copy;
    }
};

export const setsManager = reactive(new SetsManager());

watchEffect(() => {
    // TODO: this can probably get quite inefficient.
    for (let sid in setsManager.setsInfo)
    {
        let info = setsManager.setsInfo[sid];
        if (info.status === 'ONCHAIN_ONLY')
            continue;
        console.log("Serializing set ", sid);
        window.localStorage.setItem("briq_set_" + sid, JSON.stringify(info.serialize()));
    }
});

// TODO: move this elsewhere?
export function checkForInitialGMSet()
{
    if (setsManager.setList.length)
        return;
    if (!window.localStorage.getItem("has_initial_gm_set"))
    {
        window.localStorage.setItem("has_initial_gm_set", "true")
        let set = new SetData(hexUuid());
        set.name = "GM";
        const data: { "pos": [number, number, number], "color": string, "voxelId": number }[] = [
            {"pos":[4,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[3,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[2,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[1,0,0],"color":"#c5ac73","voxelId":1},
            {"pos":[1,1,0],"color":"#e6de83","voxelId":1},
            {"pos":[1,2,0],"color":"#e6de83","voxelId":1},
            {"pos":[2,2,0],"color":"#e6de83","voxelId":1},
            {"pos":[4,1,0],"color":"#62bdf6","voxelId":1},
            {"pos":[4,2,0],"color":"#62bdf6","voxelId":1},
            {"pos":[4,3,0],"color":"#62bdf6","voxelId":1},
            {"pos":[4,4,0],"color":"#e6de83","voxelId":1},
            {"pos":[3,4,0],"color":"#416aac","voxelId":1},
            {"pos":[2,4,0],"color":"#416aac","voxelId":1},
            {"pos":[1,4,0],"color":"#416aac","voxelId":1},
            {"pos":[-1,0,0],"color":"#394183","voxelId":1},
            {"pos":[-5,0,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,1,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,2,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,3,0],"color":"#416aac","voxelId":1},
            {"pos":[-5,4,0],"color":"#416aac","voxelId":1},
            {"pos":[-1,1,0],"color":"#394183","voxelId":1},
            {"pos":[-1,2,0],"color":"#394183","voxelId":1},
            {"pos":[-1,3,0],"color":"#394183","voxelId":1},
            {"pos":[-1,4,0],"color":"#394183","voxelId":1},
            {"pos":[-2,4,0],"color":"#e6de83","voxelId":1},
            {"pos":[-4,4,0],"color":"#e6de83","voxelId":1},
            {"pos":[-3,3,0],"color":"#c5ac73","voxelId":1}
        ];
        for (let briqData of data)
            set.placeBriq(...briqData.pos, briqData.color, briqData.voxelId);
        setsManager.registerLocalSet(set);
        return set;
    }
}
