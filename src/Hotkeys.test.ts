import { HotkeyManager } from "./Hotkeys";

let windowSpy: any;

let onKeyDown: Array<CallableFunction> = [];
let onKeyUp: Array<CallableFunction> = [];

beforeAll(() => {
  windowSpy = jest.spyOn(window, "window", "get");
  windowSpy.mockImplementation(() => ({
      addEventListener: (e: string, cb: CallableFunction) => {
        if (e === "keydown")
            onKeyDown.push(cb)
        else if (e === "keyup")
            onKeyUp.push(cb)
      }
  }))
});

afterAll(() => {
  windowSpy.mockRestore();
});

describe('Test HotkeyManager', () => {
    it('should listen for keyDown/Up', () => {
        let hm = new HotkeyManager();
        let incr = 0;
        let hook1 = hm.register("toto", { code: "KeyA" }).subscribe("toto", () => incr++);
        let hook2 = hm.register("toto2", { code: "KeyA", onDown: true }).subscribe("toto2", () => incr++);
        onKeyDown.forEach(x => x({ code: "KeyA" }));
        expect(incr).toEqual(1);
        onKeyUp.forEach(x => x({ code: "KeyA" }));
        expect(incr).toEqual(2);

        hm.unsubscribe(hook2);
        onKeyDown.forEach(x => x({ code: "KeyA" }));
        expect(incr).toEqual(2);
        onKeyUp.forEach(x => x({ code: "KeyA" }));
        expect(incr).toEqual(3);

        hm.unsubscribe(hook1);
        incr = 0;

        let hook3 = hm.register("toto3", { code: "KeyA", ctrl: true }).subscribe("toto3", () => incr++);
        let hook4 = hm.register("toto4", { code: "KeyA", ctrl: true, shift: true }).subscribe("toto4", () => incr++);
        onKeyDown.forEach(x => x({ key: "Control" }));

        onKeyDown.forEach(x => x({ code: "KeyA" }));
        onKeyUp.forEach(x => x({ code: "KeyA" }));
        expect(incr).toEqual(1);

        onKeyDown.forEach(x => x({ key: "Shift" }));

        onKeyDown.forEach(x => x({ code: "KeyA" }));
        onKeyUp.forEach(x => x({ code: "KeyA" }));
        expect(incr).toEqual(2);

        onKeyUp.forEach(x => x({ key: "Control" }));
        onKeyUp.forEach(x => x({ key: "Shift" }));

        onKeyDown.forEach(x => x({ code: "KeyA" }));
        onKeyUp.forEach(x => x({ code: "KeyA" }));
        expect(incr).toEqual(2);
    })
})