type OpenFilePickerOptions = {
    multiple: boolean,
    excludeAcceptAllOption: boolean,
    types: {
        description: string,
        accept: { [mime:string]: string[] }
    }[]
};

export function showOpenFilePickerPolyfill(options: OpenFilePickerOptions = { multiple: false, excludeAcceptAllOption: false, types: [] }) {
    if (window.showOpenFilePicker)
        return window.showOpenFilePicker(options);

    // From https://stackoverflow.com/a/69118077 until Firefox / Brave support the above APIs.
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = options.multiple;
        input.accept = options.types
            .map((type) => type.accept)
            .flatMap((inst) => Object.keys(inst).flatMap((key) => inst[key]))
            .join(',');

        input.addEventListener('change', () => {
            resolve(
                [...input.files].map((file) => {
                    return {
                        getFile: async () =>
                            new Promise((resolve) => {
                                resolve(file);
                            }),
                    };
                }),
            );
        });

        input.click();
    });
}
