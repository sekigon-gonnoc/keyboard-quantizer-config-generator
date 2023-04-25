import * as struct from "node-c-struct";
import { Keycodes, CKeycodes } from "./keycodes.ts";
import { type Action } from "./action.ts";
import { type DefaultValues } from "./default_values.ts";

export interface Combo {
  combo: {
    keys: string[];
    keycode: Action;
    term?: number;
    only?: keyof typeof ComboOptionTapHold;
    press_in_order?: boolean;
    layer?: number;
  };
}

interface CComboProperty {
  keys_address: number;
  keycode: number;
  term: number;
  only: number;
  press_in_order: boolean;
  layer: number;
}

const ComboOptionTapHold = {
  None: 0,
  Tap: 1,
  Hold: 2,
  none: 0,
  tap: 1,
  hold: 2,
};

export class CCombo extends struct.struct<CComboProperty> {
  static get fields(): any {
    return [
      ["keys_address", struct.size_t],
      ["keycode", CKeycodes],
      ["term", struct.uint16_t],
      ["only", struct.uint8_t],
      ["press_in_order", struct.bool],
      ["layer", struct.uint16_t],
    ];
  }
}

export function ConvertCombos(
  combos: Combo[],
  baseOffset: number = 0,
  defaultValues: DefaultValues,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): {
  cCombos: struct.array<CCombo>;
  combo_keys: struct.array<CKeycodes>;
} {
  const ccs = new (CCombo.times(combos.length))();
  let keyAddress = ccs.$buffer.byteLength + baseOffset;

  combos.forEach((c, idx) => {
    ccs[idx].$value = {
      keys_address: keyAddress,
      keycode: keycodeConverter(c.combo.keycode),
      term: c.combo.term ?? defaultValues.default.combo_term,
      only: ComboOptionTapHold[c.combo.only ?? "None"],
      press_in_order:
        c.combo.press_in_order ??
        defaultValues.default.combo_press_in_order ??
        false,
      layer: c.combo.layer ?? 0xffff,
    };
    keyAddress += (c.combo.keys.length + 1) * CKeycodes.byteSize;
  });

  const keys = combos.flatMap((c) =>
    c.combo.keys.flatMap((k) => keycodeConverter(k)).concat(0)
  );

  // align to 4byte
  const ckeys = new (struct.uint16_t.times(Math.ceil(keys.length / 2) * 2))();
  keys.forEach((key, idx) => (ckeys[idx].$value = key));

  return { combo_keys: ckeys, cCombos: ccs };
}
