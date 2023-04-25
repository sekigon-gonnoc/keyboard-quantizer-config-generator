import * as struct from "node-c-struct";
import { type Action } from "./action.ts";
import { CKeycodes, Keycodes } from "./keycodes.ts";
import { P, match } from "ts-pattern";

export type KeyOverride =
  | {
      basic: {
        trigger_mods: ModMaskType[];
        trigger_key: string;
        replacement_key: string;
      };
    }
  | {
      w_layer: {
        trigger_mods: ModMaskType[];
        trigger_key: string;
        replacement_key: string;
        layers: number;
      };
    }
  | {
      w_layer_neg: {
        trigger_mods: ModMaskType[];
        trigger_key: string;
        replacement_key: string;
        layers: number;
        negative_mask: ModMaskType[];
      };
    }
  | {
      w_layer_neg_opt: {
        trigger_mods: ModMaskType[];
        trigger_key: string;
        replacement_key: string;
        layers: number;
        negative_mask: ModMaskType[];
        options: KoOptionType[];
      };
    };

interface KeyOverrideProperty {
  trigger: number;
  trigger_mods: number;
  layers: number;
  negative_mod_mask: number;
  suppressed_mods: number;
  replacement: number;
  options: number;
  custom_action: number;
  context: number;
  enabled: number;
}

export class CKeyOverride extends struct.struct<KeyOverrideProperty> {
  static get fields(): any {
    return [
      ["trigger", CKeycodes],
      ["trigger_mods", struct.uint8_t],
      ["layers", struct.uint16_t],
      ["negative_mod_mask", struct.uint8_t],
      ["suppressed_mods", struct.uint8_t],
      ["replacement", CKeycodes],
      ["options", struct.uint8_t],
      ["custom_action", struct.size_t],
      ["context", struct.size_t],
      ["enabled", struct.size_t],
    ];
  }
}

const KoOption = {
  activation_trigger_down: 1 << 0,
  activation_required_mod_down: 1 << 1,
  activation_negative_mod_up: 1 << 2,

  all_activations: 0b111,

  one_mod: 1 << 3,
  no_reregister_trigger: 1 << 4,
  no_unregister_on_other_key_down: 1 << 5,

  default: 0b111,
};
type KoOptionType = keyof typeof KoOption;

const ModMask = {
  Ctrl: 0b0001_0001,
  Shift: 0b0010_0010,
  Alt: 0b0100_0100,
  Gui: 0b1000_1000,
};
type ModMaskType = keyof typeof ModMask;

function koMakeBasic(
  triggerMods: ModMaskType[],
  triggerKey: number,
  replacementKey: number
): CKeyOverride {
  return koMakeWithLayers(triggerMods, triggerKey, replacementKey, ~0);
}

function koMakeWithLayers(
  triggerMods: ModMaskType[],
  triggerKey: number,
  replacementKey: number,
  layers: number
): CKeyOverride {
  return koMakeWithLayersAndNegmods(
    triggerMods,
    triggerKey,
    replacementKey,
    layers,
    []
  );
}

function koMakeWithLayersAndNegmods(
  triggerMods: ModMaskType[],
  triggerKey: number,
  replacementKey: number,
  layers: number,
  negativeMask: ModMaskType[]
): CKeyOverride {
  return koMakeWithLayersNegmodsAndOptions(
    triggerMods,
    triggerKey,
    replacementKey,
    layers,
    negativeMask,
    ["default"]
  );
}

function koMakeWithLayersNegmodsAndOptions(
  triggerMods: ModMaskType[],
  triggerKey: number,
  replacementKey: number,
  layerMask: number,
  negativeMask: ModMaskType[],
  options: KoOptionType[]
): CKeyOverride {
  const cko = new CKeyOverride();
  cko.$value = {
    trigger: triggerKey,
    trigger_mods: triggerMods.reduce((acc, cur) => acc | ModMask[cur], 0),
    layers: layerMask,
    suppressed_mods: triggerMods.reduce((acc, cur) => acc | ModMask[cur], 0),
    options: options.reduce((acc, cur) => acc | KoOption[cur], 0),
    negative_mod_mask: negativeMask.reduce((acc, cur) => acc | ModMask[cur], 0),
    custom_action: 0,
    context: 0,
    replacement: replacementKey,
    enabled: 0,
  };

  return cko;
}

export function ConvertKeyOverrides(
  overrides: KeyOverride[],
  baseOffset: number = 0,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): struct.array<CKeyOverride> {
  const cko = new (CKeyOverride.times(overrides.length))();

  overrides.forEach((ko, idx) => {
    cko[idx].$value = match(ko)
      .with({ basic: P._ }, (ko) =>
        koMakeBasic(
          ko.basic.trigger_mods,
          keycodeConverter(ko.basic.trigger_key),
          keycodeConverter(ko.basic.replacement_key)
        )
      )
      .with({ w_layer: P._ }, (ko) =>
        koMakeWithLayers(
          ko.w_layer.trigger_mods,
          keycodeConverter(ko.w_layer.trigger_key),
          keycodeConverter(ko.w_layer.replacement_key),
          ko.w_layer.layers
        )
      )
      .with({ w_layer_neg: P._ }, (ko) =>
        koMakeWithLayersAndNegmods(
          ko.w_layer_neg.trigger_mods,
          keycodeConverter(ko.w_layer_neg.trigger_key),
          keycodeConverter(ko.w_layer_neg.replacement_key),
          ko.w_layer_neg.layers,
          ko.w_layer_neg.negative_mask
        )
      )
      .with({ w_layer_neg_opt: P._ }, (ko) =>
        koMakeWithLayersNegmodsAndOptions(
          ko.w_layer_neg_opt.trigger_mods,
          keycodeConverter(ko.w_layer_neg_opt.trigger_key),
          keycodeConverter(ko.w_layer_neg_opt.replacement_key),
          ko.w_layer_neg_opt.layers,
          ko.w_layer_neg_opt.negative_mask,
          ko.w_layer_neg_opt.options
        )
      )
      .exhaustive().$value;
  });

  return cko;
}
