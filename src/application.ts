import * as struct from "node-c-struct";
import { Keycodes } from "./keycodes.ts";
import { type Action } from "./action.ts";
import { type Combo, ConvertCombos } from "./combo.ts";
import { ConvertKeymaps, type Keymap } from "./keymap.ts";
import { type Leader, ConvertLeaders } from "./leader.ts";
import { type DefaultValues } from "./default_values.ts";
import { ConvertKeyOverrides, type KeyOverride } from "./key_override.ts";

export interface Application {
  application: {
    title?: string;
    process?: string;
    url?: string;
    ime_mode?: number;
    ime_on?: number;
    keymaps?: Keymap[];
    combos?: Combo[];
    leaders?: Leader[];
    overrides?: KeyOverride[];
  };
}

export const EmptyApplication: Application = {
  application: {},
};

export function isApplication(item: any): item is Application {
  return (item as Application).application !== undefined;
}

interface CApplicationProperty {
  ime_mode: number;
  ime_on: number;
  keymap_len: number;
  keymap_address: number;
  combo_len: number;
  combo_address: number;
  leader_len: number;
  leader_address: number;
  override_len: number;
  override_address: number;
}

export class CApplication extends struct.struct<CApplicationProperty> {
  static get fields(): any {
    return [
      ["title", struct.size_t],
      ["process", struct.size_t],
      ["url", struct.size_t],
      ["ime_mode", struct.int16_t],
      ["ime_on", struct.int16_t],
      ["keymap_len", struct.size_t],
      ["keymap_address", struct.size_t],
      ["combo_len", struct.size_t],
      ["combo_address", struct.size_t],
      ["leader_len", struct.size_t],
      ["leader_address", struct.size_t],
      ["override_len", struct.size_t],
      ["override_address", struct.size_t],
    ];
  }
}

export function ConvertApplication(
  applications: Application[],
  baseOffset: number = 0,
  defaultValues: DefaultValues,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): Array<struct.array<any>> {
  const cApplications = new (CApplication.times(applications.length))();

  let addressOffset = baseOffset + cApplications.$buffer.byteLength;
  const array = new Array<struct.array<any>>();
  const encoder = new TextEncoder();

  applications.forEach((app, idx) => {
    let titleOffset = 0;
    let processOffset = 0;
    let urlOffset = 0;
    let keymapOffset = 0;
    let comboOffset = 0;
    let leaderOffset = 0;
    let overrideOffset = 0;

    const appInfo: number[] = [];

    if (app.application.title !== undefined) {
      appInfo.push(...encoder.encode(app.application.title));
      appInfo.push(0);

      titleOffset = addressOffset;
    }

    if (app.application.process !== undefined) {
      processOffset = addressOffset + appInfo.length;
      appInfo.push(...encoder.encode(app.application.process));
      appInfo.push(0);
    }

    if (app.application.url !== undefined) {
      urlOffset = addressOffset + appInfo.length;
      appInfo.push(...encoder.encode(app.application.url));
      appInfo.push(0);
    }

    // align to 4 byte
    const padding = appInfo.length % 4;
    if (padding !== 0) {
      appInfo.push(...Array(4 - padding).fill(0));
    }
    array.push(new (struct.uint8_t.times(appInfo.length))(appInfo));

    addressOffset += appInfo.length;

    if (app.application.keymaps !== undefined) {
      const cKeymap = ConvertKeymaps(
        app.application.keymaps,
        addressOffset,
        keycodeConverter
      );
      keymapOffset = addressOffset;
      addressOffset += cKeymap.cKeymaps.$arrayBuffer.byteLength;
      addressOffset += cKeymap.keymap_keys.$arrayBuffer.byteLength;
      array.push(cKeymap.cKeymaps);
      array.push(cKeymap.keymap_keys);
    }

    if (app.application.combos !== undefined) {
      const cCombos = ConvertCombos(
        app.application.combos,
        addressOffset,
        defaultValues,
        keycodeConverter
      );
      comboOffset = addressOffset;
      addressOffset += cCombos.cCombos.$arrayBuffer.byteLength;
      addressOffset += cCombos.combo_keys.$arrayBuffer.byteLength;
      array.push(cCombos.cCombos);
      array.push(cCombos.combo_keys);
    }

    if (app.application.leaders !== undefined) {
      const cLeaders = ConvertLeaders(
        app.application.leaders,
        addressOffset,
        keycodeConverter
      );
      leaderOffset = addressOffset;
      addressOffset += cLeaders.cLeaders.$arrayBuffer.byteLength;
      addressOffset += cLeaders.cLeadKeys.$arrayBuffer.byteLength;
      array.push(cLeaders.cLeaders);
      array.push(cLeaders.cLeadKeys);
    }

    if (app.application.overrides !== undefined) {
      const cOverrides = ConvertKeyOverrides(
        app.application.overrides,
        addressOffset,
        keycodeConverter
      );
      overrideOffset = addressOffset;
      addressOffset += cOverrides.$arrayBuffer.byteLength;
      array.push(cOverrides);
    }

    cApplications[idx].$value = {
      title: titleOffset,
      process: processOffset,
      url: urlOffset,
      ime_mode: app.application.ime_mode ?? -1,
      ime_on: app.application.ime_on ?? -1,
      keymap_len: app.application.keymaps?.length ?? 0,
      keymap_address: keymapOffset,
      combo_len: app.application.combos?.length ?? 0,
      combo_address: comboOffset,
      leader_len: app.application.leaders?.length ?? 0,
      leader_address: leaderOffset,
      override_len: app.application.overrides?.length ?? 0,
      override_address: overrideOffset,
    };
  });

  return [cApplications, array].flat();
}
