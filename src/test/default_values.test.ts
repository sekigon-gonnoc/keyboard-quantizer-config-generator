import { expect, test } from "vitest";
import {
  ConvertDefaultValues,
  type DefaultValues,
  DefaultValuesDefault,
} from "../default_values";

test("TestDefaultValues1", () => {
  const defaults: DefaultValues = {
    default: {
      ...DefaultValuesDefault.default,
      keyboard_language: "JP",
    },
  };
  const res = ConvertDefaultValues(defaults);
  expect(res.$value.keyboard_language).toBe(1);
});
