import * as struct from "node-c-struct";

export interface DefaultValues {
  default: {
    combo_term?: number;
    combo_press_in_order?: boolean;
    tapping_term?: number;
    quick_tap_term?: number;
    permissive_hold?: boolean;
    hold_on_other_key_press?: boolean;
    retro_tapping?: boolean;
    keyboard_language?: keyof typeof LanguageSetting;
    os_language?: keyof typeof LanguageSetting;
    mouse_gesture_threshold?: number;
  };
}

const LanguageSetting = {
  US: 0,
  JP: 1,
};

export const DefaultValuesDefault: DefaultValues = {
  default: {
    combo_term: 200,
    combo_press_in_order: false,
    tapping_term: 200,
    quick_tap_term: 200,
    permissive_hold: false,
    hold_on_other_key_press: false,
    retro_tapping: false,
    keyboard_language: "US",
    os_language: "US",
    mouse_gesture_threshold: 30,
  },
};

export function isDefaultValues(item: any): item is DefaultValues {
  return (item as DefaultValues).default !== undefined;
}

export interface CDefaultValuesProperty {
  tapping_term?: number;
  quick_tap_term?: number;
  permissive_hold?: boolean;
  hold_on_other_key_press?: boolean;
  retro_tapping?: boolean;
  keyboard_language?: number;
  os_language?: number;
  mouse_gesture_threshold?: number;
}

export class CDefaultValues extends struct.struct<CDefaultValuesProperty> {
  static get fields(): any {
    return [
      ["tapping_term", struct.uint16_t],
      ["quick_tap_term", struct.uint16_t],
      ["permissive_hold", struct.bool],
      ["hold_on_other_key_press", struct.bool],
      ["retro_tapping", struct.bool],
      ["keyboard_language", struct.uint8_t],
      ["os_language", struct.uint8_t],
      ["mouse_gesture_threshold", struct.uint16_t],
    ];
  }
}

export function ConvertDefaultValues(defaults: DefaultValues): CDefaultValues {
  const cDefaults = new CDefaultValues();
  cDefaults.$value = {
    ...defaults.default,
    keyboard_language:
      LanguageSetting[defaults.default.keyboard_language ?? "US"],
    os_language: LanguageSetting[defaults.default.os_language ?? "US"],
  };

  return cDefaults;
}
