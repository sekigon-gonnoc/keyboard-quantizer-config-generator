import * as struct from "node-c-struct";
import { type Action } from "./action";
import { Keycodes } from "./keycodes";

export interface Mouse {
  scale_x?: number;
  scale_y?: number;
  scale_v?: number;
  scale_h?: number;
}

export interface CMouseProperty {
  scale_x: number;
  scale_y: number;
  scale_v: number;
  scale_h: number;
}

export class CMouse extends struct.struct<CMouseProperty> {
  static get fields(): any {
    return [
      ["scale_x", struct.int8_t],
      ["scale_y", struct.int8_t],
      ["scale_v", struct.int8_t],
      ["scale_h", struct.int8_t],
    ];
  }
}

export function ConvertMouse(
  mouse: Mouse | undefined,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): CMouse {
  const cMouse = new CMouse();
  cMouse.$value = {
    scale_x: Math.round(
      mouse?.scale_x !== undefined ? mouse.scale_x * 16 : -128
    ),
    scale_y: Math.round(
      mouse?.scale_y !== undefined ? mouse.scale_y * 16 : -128
    ),
    scale_v: Math.round(
      mouse?.scale_v !== undefined ? mouse.scale_v * 16 : -128
    ),
    scale_h: Math.round(
      mouse?.scale_h !== undefined ? mouse.scale_h * 16 : -128
    ),
  };

  return cMouse;
}
