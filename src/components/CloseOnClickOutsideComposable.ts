const closeIfOutside = (event: Event, source, onClose) => {
    if (!event.target || !source.contains(event.target as Node))
        onClose();
}

let ccc;

export const vCloseOutside = {
    mounted(target, binding) {
        ccc = (event) => closeIfOutside(event, target, binding.value);
        window.addEventListener('click', ccc, { capture: true });
    },
    unmounted() {
        window.removeEventListener('click', ccc, { capture: true })
    },
}
