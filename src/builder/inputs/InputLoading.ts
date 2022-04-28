// Needs to be called when the input init is complete.
export var setInputInitComplete: any;

// Await this to wait until the wallet init process is complete.
export var inputInitComplete = new Promise((resolve, _) => {
    setInputInitComplete = resolve;
});
