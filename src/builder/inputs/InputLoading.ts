import { ref } from 'vue';

// Needs to be called when the input init is complete.
export const setInputInitComplete = ref(undefined);

// Await this to wait until the wallet init process is complete.
export const inputInitComplete = ref(new Promise((resolve, _) => {
    setInputInitComplete.value = resolve;
}));

export function resetInputComplete() {
    inputInitComplete.value = new Promise((resolve, _) => {
        setInputInitComplete.value = resolve;
    });
}
