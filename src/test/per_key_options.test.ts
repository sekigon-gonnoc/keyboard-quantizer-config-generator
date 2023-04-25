import { expect, test } from "vitest";
import { ConvertPerKeyOptions } from "../per_key_option";

test("PerKeyOptionTest", () => {
  const ckp = ConvertPerKeyOptions([
    {
      per_key_option: {
        "LT(1,KC_A)": {
          tapping_term: 100,
          quick_tap_term: 50,
          permissive_hold: false,
        },
        "LT(2,KC_A)": {
          tapping_term: 100,
          permissive_hold: false,
        },
      },
    },
  ]);
  expect(ckp.cPerKeyOptions.$buffer.byteLength).toBe(20);
  expect(ckp.cPerKeyOptions[0].$value.quick_tap_term).toBe(50);
});

test("PerKeyOptionTest2", () => {
  const ckp = ConvertPerKeyOptions([
    {
      per_key_option: {
        "LT(1,KC_A)": {
          tapping_term: 100,
          permissive_hold: false,
        },
        "LT(2,KC_A)": {
          tapping_term: 100,
          permissive_hold: false,
        },
      },
    },
    {
      per_key_option: {
        "LT(1,KC_A)": {
          tapping_term: 100,
          permissive_hold: false,
        },
        "LT(2,KC_A)": {
          tapping_term: 100,
          permissive_hold: false,
        },
      },
    },
  ]);
  expect(ckp.cPerKeyOptions.$buffer.byteLength).toBe(40);
});
