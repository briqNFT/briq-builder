
import { reactive, WatchStopHandle } from 'vue';
import SetContract from '../contracts/set';
import { SetData } from './SetData';
import { Briq } from './Briq';

import { hexUuid } from '../Uuid';
import { ignoreOutdated, isOutdated, ticketing } from '../Async';
import { reportError } from '../Monitoring';
import { fetchData } from '../url';

import { toRef, watch, watchEffect } from 'vue';
import { logDebug, pushMessage } from '../Messages';

export type SET_STATUS = "ONCHAIN_ONLY" | "ONCHAIN_LOADED" | "ONCHAIN_EDITING" | "LOCAL";

const SETINFO_VERSION = 1;

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
            version: SETINFO_VERSION,
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
            this.local = new SetData(data.id).deserialize(data.local);
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
            try {
                data = new SetData(this.id).deserialize(data);
            } catch(err) {
                reportError(err as Error, "Error while parsing set data from chain");
            }
        } catch(err) {
            if (isOutdated(err))
                return;
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

    async checkActuallyOnChain(setContract: SetContract) {
        let owner = await setContract.ownerOf(this.id);
        if (!owner || owner === "0x0")
        {
            this.chain_owner = '';
            this.status = 'LOCAL';
        }
        else
        {
            this.chain_owner = owner;
            if (this.status === 'LOCAL')
                this.status = 'ONCHAIN_EDITING';
        }
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
                    info.loadFromChain()
            }
            catch (e)
            {
                console.info("Could not parse stored set", sid, "error:", e)
                window.localStorage.removeItem(sid);
            };
        }
    }

    getSets = ticketing(async function(setContract: SetContract, owner: string) {
        return await setContract.balanceDetailsOf(owner);
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
            if (err?.message === "Network Error")
            {
                pushMessage("Error loading sets from chain - the connection to starknet timed out");
                console.error(err);
            }
            else
            {
                console.log(err);
                pushMessage("Error loading sets from chain - see console for details");
                reportError(err as Error);
            }
        }
        this.fetchingChainSets = false;
    };

    // TODO: move this elsewhere?
    watchForChain(contractStore: any, wallet: any) {
        watch([toRef(contractStore, "set"), toRef(wallet, "userWalletAddress")], () => {
            for (let sid in this.setsInfo)
            {
                // If the set is onchain & not owned by us, remove it.
                if (this.setsInfo[sid].isOnChain() && this.setsInfo[sid].chain_owner !== wallet.userWalletAddress)
                    this._deleteSet(sid);
                // Otherwise, query chain status
                else if (contractStore.set)
                {
                    this.setsInfo[sid].checkActuallyOnChain(contractStore.set).then(() => {
                        if (this.setsInfo?.[sid] && !this.setsInfo[sid].isLocalOnly())
                            this.setsInfo?.[sid].loadFromChain();
                    })
                }
            }
            if (contractStore.set && wallet.userWalletAddress)
            {
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

    onSetMinted(oldSetId: string | null, newSet: SetData) {
        let idx = this.setList.indexOf(oldSetId || "");
        if (idx !== -1)
        {
            this.setList.splice(idx, 1, newSet.id);
            this.setsInfo[newSet.id] = this.setsInfo[oldSetId!];
            this.setsInfo[newSet.id].id = newSet.id;
            delete this.setsInfo[oldSetId!];
        }
        else
            this.setsInfo[newSet.id] = new SetInfo(newSet.id);

        this.setsInfo[newSet.id].status = 'ONCHAIN_LOADED';
        this.setsInfo[newSet.id].chain = newSet;
        this.setsInfo[newSet.id].local = newSet;

        return this.setsInfo[newSet.id];
    }
};

export const setsManager = reactive(new SetsManager());


let storageHandlers: { [sid: string]: WatchStopHandle } = {};
watchEffect(() => {
    for (let sid in setsManager.setsInfo)
    {
        if (storageHandlers[sid])
            continue;
        storageHandlers[sid] = watchEffect(() => {
            let info = setsManager.setsInfo[sid];
            logDebug("SET STORAGE HANDLER - Serializing set ", sid);
            if (!info || info.status === 'ONCHAIN_ONLY')
            {
                // Delete
                if (window.localStorage.getItem("briq_set_" + sid))
                {
                    logDebug("SET STORAGE HANDLER - deleted local set");
                    window.localStorage.removeItem("briq_set_" + sid);
                }
                if (!info)
                {
                    logDebug("SET STORAGE HANDLER - unwatching ", sid);
                    storageHandlers[sid]();
                    delete storageHandlers[sid];
                }
                return;
            }
            window.localStorage.setItem("briq_set_" + sid, JSON.stringify(info.serialize()));        
        })
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
        const data: { "pos": [number, number, number], "color": string }[] = [
            {"pos":[4,0,0],"color":"#c5ac73"},
            {"pos":[3,0,0],"color":"#c5ac73"},
            {"pos":[2,0,0],"color":"#c5ac73"},
            {"pos":[1,0,0],"color":"#c5ac73"},
            {"pos":[1,1,0],"color":"#e6de83"},
            {"pos":[1,2,0],"color":"#e6de83"},
            {"pos":[2,2,0],"color":"#e6de83"},
            {"pos":[4,1,0],"color":"#62bdf6"},
            {"pos":[4,2,0],"color":"#62bdf6"},
            {"pos":[4,3,0],"color":"#62bdf6"},
            {"pos":[4,4,0],"color":"#e6de83"},
            {"pos":[3,4,0],"color":"#416aac"},
            {"pos":[2,4,0],"color":"#416aac"},
            {"pos":[1,4,0],"color":"#416aac"},
            {"pos":[-1,0,0],"color":"#394183"},
            {"pos":[-5,0,0],"color":"#416aac"},
            {"pos":[-5,1,0],"color":"#416aac"},
            {"pos":[-5,2,0],"color":"#416aac"},
            {"pos":[-5,3,0],"color":"#416aac"},
            {"pos":[-5,4,0],"color":"#416aac"},
            {"pos":[-1,1,0],"color":"#394183"},
            {"pos":[-1,2,0],"color":"#394183"},
            {"pos":[-1,3,0],"color":"#394183"},
            {"pos":[-1,4,0],"color":"#394183"},
            {"pos":[-2,4,0],"color":"#e6de83"},
            {"pos":[-4,4,0],"color":"#e6de83"},
            {"pos":[-3,3,0],"color":"#c5ac73"}
        ];
        for (let briqData of data)
            set.placeBriq(...briqData.pos, new Briq("0x1", briqData.color));
        setsManager.registerLocalSet(set);
        return set;
    }
}
