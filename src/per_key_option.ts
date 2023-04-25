import { DefaultValuesDefault } from "./default_values";
import { Keycodes, CKeycodes } from "./keycodes";

import * as struct from "node-c-struct";

export interface PerKeyOption {
  per_key_option: Record<
    string,
    {
      tapping_term?: number;
      quick_tap_term?: number;
      permissive_hold?: boolean;
      hold_on_other_key_press?: boolean;
      retro_tapping?: boolean;
    }
  >;
}

export function isPerKeyOption(item: any): item is PerKeyOption {
  return (item as PerKeyOption).per_key_option !== undefined;
}

interface CPerKeyOptionProperty {
  key: number;
  tapping_term: number;
  quick_tap_term: number;
  permissive_hold: boolean;
  hold_on_other_key_press: boolean;
  retro_tapping: boolean;
}

export class CPerKeyOption extends struct.struct<CPerKeyOptionProperty> {
  static get fields(): any {
    return [
      ["key", CKeycodes],
      ["tapping_term", struct.uint16_t],
      ["quick_tap_term", struct.uint16_t],
      ["permissive_hold", struct.bool],
      ["hold_on_other_key_press", struct.bool],
      ["retro_tapping", struct.bool],
    ];
  }
}

export function ConvertPerKeyOptions(
  options: PerKeyOption[],
  _baseOffset: number = 0
): {
  cPerKeyOptions: struct.array<CPerKeyOption>;
} {
  const optionDefinitions = options.flatMap((o) => {
    return Object.entries(o.per_key_option).map((pk) => {
      return {
        key: Keycodes.ConvertAction(pk[0]),
        tapping_term:
          pk[1].tapping_term ?? DefaultValuesDefault.default.tapping_term,
        quick_tap_term:
          pk[1].quick_tap_term ?? DefaultValuesDefault.default.quick_tap_term,
        permissive_hold: pk[1].permissive_hold ?? false,
        hold_on_other_key_press: pk[1].hold_on_other_key_press ?? false,
        retro_tapping: pk[1].retro_tapping ?? false,
      };
    });
  });

  return {
    cPerKeyOptions: new (CPerKeyOption.times(optionDefinitions.length))(
      optionDefinitions
    ),
  };
}
