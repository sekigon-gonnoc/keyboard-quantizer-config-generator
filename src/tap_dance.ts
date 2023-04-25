import { type Action } from "./action";
import * as struct from "node-c-struct";
import { CKeycodes, Keycodes } from "./keycodes";

export interface TapDance {
  tap_dance: {
    single_tap?: Action;
    single_hold?: Action;
    double_tap?: Action;
    double_hold?: Action;
    term?: number;
  };
}

export interface CTapDanceProperty {
  single_tap: number;
  single_hold: number;
  double_tap: number;
  double_hold: number;
}

export class CTapDance extends struct.struct<CTapDanceProperty> {
  static get fields(): any {
    return [
      ["single_tap", CKeycodes],
      ["single_hold", CKeycodes],
      ["double_tap", CKeycodes],
      ["double_hold", CKeycodes],
    ];
  }
}

export function ConvertTapDances(
  tapDances: TapDance[],
  _baseOffset: number = 0,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): { cTapDances: struct.array<CTapDance> } {
  const tapDanceDefinitions = tapDances.flatMap((td) => {
    return {
      single_tap:
        td.tap_dance.single_tap !== undefined
          ? keycodeConverter(td.tap_dance.single_tap)
          : 0,
      single_hold:
        td.tap_dance.single_hold !== undefined
          ? keycodeConverter(td.tap_dance.single_hold)
          : 0,
      double_tap:
        td.tap_dance.double_tap !== undefined
          ? keycodeConverter(td.tap_dance.double_tap)
          : 0,
      double_hold:
        td.tap_dance.double_hold !== undefined
          ? keycodeConverter(td.tap_dance.double_hold)
          : 0,
    };
  });

  return {
    cTapDances: new (CTapDance.times(tapDanceDefinitions.length))(
      tapDanceDefinitions
    ),
  };
}
