import { watchEffect, ref } from 'vue';
import { downloadJSON } from '@/url';
import { useBuilder } from './BuilderComposable';

export const useRecording = () => {
    const { currentSet } = useBuilder();
    const isRecording = ref(false);

    let record = [];

    let lastStep = [] as any[];

    watchEffect(() => {
        currentSet.value.briqs_;
        if (!isRecording.value)
            return;
        for (const briq of lastStep)
            briq._found = false;

        // Store some extra data over regular serialization for simplicity.
        const data = currentSet.value.getAllBriqs().map(x => {
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