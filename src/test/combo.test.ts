import { expect, test } from "vitest";
import { ConvertCombos, type Combo } from "../combo";
import { DefaultValuesDefault } from "../default_values";

test("TestCombo1", () => {
  const combo: Combo = {
    combo: {
      keys: ["KC_A", "KC_B"],
      keycode: "KC_C",
    },
  };
  const ccombo = ConvertCombos([combo], 0, DefaultValuesDefault);
  expect(ccombo.cCombos[0].$value.term).toEqual(200);
  expect(ccombo.cCombos[0].$value.keycode).toEqual(6);
  expect(ccombo.cCombos[0].$value.only).toEqual(0);
  expect(ccombo.cCombos[0].$value.press_in_order).toEqual(false);
  expect(ccombo.cCombos[0].$value.layer).toEqual(0xffff);
});
