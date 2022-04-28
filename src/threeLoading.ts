export var setThreeLoadingComplete: any;

// Await this to wait until the wallet init process is complete.
export var threeSetupComplete = new Promise((resolve, _) => {
    setThreeLoadingComplete = resolve;
});
