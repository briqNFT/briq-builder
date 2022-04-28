type MetaKeyData = { onDown?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean };
type HotkeyData = ({ key: string } & MetaKeyData) | ({ code: string } & MetaKeyData);
type StoredHotkeyData = HotkeyData & { unified: string };

// Values chosen to match onDown when booleaned
const UP = 0;
const DOWN = 1;
enum KEY_SETUP {
    UP,
    DOWN,
}

export type HotkeyHandle = [string, number];

/**
 * Simple hotkey system - listens to key pressed, once all keys of a hotkey are active, it goes live.
 * For simplicity reasons only shift / control / alt are registered as modifier keys.
 * NB: because for whatever reason the 'new API' for keyboard event has no easy way
 * to convert key codes into key keys and vice-versa (what SDL calls scancodes and keycodes),
 * (see https://github.com/WICG/keyboard-map for more details on this)
 * I'm registering both and the creator must choose. I'm assuming no conflict in naming.
 */
export class HotkeyManager {
    hotkeys: { [hotkey: string]: StoredHotkeyData } = {};

    callbacks: { [hotkey: string]: Array<[number, () => void]> } = {};
    listeners: { [hotkey: string]: (event: any) => void } = {};
    identifier = 1;

    keyHotkeys: { [unified: string]: Array<string> } = {};

    alt = false;
    ctrl = false;
    shift = false;

    activeKeys: { [key: string]: boolean } = {};
    activeCodes: { [code: string]: boolean } = {};

    constructor() {
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
        window.addEventListener('blur', (event) => this.onBlur(event));
    }

    /**
     * Register a new hotkey name / mapping.
     * For GUI convenience, if a hotkey with the same name exists already,
     * this assumes a duplicate and ignores.
     * @param hotkeyName Hotkey name. Must be unique.
     * @param data See HotkeyData.
     * @returns the hotkey manager to facilitate immediately subscribing.
     */
    register(hotkeyName: string, data: HotkeyData) {
        if (this.hotkeys[hotkeyName])
            return this;

        this.hotkeys[hotkeyName] = Object.assign({}, data);
        const hdata = this.hotkeys[hotkeyName];

        if (hdata.key)
            hdata.key = hdata.shift ? hdata.key.toUpperCase() : hdata.key.toLowerCase();

        hdata.unified = hdata?.key ?? hdata.code;

        if (hdata.key) {
            if (!this.keyHotkeys[hdata.key])
                this.keyHotkeys[hdata.key] = [];
            this.keyHotkeys[hdata.key].push(hotkeyName);
        }

        if (hdata.code) {
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
    subscribe(hotkeyName: string, callback: () => void): HotkeyHandle {
        const data = this.hotkeys[hotkeyName];
        if (!data)
            return [hotkeyName, 0];

        const id = ++this.identifier;
        this.callbacks[hotkeyName].splice(0, 0, [id, callback]);
        if (!this.listeners[hotkeyName]) {
            this.listeners[hotkeyName] = (event: any) => {
                if (event.detail.name !== hotkeyName)
                    return;
                // TODO: allow bubbling & stopping (possibly by returning an ENUM).
                // For now the bubbling stops at the first hotkey.
                this.callbacks[hotkeyName][0][1]();
            };
            window.addEventListener('hotkey', this.listeners[hotkeyName]);
        }
        return [hotkeyName, id];
    }

    unsubscribe(handler: HotkeyHandle) {
        const idx = this.callbacks[handler[0]].findIndex((x) => x[0] == handler[1]);
        if (idx === -1)
            return;
        this.callbacks[handler[0]].splice(idx, 1);
        if (!this.callbacks[handler[0]].length) {
            const cb = this.listeners[handler[0]];
            window.removeEventListener('hotkey', cb);
            delete this.listeners[handler[0]];
        }
    }

    isKeyDown(key: string) {
        return this.activeKeys?.[key] ?? false;
    }

    isCodeDown(code: string) {
        return this.activeCodes?.[code] ?? false;
    }

    checkPressed(hotkeyName: string, on: KEY_SETUP) {
        const data = this.hotkeys[hotkeyName];
        if (!data || !!data.onDown !== !!on)
            return false;

        // Exact match for modifier keys.
        if (!!data.ctrl !== this.ctrl || !!data.shift !== this.shift || !!data.alt !== this.alt)
            return false;

        return data.key ? this.isKeyDown(data.key) : this.isCodeDown(data.code);
    }

    maybeFireHotkey(hk: string, on: KEY_SETUP) {
        if (this.checkPressed(hk, on)) {
            const event = new CustomEvent('hotkey', {
                bubbles: true,
                cancelable: true,
                detail: { name: hk },
            });
            window.dispatchEvent(event);
            return true;
        }
        return false;
    }

    onKeyUp(event: KeyboardEvent) {
        if (event.key === 'Alt')
            this.alt = false;
        else if (event.key === 'Shift')
            this.shift = false;
        else if (event.key === 'Control')
            this.ctrl = false;
        else {
            const fired: { [hk: string]: boolean } = {};
            for (const hk of this.keyHotkeys?.[event.code] ?? [])
                fired[hk] = this.maybeFireHotkey(hk, UP);
            // Don't fire twice.
            for (const hk of this.keyHotkeys?.[event.key] ?? [])
                if (!fired[hk])
                    this.maybeFireHotkey(hk, UP);

            this.activeCodes[event.code] = false;
            this.activeKeys[event.key] = false;
        }
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Alt')
            this.alt = true;
        else if (event.key === 'Shift')
            this.shift = true;
        else if (event.key === 'Control')
            this.ctrl = true;
        else {
            this.activeCodes[event.code] = true;
            this.activeKeys[event.key] = true;

            const fired: { [hk: string]: boolean } = {};
            for (const hk of this.keyHotkeys?.[event.code] ?? [])
                fired[hk] = this.maybeFireHotkey(hk, DOWN);
            // Don't fire twice.
            for (const hk of this.keyHotkeys?.[event.key] ?? [])
                if (!fired[hk])
                    this.maybeFireHotkey(hk, DOWN);
        }
    }

    onBlur() {
        this.alt = false;
        this.shift = false;
        this.ctrl = false;
        for (const code in this.activeCodes)
            this.activeCodes[code] = true;
        for (const key in this.activeKeys)
            this.activeKeys[key] = true;
    }
}
