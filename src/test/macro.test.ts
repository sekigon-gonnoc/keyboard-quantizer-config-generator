import { expect, test } from "vitest";
import { ConvertMacros } from "../action";

test("StringMacro", () => {
  const res = ConvertMacros([{ macro: ["macro"] }]);
  expect(new Uint8Array(res.macroAddress.$buffer)).toEqual(
    Uint8Array.from([4, 0, 0, 0])
  );
  expect(new Uint8Array(res.macroDefinitions.$buffer)).toEqual(
    Uint8Array.from([1, 109, 97, 99, 114, 111, 0, 0])
  );
});

test("TapMacro", () => {
  const res = ConvertMacros([
    { macro: [{ action: "tap", keycodes: ["KC_A", "KC_B"] }] },
  ]);
  expect(new Uint8Array(res.macroAddress.$buffer)).toEqual(
    Uint8Array.from([4, 0, 0, 0])
  );
  expect(new Uint8Array(res.macroDefinitions.$buffer)).toEqual(
    Uint8Array.from([1, 1, 4, 1, 5, 0, 0, 0])
  );
});

test("DelayMacro", () => {
  const res = ConvertMacros([{ macro: [{ action: "delay", duration: 100 }] }]);
  expect(new Uint8Array(res.macroAddress.$buffer)).toEqual(
    Uint8Array.from([4, 0, 0, 0])
  );
  expect(new Uint8Array(res.macroDefinitions.$buffer)).toEqual(
    Uint8Array.from([1, 4, 100, 0, 0, 0, 0, 0])
  );
});

test("Combined", () => {
  const res = ConvertMacros([
    {
      macro: [
        { action: "down", keycodes: ["KC_LCTL"] },
        "macro",
        { action: "up", keycodes: ["KC_LCTL"] },
      ],
    },
  ]);
  expect(new Uint8Array(res.macroAddress.$buffer)).toEqual(
    Uint8Array.from([4, 0, 0, 0])
  );
  expect(new Uint8Array(res.macroDefinitions.$buffer)).toEqual(
    Uint8Array.from([1, 2, 0xe0, 109, 97, 99, 114, 111, 3, 0xe0, 0, 0])
  );
});

test("Unicode", () => {
  const res = ConvertMacros([
    {
      unicode_string: "😀",
    },
  ]);

  expect(new Uint8Array(res.macroDefinitions.$buffer)).toEqual(
    Uint8Array.from([3, 0xf0, 0x9f, 0x98, 0x80, 0, 0, 0])
  );
});
