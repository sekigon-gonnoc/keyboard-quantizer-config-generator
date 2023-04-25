import { expect, test } from "vitest";
import { ConfigConverter } from "../config";

test("Config1", () => {
  const yamlString = `
- application:
    title: "app1"
    keymaps:
      - keymap:
          layer: 0
          map:
            KC_A: KC_B
            KC_E: {tap_dance: {single_tap: KC_F, single_hold: TO(1), double_tap: {macro: [ macroInTd ]}}}
      - keymap:
          layer: 1
          map:
            KC_B: KC_D
    combos:
      - combo:
          keys: [KC_C, KC_D]
          keycode: {macro:["macro"]}
          term: 100
          only: tap
    overrides:
      - basic:
          trigger_mods: [ Shift ]
          trigger_key: KC_2
          replacement_key : S(KC_2)
- application:
    title: "app2"
    keymaps:
      - keymap:
          layer: 0
          map:
            KC_A: LT(1,KC_SPC)
            KC_B: LT(2,KC_SPC)
- per_key_option:
    LT(1, KC_SPC):
      tapping_term: 100
      permissive_hold: false
      hold_on_other_key_press: false
    LT(2, KC_SPC):
      tapping_term: 200
      permissive_hold: false
      hold_on_other_key_press: false
`;

  const config = new ConfigConverter();
  const cConfig = config.Convert(yamlString, 0x1010_0000);

  // empty application is inserted automatically
  expect(cConfig.config?.$value.applications_len).toBe(3);
  expect(cConfig.config?.$value.macros_len).toBe(2);
  expect(cConfig.config?.$value.tap_dance_len).toBe(1);
  expect(cConfig.config?.$value.per_key_option_len).toBe(2);
  console.log(cConfig.buffer);
});
