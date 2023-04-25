import { expect, test } from "vitest";
import { ConvertKeyOverrides } from "../key_override";

test("KeyOverrideTest", () => {
  {
    const cko = ConvertKeyOverrides([
      {
        basic: {
          trigger_mods: ["Shift"],
          trigger_key: "KC_2",
          replacement_key: "S(KC_2)",
        },
      },
    ]);

    expect(cko[0].$value.trigger_mods).toBe(0b0010_0010);
  }

  {
    const cko = ConvertKeyOverrides([
      {
        w_layer: {
          trigger_mods: ["Shift"],
          trigger_key: "KC_2",
          replacement_key: "S(KC_2)",
          layers: ~0,
        },
      },
    ]);

    expect(cko[0].$value.trigger_mods).toBe(0b0010_0010);
    expect(cko[0].$value.layers).toBe(0xffff);
  }

  {
    const cko = ConvertKeyOverrides([
      {
        w_layer_neg_opt: {
          trigger_mods: ["Shift"],
          trigger_key: "KC_2",
          replacement_key: "S(KC_2)",
          negative_mask: ["Alt"],
          options: ["default"],
          layers: ~0,
        },
      },
    ]);

    expect(cko[0].$value.trigger_mods).toBe(0b0010_0010);
    expect(cko[0].$value.layers).toBe(0xffff);
  }
});
