import { expect, test } from "vitest";
import { Keycodes } from "../keycodes";

test("BasicKeycodes", () => {
  expect(Keycodes.ConvertAction("KC_A")).toBe(4);
  expect(Keycodes.ConvertAction("KC_TRNS")).toBe(1);

  expect(() => Keycodes.ConvertAction("UNKNOWN")).toThrowError();
});

test("WithModsKeycodes", () => {
  expect(Keycodes.ConvertAction("LSFT(KC_A)")).toBe(0x200 | 4);
});

test("LtKeycodes", () => {
  expect(Keycodes.ConvertAction("LT(1,KC_A)")).toBe(0x4000 | (1 << 8) | 4);
  expect(Keycodes.ConvertAction("LT(2,KC_A)")).toBe(0x4000 | (2 << 8) | 4);
});

test("MtKeycodes", () => {
  expect(Keycodes.ConvertAction("MT(MOD_LCTL, KC_A)")).toBe(
    0x2000 | (1 << 8) | 4
  );
  expect(Keycodes.ConvertAction("LCTL_T( KC_A)")).toBe(0x2000 | (1 << 8) | 4);
  expect(Keycodes.ConvertAction("MT(MOD_LCTL|MOD_RGUI, KC_A)")).toBe(
    0x2000 | ((1 | 0x18) << 8) | 4
  );
});
