import { ECDH } from 'crypto';
import { Account, Signer } from 'starknet';
import { getProvider } from './chain/Provider';


// By default post to any origin
const DEFAULT_TARGET_ORIGIN = '*';
// By default timeout is 60 seconds
const DEFAULT_TIMEOUT_MILLISECONDS = 240000;

const JSON_RPC_VERSION = '2.0';

// The interface for the source of the events, typically the window.
export interface MinimalEventSourceInterface {
addEventListener(
    eventType: 'message',
    handler: (message: MessageEvent) => void
    ): void;
};

// The interface for the target of our events, typically the parent window.
export interface MinimalEventTargetInterface {
    postMessage(message: any, targetOrigin?: string): void;
};

/**
* Options for constructing the iframe ethereum provider.
*/
export interface IFrameEthereumProviderOptions {
    // The origin to communicate with. Default '*'
    targetOrigin?: string;
    // How long to time out waiting for responses. Default 60 seconds.
    timeoutMilliseconds?: number;
    
    // The event source. By default we use the window. This can be mocked for tests, or it can wrap
    // a different interface, e.g. workers.
    eventSource?: MinimalEventSourceInterface;
    
    // The event target. By default we use the window parent. This can be mocked for tests, or it can wrap
    // a different interface, e.g. workers.
    eventTarget?: MinimalEventTargetInterface;
}

/**
* This is what we store in the state to keep track of pending promises.
*/
interface PromiseCompleter<TResult, TErrorData> {
    // A response was received (either error or result response).
    resolve(
        result:
        | JsonRpcSucessfulResponseMessage<TResult>
        | JsonRpcErrorResponseMessage<TErrorData>
        ): void;
        
        // An error with executing the request was encountered.
        reject(error: Error): void;
    }

type MessageId = number | string | null;

interface JsonRpcRequestMessage<TParams = any> {
    jsonrpc: '2.0';
    // Optional in the request.
    id?: MessageId;
    method: string;
    params?: TParams;
}

interface BaseJsonRpcResponseMessage {
    // Required but null if not identified in request
    id: MessageId;
    jsonrpc: '2.0';
}

interface JsonRpcSucessfulResponseMessage<TResult = any>
extends BaseJsonRpcResponseMessage {
    result: TResult;
}

interface JsonRpcError<TData = any> {
    code: number;
    message: string;
    data?: TData;
}

interface JsonRpcErrorResponseMessage<TErrorData = any>
extends BaseJsonRpcResponseMessage {
    error: JsonRpcError<TErrorData>;
}

type ReceivedMessageType =
| JsonRpcRequestMessage
| JsonRpcErrorResponseMessage
| JsonRpcSucessfulResponseMessage;

/**
* We return a random number between the 0 and the maximum safe integer so that we always generate a unique identifier,
* across all communication channels.
*/
function getUniqueId(): number {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}


////////////////////////
////// END OF COPIED CODE


class LedgerSigner extends Signer {
    constructor(keyPair /* EC.KeyPair */) {
        super(keyPair);
    }

    public async getPubKey(): Promise<string> {
        return ""; //getStarkKey(this.keyPair);
    }
    
    public async signTransaction(
        transactions,/*: Invocation[],*/
        transactionsDetail,/*: InvocationsSignerDetails,*/
        abis?: any /* Abi[] */
    ) {
        return [1, 2]
        /*
        if (abis && abis.length !== transactions.length) {
            throw new Error('ABI must be provided for each transaction or no transaction');
        }
        // now use abi to display decoded data somewhere, but as this signer is headless, we can't do that
        
        const calldata = fromCallsToExecuteCalldataWithNonce(transactions, transactionsDetail.nonce);
        
        const msgHash = calculcateTransactionHash(
            transactionsDetail.walletAddress,
            transactionsDetail.version,
            getSelectorFromName('__execute__'),
            calldata,
            transactionsDetail.maxFee,
            transactionsDetail.chainId
        );
        
        return sign(this.keyPair, msgHash);
        */
    }
    
    public async signMessage(typedData, accountAddress) {
        return [1, 2]
    }
}

class LedgerAccount extends Account {

    protected async fetchEndpoint<T/* extends keyof Endpoints*/>(
        endpoint: T,
        // typescript type magiuc to create a nice fitting function interface
        ...[query, request]: any/*Endpoints[T]['QUERY'] extends never
          ? Endpoints[T]['REQUEST'] extends never
            ? [] // when no query and no request is needed, we can omit the query and request parameters
            : [undefined, Endpoints[T]['REQUEST']]
          : Endpoints[T]['REQUEST'] extends never
          ? [Endpoints[T]['QUERY']] // when no request is needed, we can omit the request parameter
          : [Endpoints[T]['QUERY'], Endpoints[T]['REQUEST']] // when both query and request are needed, we cant omit anything
          */
    ) {
        console.log(endpoint);
        if (endpoint === 'estimate_fee')
            return { suggestedMaxFee: 0.01 };
        if (endpoint != 'add_transaction')
            return super.fetchEndpoint(endpoint, query, request);
        // We are now in add_transaction mode
        const res = await starknetObject?.send("eth_sendTransaction", [{ request }]);
        console.log(endpoint, query, request, res);
        return { result: [] };
    }
}

const pdpdpd = document.createElement('div');
pdpdpd.style.position = "absolute";
pdpdpd.style.top = "0px";
pdpdpd.style.left = "0px";
pdpdpd.style.zIndex = 100000;
//document.body.prepend(pdpdpd);

function debug(message) {
    const elem = document.createElement('p');
    elem.textContent = JSON.stringify(message);
    elem.style.color = 'black';
    //pdpdpd.appendChild(elem);
}

class LedgerStarknetObject {
    isConnected = false;
    account = undefined as undefined | Account; // 
    enabled: Promise<LedgerStarknetObject> | null = null;
    listeners = {};
    
    targetOrigin = DEFAULT_TARGET_ORIGIN;
    timeoutMilliseconds = DEFAULT_TIMEOUT_MILLISECONDS;
    eventSource = window;
    eventTarget = window.parent;

    private readonly completers: {
        [id: string]: PromiseCompleter<any, any>;
    } = {};

    constructor() {
        window.addEventListener('message', (message) => {
            debug(message.data);
            this.handleEventSourceMessage(message);
        });        
    }

    async enable(): Promise<LedgerStarknetObject> {
        if (this.enabled === null) {
            const promise = this.enabled = this.send('enable').then(message => {
                const address = message[0];
                this.account = new LedgerAccount(getProvider(), address, new LedgerSigner());
                this.isConnected = true;
                return this;
            }).catch(error => {
                debug({ "error": error })
                // Clear this.enabled if it's this promise so we try again next call.
                // this.enabled might be set from elsewhere if, e.g. the accounts changed event is emitted
                if (this.enabled === promise) {
                    this.enabled = null;
                }
                // Rethrow the error.
                throw error;
            });
        }
        debug("" + this.enabled);
        return this.enabled;
    }
    
    async send<TParams = any[], TResult = any>(
        method: string,
        params?: TParams
    ): Promise<TResult> {
        const response = await this.execute<TParams, TResult, any>(method, params);
        
        if ('error' in response) {
            throw new Error(response.error.code, response.error.message);
        } else {
            return response.result;
        }
    }
        
    private async execute<TParams, TResult, TErrorData>(
        method: string,
        params?: TParams,
        requestId?: MessageId
        ): Promise<
        | JsonRpcSucessfulResponseMessage<TResult>
        | JsonRpcErrorResponseMessage<TErrorData>
    > {
        const id = requestId ? requestId : getUniqueId();
        const payload: JsonRpcRequestMessage = {
            jsonrpc: JSON_RPC_VERSION,
            id,
            method,
            ...(typeof params === 'undefined' ? null : { params }),
        };

        const promise = new Promise<
        | JsonRpcSucessfulResponseMessage<TResult>
        | JsonRpcErrorResponseMessage<TErrorData>
        >((resolve, reject) => (this.completers[id] = { resolve, reject }));
        
        // Send the JSON RPC to the event source.
        window.parent.postMessage(payload, '*');
        
        // Delete the completer within the timeout and reject the promise.
        setTimeout(() => {
            if (this.completers[id]) {
                this.completers[id].reject(
                    new Error(
                        `RPC ID "${id}" timed out after ${this.timeoutMilliseconds} milliseconds`
                    )
                );
                delete this.completers[id];
            }
        }, this.timeoutMilliseconds);
                
        return promise;
    }

    private handleEventSourceMessage = (event: MessageEvent) => {
        const data = event.data;
    
        // No data to parse, skip.
        if (!data) {
            return;
        }
    
        const message = data as ReceivedMessageType;
    
        // Always expect jsonrpc to be set to '2.0'
        if (message.jsonrpc !== JSON_RPC_VERSION) {
            return;
        }
    
        // If the message has an ID, it is possibly a response message
        if (typeof message.id !== 'undefined' && message.id !== null) {
            const completer = this.completers['' + message.id];
        
            // True if we haven't timed out and this is a response to a message we sent.
            if (completer) {
                // Handle pending promise
                if ('error' in message || 'result' in message) {
                    completer.resolve(message);
                } else {
                    completer.resolve({});
                    /*
                    completer.reject(
                        new Error('Response from provider did not have error or result key')
                    );*/
                }
        
                delete this.completers[message.id];
            }
        }
    
        // If the method is a request from the parent window, it is likely a subscription.
        if ('method' in message) {
          switch (message.method) {
            /*
            case 'notification':
              this.emitNotification(message.params);
              break;
    
            case 'connect':
              this.emitConnect();
              break;
    
            case 'close':
              this.emitClose(message.params[0], message.params[1]);
              break;
    
            case 'chainChanged':
              this.emitChainChanged(message.params[0]);
              break;
    
            case 'networkChanged':
              this.emitNetworkChanged(message.params[0]);
              break;
            */
            case 'accountsChanged':
                this.account = new LedgerAccount(getProvider(), message.params[0][0], new LedgerSigner());
                this.listeners['accountsChanged']();
                break;
          }
        }
    };

    on(event, func) {
        this.listeners[event] = func;
    }
}

let starknetObject = undefined as undefined | LedgerStarknetObject;

export function goLedgerLive() {
    starknetObject = new LedgerStarknetObject();
    return starknetObject;
}
