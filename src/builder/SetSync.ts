import { reactive, toRef, watch, WatchStopHandle } from 'vue'
import type { SetsManager } from './SetsManager';
import type { ChainSets } from './ChainSets';
import { logDebug } from '@/Messages';

class SetSync {
    localSets!: SetsManager;
    chainSets!: ChainSets;

    sets = new Set() as Set<string>;
    individualWatchers: { [sid: string]: WatchStopHandle } = {};

    init() {
        return this;
    }

    sync(localSets: SetsManager, chainSets: ChainSets) {
        watch([
            toRef(localSets, 'setsInfo'), toRef(chainSets, 'setData'),
        ], () => {
            logDebug('SET SYNC', localSets.setsInfo, chainSets.setData)
            for (const sid in this.individualWatchers)
                delete this.individualWatchers[sid];
            // TODO: be less wasteful
            this.sets.clear();
            localSets.setList.forEach(set => this.sets.add(set));
            chainSets.sets.forEach(set => this.sets.add(set));
            logDebug('SET SYNC - ', this.sets);
            this.sets.forEach(sid => {
                // NB -> if we want longer-lived watchers, we'll have to change this.
                watch([localSets.setsInfo[sid], chainSets.setData[sid]].filter(x => x), () => this.syncSetData(sid), { immediate: true });
            })
        }, {
            immediate: true,
        });
    }

    syncSetData(sid: string) {
        logDebug('Watching', sid);
    }
}

export const setSync = reactive(new SetSync()).init();
