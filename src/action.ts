import * as struct from "node-c-struct";
import { Keycodes } from "./keycodes";
import { P, match } from "ts-pattern";
import { type TapDance } from "./tap_dance";

enum MacroVariant {
  KEY_SEQUENCE = 1,
  COMMAND = 2,
  UNICODE_STRING = 3,
}
export type Action = string | Macro | Command | UnicodeString | TapDance;

export interface Macro {
  macro: Array<
    | { action: "tap" | "down" | "up"; keycodes: string[] }
    | { action: "delay"; duration: number }
    | string
    | Command
    | UnicodeString
  >;
}

export interface Command {
  command: string;
}

export interface UnicodeString {
  unicode_string: string;
}

export function ConvertMacros(
  macros: Array<Macro | Command | UnicodeString>,
  baseOffset: number = 0,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): {
  macroAddress: struct.array<struct.size_t>;
  macroDefinitions: struct.array<struct.uint8_t>;
} {
  const macroAddress: number[] = [];
  const macroDefinitions: number[] = [];

  // Because macros.length could increase in this loop,
  // use for statement instead of forEach
  for (let idx = 0; idx < macros.length; idx++) {
    const m = macros[idx];
    macroAddress.push(macroDefinitions.length);
    match(m)
      .with({ macro: P._ }, (macro) =>
        macroDefinitions.push(...convertMacro(macro, keycodeConverter))
      )
      .with({ command: P.string }, (command) =>
        macroDefinitions.push(...convertCommand(command))
      )
      .with({ unicode_string: P.string }, (str) =>
        macroDefinitions.push(...convertUnicodeString(str))
      )
      .exhaustive();
  }

  const cMacroAddress = new (struct.size_t.times(macros.length))();
  const offset = cMacroAddress.$buffer.byteLength + baseOffset;
  macroAddress.forEach((address, idx) => {
    cMacroAddress[idx].$value = offset + address;
  });

  // align to 4 byte
  const padding = macroDefinitions.length % 4;
  if (padding !== 0) {
    macroDefinitions.push(...Array(4 - padding).fill(0));
  }

  return {
    macroAddress: cMacroAddress,
    macroDefinitions: new (struct.uint8_t.times(macroDefinitions.length))(
      macroDefinitions
    ),
  };
}

const encoder = new TextEncoder();

function convertMacro(
  macro: Macro,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): number[] {
  const macroDefinitions: number[] = [];

  // add enum to keyboard distinct macro type
  macroDefinitions.push(MacroVariant.KEY_SEQUENCE);

  macro.macro.forEach((m) => {
    match(m)
      .with(P.string, (str) => {
        const arr = encoder.encode(str);
        macroDefinitions.push(...arr);
      })
      .with({ action: "tap" }, (tap) => {
        tap.keycodes.forEach((k) => {
          const kc = keycodeConverter(k);
          macroDefinitions.push(0x01, kc & 0xff, kc >> 8);
        });
      })
      .with({ action: "down" }, (down) => {
        down.keycodes.forEach((k) => {
          const kc = keycodeConverter(k);
          macroDefinitions.push(0x02, kc & 0xff, kc >> 8);
        });
      })
      .with({ action: "up" }, (up) => {
        up.keycodes.forEach((k) => {
          const kc = keycodeConverter(k);
          macroDefinitions.push(0x03, kc & 0xff, kc >> 8);
        });
      })
      .with({ action: "delay" }, (delay) =>
        macroDefinitions.push(0x04, delay.duration & 0xff, delay.duration >> 8)
      )
      .with({ command: P._ }, (command) => {
        const kc = keycodeConverter(command);
        macroDefinitions.push(0x01, kc & 0xff, kc >> 8);
      })
      .with({ unicode_string: P._ }, (unicodeString) => {
        const kc = keycodeConverter(unicodeString);
        macroDefinitions.push(0x01, kc & 0xff, kc >> 8);
      })
      .exhaustive();
  });
  // add terminate char
  macroDefinitions.push(0);

  return macroDefinitions;
}

function convertCommand(command: Command): number[] {
  const commandDefinitions: number[] = [];

  // add enum
  commandDefinitions.push(MacroVariant.COMMAND);

  commandDefinitions.push(
    ...Array.from(command.command, (c) => c.charCodeAt(0))
  );

  // add terminate char
  commandDefinitions.push(0);

  return commandDefinitions;
}

function convertUnicodeString(unicodeString: UnicodeString): number[] {
  const macroDefinitions: number[] = [];
  macroDefinitions.push(MacroVariant.UNICODE_STRING);
  macroDefinitions.push(...encoder.encode(unicodeString.unicode_string));
  macroDefinitions.push(0);
  return macroDefinitions;
}
