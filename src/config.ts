import {
  type Action,
  ConvertMacros,
  type Command,
  type Macro,
  type UnicodeString,
} from "./action";
import {
  type Application,
  ConvertApplication,
  EmptyApplication,
  isApplication,
} from "./application";
import { match, P } from "ts-pattern";
import {
  Keycodes,
  QK_UNICODE,
  QK_TAP_DANCE,
  QK_TAP_DANCE_MAX,
  QK_UNICODE_MAX,
} from "./keycodes";
import * as struct from "node-c-struct";
import jsyaml from "js-yaml";
import pako from "pako";
import {
  CDefaultValues,
  type CDefaultValuesProperty,
  ConvertDefaultValues,
  type DefaultValues,
  DefaultValuesDefault,
  isDefaultValues,
} from "./default_values";
import {
  ConvertPerKeyOptions,
  type PerKeyOption,
  isPerKeyOption,
} from "./per_key_option";
import { ConvertTapDances, type TapDance } from "./tap_dance";
import crc16 from "crc/calculators/crc16";

export type YamlSchema = Array<Application | PerKeyOption | DefaultValues>;
export interface Config {
  defaultValues: DefaultValues;
  applications: Application[];
  macros: Array<Macro | Command | UnicodeString>;
  tapDances: TapDance[];
  perKeyOptions: PerKeyOption[];
}

export const CONFIG_VERSION = 12;

interface CConfigProperty {
  magic_number: number;
  version: number;
  crc16: number;
  body_length: number;
  yaml_len: number;
  yaml_address: number;
  default: CDefaultValuesProperty;
  applications_len: number;
  applications_address: number;
  tap_dance_len: number;
  tap_dance_address: number;
  per_key_option_len: number;
  per_key_option_address: number;
  macros_len: number;
  macros_address: number;
}
export class CConfig extends struct.struct<CConfigProperty> {
  static get fields(): any {
    return [
      ["magic_number", struct.uint32_t],
      ["version", struct.uint16_t],
      ["crc16", struct.uint16_t],
      ["body_length", struct.uint32_t],
      ["yaml_len", struct.size_t],
      ["yaml_address", struct.size_t],
      ["default", CDefaultValues],
      ["applications_len", struct.size_t],
      ["applications_address", struct.size_t],
      ["tap_dance_len", struct.size_t],
      ["tap_dance_address", struct.size_t],
      ["per_key_option_len", struct.size_t],
      ["per_key_option_address", struct.size_t],
      ["macros_len", struct.size_t],
      ["macros_address", struct.size_t],
    ];
  }
}

function concatBuffers(
  buffers: Array<ArrayBuffer | ArrayBufferLike>
): Uint8Array {
  const totalSize = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
  const newBuffer = new Uint8Array(totalSize);

  let offset = 0;
  for (const buffer of buffers) {
    const source = new Uint8Array(buffer);
    newBuffer.set(source, offset);
    offset += buffer.byteLength;
  }

  return newBuffer;
}

const encoder = new TextEncoder();
export class ConfigConverter {
  byteOffset = 0;
  config: Config;
  cConfig: CConfig | undefined;
  constructor() {
    this.config = {
      defaultValues: DefaultValuesDefault,
      applications: [],
      macros: [],
      tapDances: [],
      perKeyOptions: [],
    };
  }

  Convert(
    yaml: string,
    baseOffset: number
  ): { config: CConfig; buffer: Uint8Array } {
    const obj = jsyaml.load(yaml) as YamlSchema;

    this.config.defaultValues = {
      ...DefaultValuesDefault,
      ...obj
        .filter((item): item is DefaultValues => isDefaultValues(item))
        .at(0),
    };
    this.config.applications = obj.filter((item): item is Application =>
      isApplication(item)
    );
    this.config.perKeyOptions = obj.filter((item): item is PerKeyOption =>
      isPerKeyOption(item)
    );

    if (
      this.config.applications[0].application.process !== undefined ||
      this.config.applications[0].application.title !== undefined ||
      this.config.applications[0].application.url !== undefined
    ) {
      this.config.applications.unshift(EmptyApplication);
      console.log("Insert empty application setting to head");
    }

    this.byteOffset = baseOffset + CConfig.byteSize;
    const appAddress = this.byteOffset;
    const appLength = this.config.applications.length;

    const cApps = ConvertApplication(
      this.config.applications,
      appAddress,
      this.config.defaultValues,
      (action: Action) => this.convertAction(action)
    );

    this.byteOffset += cApps.ApplicationData.reduce(
      (acc, buf) => acc + buf.$arrayBuffer.byteLength,
      cApps.cApplications.$arrayBuffer.byteLength
    );

    const tapDanceAddress = this.byteOffset;
    const tapDanceLength = this.config.tapDances.length;

    const cTapDances = ConvertTapDances(
      this.config.tapDances,
      tapDanceAddress,
      (action: Action) => this.convertAction(action)
    );

    this.byteOffset += cTapDances.cTapDances.$arrayBuffer.byteLength;

    this.config.perKeyOptions.push(
      ...this.config.tapDances
        .filter((td) => td.tap_dance.term)
        .map((td, idx) => {
          const perKeyOption: PerKeyOption = { per_key_option: {} };
          perKeyOption.per_key_option[
            (QK_TAP_DANCE + idx).toString()
          ].tapping_term = td.tap_dance.term;
          return perKeyOption;
        })
    );

    const optionAddress = this.byteOffset;
    const optionLength = this.config.perKeyOptions.reduce(
      (acc, pk) => acc + Object.keys(pk.per_key_option).length,
      0
    );

    const cOptions = ConvertPerKeyOptions(this.config.perKeyOptions);

    this.byteOffset += cOptions.cPerKeyOptions.$arrayBuffer.byteLength;

    const macroAddress = this.byteOffset;
    const macroLength = this.config.macros.length;

    const cMacros = ConvertMacros(
      this.config.macros,
      macroAddress,
      (action: Action) => this.convertAction(action)
    );

    this.byteOffset += cMacros.macroAddress.$arrayBuffer.byteLength;
    this.byteOffset += cMacros.macroDefinitions.$arrayBuffer.byteLength;

    const yamlAddress = this.byteOffset;
    const yamlData = pako.gzip(Uint8Array.from(encoder.encode(yaml)));
    const yamlLength = yamlData.length;

    this.cConfig = new CConfig();
    this.cConfig.$value = {
      magic_number: 0x999b999b,
      version: CONFIG_VERSION,
      crc16: 0,
      body_length: 0,
      yaml_len: yamlLength,
      yaml_address: yamlAddress,
      default: ConvertDefaultValues(this.config.defaultValues).$value,
      applications_address: appAddress,
      applications_len: appLength,
      tap_dance_address: tapDanceAddress,
      tap_dance_len: tapDanceLength,
      per_key_option_address: optionAddress,
      per_key_option_len: optionLength,
      macros_address: macroAddress,
      macros_len: macroLength,
    };

    const buffer = concatBuffers([
      this.cConfig.$arrayBuffer,
      cApps.cApplications.$arrayBuffer,
      ...cApps.ApplicationData.flatMap((x) => x.$arrayBuffer),
      cTapDances.cTapDances.$arrayBuffer,
      cOptions.cPerKeyOptions.$arrayBuffer,
      cMacros.macroAddress.$arrayBuffer,
      cMacros.macroDefinitions.$arrayBuffer,
      yamlData,
    ]);

    // set crc to buffer
    const crc = crc16(buffer.slice(12), 0xffff) ^ 0xffff;
    buffer.set([crc & 0xff, crc >> 8], 6);
    // set body_length to buffer
    const bodyLength = buffer.length - 12;
    buffer.set(
      [
        bodyLength & 0xff,
        (bodyLength >> 8) & 0xff,
        (bodyLength >> 16) & 0xff,
        (bodyLength >> 24) & 0xff,
      ],
      8
    );

    return {
      config: this.cConfig,
      buffer,
    };
  }

  convertAction(action: Action): number {
    return match(action)
      .with(P.string, (str) => {
        return Keycodes.ConvertAction(str) ?? 0;
      })
      .with({ macro: P._ }, (macro) => {
        const keycode = QK_UNICODE + this.config.macros.length;
        if (keycode > QK_UNICODE_MAX) {
          throw new Error("Too many macro/command/unicode keys are defined");
        }
        this.config.macros.push(macro);
        return keycode;
      })
      .with({ command: P.string }, (command) => {
        const keycode = QK_UNICODE + this.config.macros.length;
        if (keycode > QK_UNICODE_MAX) {
          throw new Error("Too many macro/command/unicode keys are defined");
        }
        this.config.macros.push(command);
        return keycode;
      })
      .with({ unicode_string: P.string }, (unicodeString) => {
        const keycode = QK_UNICODE + this.config.macros.length;
        if (keycode > QK_UNICODE_MAX) {
          throw new Error("Too many macro/command/unicode keys are defined");
        }
        this.config.macros.push(unicodeString);
        return keycode;
      })
      .with({ tap_dance: P._ }, (tapDance) => {
        const keycode = QK_TAP_DANCE + this.config.tapDances.length;
        if (keycode > QK_TAP_DANCE_MAX) {
          throw new Error("Too many tap dance keys are defined");
        }
        this.config.tapDances.push(tapDance);
        return keycode;
      })
      .exhaustive();
  }
}
