import { expect, test } from "vitest";
import { type YamlSchema } from "../config";
import jsyaml from "js-yaml";
import {
  type Application,
  ConvertApplication,
  isApplication,
} from "../application";
import { DefaultValuesDefault } from "../default_values";

test("ApplicationTest", () => {
  const yamlString = `
- application:
    title: title - app1
    process: app"
    url: https://app1
    os_variant: Windows
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
`;

  const config = jsyaml.load(yamlString) as YamlSchema;

  const capp = ConvertApplication(
    config.filter((c): c is Application => isApplication(c)),
    0,
    DefaultValuesDefault
  );
  console.log(capp);

  expect(capp.cApplications[0].$value.os_variant).toBe(2);
});
