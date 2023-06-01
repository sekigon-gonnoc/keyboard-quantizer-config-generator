import * as struct from "node-c-struct";
import { CKeycodes, Keycodes } from "./keycodes";
import { type Action } from "./action";

export interface Keymap {
  keymap: {
    layer: number;
    map: Record<string, Action>;
  };
}

interface CKeymapProperty {
  layer: number;
  keys_len: number;
  keys_addr: number;
}

export class CKeymap extends struct.struct<CKeymapProperty> {
  static get fields(): any {
    return [
      ["layer", struct.uint16_t],
      ["keys_len", struct.uint16_t],
      ["keys_addr", struct.size_t],
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
  keymaps.sort((ka, kb) => ka.keymap.layer - kb.keymap.layer);

  keymaps.forEach((keymap, idx) => {
    cKeymaps[idx].$value = {
      layer: keymap.keymap.layer,
      keys_len: Object.keys(keymap.keymap.map).length,
      keys_addr: keyAddress,
    };

    keyAddress += cKeymaps[idx].$value.keys_len * 2 * CKeycodes.byteSize;
    keyCount += cKeymaps[idx].$value.keys_len * 2;
  });

  // align to 4 byte

  const ckeys = new (CKeycodes.times(keyCount))();
  // keys in keymap are sorted by "from" keycodes
  keymaps
    .map((k) =>
      Object.entries(k.keymap.map)
        .map((k) => [keycodeConverter(k[0]), keycodeConverter(k[1])])
        .sort((a, b) => a[0] - b[0])
    )
    .flat(2)
    .forEach((k, idx) => (ckeys[idx].$value = k));

  return { keymap_keys: ckeys, cKeymaps };
}
