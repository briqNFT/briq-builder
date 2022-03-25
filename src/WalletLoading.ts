
export var setWalletInitComplete: any;
// Await this to wait until the wallet init process is complete.
export var walletInitComplete = new Promise((resolve, _) => { setWalletInitComplete = resolve; });
