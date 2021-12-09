type HotkeyData = { key: string, onDown?: boolean, ctrl?: boolean, shift?: boolean, alt?: boolean };

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
 * NB: hotkeys refer to key positions, not the actual key, so keyboard-independent.
 */
export class HotkeyManager
{
    hotkeys: { [hotkey: string]: HotkeyData } = {};
    callbacks: { [hotkey: string]: Array<() => void> } = {};
    keyHotkeys: { [keycode: string]: Array<string> } = {};

    alt: boolean = false;
    ctrl: boolean = false;
    shift: boolean = false;

    activeKeys: { [keycode: string]: boolean } = {};
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
        this.hotkeys[hotkeyName] = data;
        if (!this.keyHotkeys[data.key])
            this.keyHotkeys[data.key] = [];
        this.keyHotkeys[data.key].push(hotkeyName);        
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

    isDown(keyCode: string)
    {
        return this.activeKeys?.[keyCode] ?? false;
    }

    checkPressed(hotkeyName: string, on: KEY_SETUP)
    {
        let data = this.hotkeys[hotkeyName];
        if (!data || !!data.onDown !== !!on)
            return false;

            // Exact match for modifier keys.
        if (!!data.ctrl !== this.ctrl || !!data.shift !== this.shift || !!data.alt !== this.alt)
            return false;

        return this.isDown(data.key);
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
            for (let hk of this.keyHotkeys?.[event.code] ?? [])
                if (this.checkPressed(hk, UP))
                    this.callbacks[hk].forEach(x => x());
            this.activeKeys[event.code] = false;
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
            this.activeKeys[event.code] = true;
            for (let hk of this.keyHotkeys?.[event.code] ?? [])
                if (this.checkPressed(hk, DOWN))
                    this.callbacks[hk].forEach(x => x());
        }
    }
};
