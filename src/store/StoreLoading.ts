export var resolveLoading: any;
export var isLoaded = (() => {
    return new Promise((resolve) => {
        resolveLoading = resolve;
    });
})();
