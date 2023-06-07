import { expect, test } from "vitest";
import { ConvertKeymaps, type Keymap } from "../keymap";

test("KeymapTest", () => {
  const keymap: Keymap[] = [{ layer: { id: 0, keys: { KC_A: "KC_B" } } }];
  const cKeymap = ConvertKeymaps(keymap, 0);
  expect(new Uint8Array(cKeymap.keymap_keys.$buffer)).toEqual(
    Uint8Array.from([4, 0, 5, 0])
  );
  expect(new Uint8Array(cKeymap.cKeymaps.$buffer).slice(0, 8)).toEqual(
    Uint8Array.from([0, 0, 1, 0, 12, 0, 0, 0])
  );
});

test("KeymapTest2", () => {
  const keymap: Keymap[] = [
    { layer: { id: 0, keys: { KC_A: "KC_B" } } },
    { layer: { id: 1, keys: { KC_C: "KC_D", KC_E: "KC_F" } } },
  ];
  const cKeymap = ConvertKeymaps(keymap, 0);
  expect(new Uint8Array(cKeymap.keymap_keys.$buffer)).toEqual(
    Uint8Array.from([4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 9, 0])
  );
  expect(new Uint8Array(cKeymap.cKeymaps.$buffer).slice(0, 8)).toEqual(
    Uint8Array.from([0, 0, 1, 0, 24, 0, 0, 0])
  );
  expect(new Uint8Array(cKeymap.cKeymaps.$buffer).slice(12, 20)).toEqual(
    Uint8Array.from([1, 0, 2, 0, 28, 0, 0, 0])
  );
});

test("KeymapTest3", () => {
  const keymap: Keymap[] = [
    { layer: { id: 1, keys: { KC_E: "KC_F", KC_C: "KC_D" } } },
    { layer: { id: 0, keys: { KC_A: "KC_B" } } },
  ];
  const cKeymap = ConvertKeymaps(keymap, 0);
  expect(new Uint8Array(cKeymap.keymap_keys.$buffer)).toEqual(
    Uint8Array.from([4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 9, 0])
  );
  expect(new Uint8Array(cKeymap.cKeymaps.$buffer).slice(0, 8)).toEqual(
    Uint8Array.from([0, 0, 1, 0, 24, 0, 0, 0])
  );
  expect(new Uint8Array(cKeymap.cKeymaps.$buffer).slice(12, 20)).toEqual(
    Uint8Array.from([1, 0, 2, 0, 28, 0, 0, 0])
  );
});
