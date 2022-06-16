import { store } from '@/store/Store';
import { watchEffect, ref } from 'vue';
import type { SetData } from './SetData';
import type { Briq } from './Briq';
import { downloadJSON } from '@/url';

export const useRecording = () => {
    const isRecording = ref(false);

    let record = [];

    let lastStep = [] as any[];

    watchEffect(() => {
        const currentSet = store.state.builderData.currentSet as SetData;
        currentSet.briqs_;
        if (!isRecording.value)
            return;
        for (const briq of lastStep)
            briq._found = false;

        // Store some extra data over regular serialization for simplicity.
        const data = currentSet.getAllBriqs().map(x => {
            const uid = '' + x.position[0] + x.position[1] + x.position[2] + x.material + x.color;
            const last = lastStep.find(o => o.uid == uid);
            if (last)
                last._found = true;
            return {
                pos: [...x.position],
                material: x.material,
                color: x.color,
                uid,
                _found: !!last,
            }
        });

        const added = data.filter(x => !x._found);
        const removed = lastStep.filter(x => !x._found);
        record.push({
            added,
            removed,
        })

        lastStep = data;
    })

    const startRecording = () => {
        isRecording.value = true;
        record = [];
    }
    const stopRecording = () => {
        isRecording.value = false;
        record = {
            steps: record,
            flow: Array.from(Array(record.length).keys()).filter(x => x).map(x => [x]),
        }
        downloadJSON(record, 'recording.json');
    }

    return {
        startRecording,
        stopRecording,
        isRecording,
    }
}