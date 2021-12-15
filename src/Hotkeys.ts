type MetaKeyData = { onDown?: boolean, ctrl?: boolean, shift?: boolean, alt?: boolean }
type HotkeyData = ({ key: string } & MetaKeyData) | ({ code: string } & MetaKeyData);
type StoredHotkeyData = HotkeyData & { unified: string };

// Values chosen to match onDown when booleaned
const UP = 0;
const DOWN = 1;
enum KEY_SETUP {
    UP,
    DOWN
};

/**
 * Simple hotkey system - listens to key pressed, once all keys of a hotkey are active, it goes live.
 * For simplicity reasons only shift / control / alt are registered as modifier keys.
 * NB: because for whatever reason the 'new API' for keyboard event has no easy way
 * to convert key codes into key keys and vice-versa (what SDL calls scancodes and keycodes),
 * (see https://github.com/WICG/keyboard-map for more details on this)
 * I'm registering both and the creator must choose. I'm assuming no conflict in naming.
 */
export class HotkeyManager
{
    hotkeys: { [hotkey: string]: StoredHotkeyData } = {};
    callbacks: { [hotkey: string]: Array<() => void> } = {};
    
    keyHotkeys: { [unified: string]: Array<string> } = {};

    alt: boolean = false;
    ctrl: boolean = false;
    shift: boolean = false;

    activeKeys: { [key: string]: boolean } = {};
    activeCodes: { [code: string]: boolean } = {};

    constructor()
    {
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    /**
     * Register a new hotkey name / mapping.
     * For GUI convenience, if a hotkey with the same name exists already,
     * this assumes a duplicate and ignores.
     * @param hotkeyName Hotkey name. Must be unique.
     * @param data See HotkeyData.
     * @returns the hotkey manager to facilitate immediately subscribing.
     */
    register(hotkeyName: string, data: HotkeyData)
    {
        if (this.hotkeys[hotkeyName])
            return this;

        this.hotkeys[hotkeyName] = Object.assign({}, data);
        let hdata = this.hotkeys[hotkeyName];

        if (hdata.key)
            hdata.key = hdata.shift ? hdata.key.toUpperCase() : hdata.key.toLowerCase();
        
        hdata.unified = hdata?.key ?? hdata.code;

        if (hdata.key)
        {
            if (!this.keyHotkeys[hdata.key])
                this.keyHotkeys[hdata.key] = [];
            this.keyHotkeys[hdata.key].push(hotkeyName);
        }

        if (hdata.code)
        {
            if (!this.keyHotkeys[hdata.code])
                this.keyHotkeys[hdata.code] = [];
            this.keyHotkeys[hdata.code].push(hotkeyName);
        }

        this.callbacks[hotkeyName] = [];
        return this;
    }

    /**
     * Register a callback when a hotkey fires
     * @param hotkeyName Hotkey name to trigger on
     * @param callback Callback to call
     * @returns the identifier for unsubscription. Use as an opaque type recommended.
     */
    subscribe(hotkeyName: string, callback: () => void): [string, () => void]
    {
        let data = this.hotkeys[hotkeyName];
        if (!data)
            return [hotkeyName, callback];
        this.callbacks[hotkeyName].push(callback);
        // Fire immediately if the hotkey should trigger on down.
        if (this.checkPressed(hotkeyName, DOWN))
            callback();
        return [hotkeyName, callback];
    }

    unsubscribe(handler: [string, () => void])
    {
        let cbs = this.callbacks[handler[0]];
        if (!cbs)
            return;
        let idx = cbs.indexOf(handler[1]);
        cbs.splice(idx, 1);  
    }

    isKeyDown(key: string)
    {
        return this.activeKeys?.[key] ?? false;
    }

    isCodeDown(code: string)
    {
        return this.activeCodes?.[code] ?? false;
    }

    checkPressed(hotkeyName: string, on: KEY_SETUP)
    {
        let data = this.hotkeys[hotkeyName];
        if (!data || !!data.onDown !== !!on)
            return false;

            // Exact match for modifier keys.
        if (!!data.ctrl !== this.ctrl || !!data.shift !== this.shift || !!data.alt !== this.alt)
            return false;

        return data.key ? this.isKeyDown(data.key) : this.isCodeDown(data.code);
    }

    maybeFireHotkey(hk: string, on: KEY_SETUP)
    {
        if (this.checkPressed(hk, on))
            this.callbacks[hk].forEach(x => x());
    }

    onKeyUp(event: KeyboardEvent)
    {
        if (event.key === "Alt")
            this.alt = false;
        else if (event.key === "Shift")
            this.shift = false;
        else if (event.key === "Control")
            this.ctrl = false;
        else
        {
            // TODO: swap to synthetic events
            for (let hk of this.keyHotkeys?.[event.code] ?? [])
                this.maybeFireHotkey(hk, UP);
            for (let hk of this.keyHotkeys?.[event.key] ?? [])
                this.maybeFireHotkey(hk, UP);

            this.activeCodes[event.code] = false;
            this.activeKeys[event.key] = false;
        }
    }

    onKeyDown(event: KeyboardEvent)
    {
        if (event.key === "Alt")
            this.alt = true;
        else if (event.key === "Shift")
            this.shift = true;
        else if (event.key === "Control")
            this.ctrl = true;
        else
        {
            this.activeCodes[event.code] = true;
            this.activeKeys[event.key] = true;
            // TODO: swap to synthetic events
            for (let hk of this.keyHotkeys?.[event.code] ?? [])
                this.maybeFireHotkey(hk, DOWN);
            for (let hk of this.keyHotkeys?.[event.key] ?? [])
                this.maybeFireHotkey(hk, DOWN);
        }
    }
};
