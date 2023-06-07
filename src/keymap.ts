import * as struct from "node-c-struct";
import { CKeycodes, Keycodes } from "./keycodes";
import { type Action } from "./action";
import { type Mouse, CMouse, type CMouseProperty, ConvertMouse } from "./mouse";

export interface Keymap {
  layer: {
    id: number;
    keys?: Record<string, Action>;
    mouse?: Mouse;
  };
}

interface CKeymapProperty {
  layer: number;
  keys_len: number;
  keys_addr: number;
  mouse: CMouseProperty;
}

export class CKeymap extends struct.struct<CKeymapProperty> {
  static get fields(): any {
    return [
      ["layer", struct.uint16_t],
      ["keys_len", struct.uint16_t],
      ["keys_addr", struct.size_t],
      ["mouse", CMouse],
    ];
  }
}

export function ConvertKeymaps(
  keymaps: Keymap[],
  baseOffset: number = 0,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): {
  cKeymaps: struct.array<CKeymap>;
  keymap_keys: struct.array<CKeycodes>;
} {
  const cKeymaps = new (CKeymap.times(keymaps.length))();
  let keyAddress = cKeymaps.$buffer.byteLength + baseOffset;
  let keyCount = 0;

  // keymaps is sort by layer number
  keymaps.sort((ka, kb) => ka.layer.id - kb.layer.id);

  keymaps.forEach((keymap, idx) => {
    cKeymaps[idx].$value = {
      layer: keymap.layer.id,
      keys_len:
        keymap.layer.keys !== undefined
          ? Object.keys(keymap.layer.keys).length
          : 0,
      keys_addr: keyAddress,
      mouse: ConvertMouse(keymap.layer.mouse).$value,
    };

    keyAddress += cKeymaps[idx].$value.keys_len * 2 * CKeycodes.byteSize;
    keyCount += cKeymaps[idx].$value.keys_len * 2;
  });

  // align to 4 byte

  const ckeys = new (CKeycodes.times(keyCount))();
  // keys in keymap are sorted by "from" keycodes
  const keys = keymaps
    .map((k) => k.layer.keys)
    .filter((k) => k !== undefined) as Array<Record<string, Action>>;

  keys
    .map((k) =>
      Object.entries(k)
        .map((k) => [keycodeConverter(k[0]), keycodeConverter(k[1])])
        .sort((a, b) => a[0] - b[0])
    )
    .flat(2)
    .forEach((k, idx) => (ckeys[idx].$value = k));

  return { keymap_keys: ckeys, cKeymaps };
}
