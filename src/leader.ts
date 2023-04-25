import * as struct from "node-c-struct";
import { Keycodes, CKeycodes } from "./keycodes.ts";
import { type Action } from "./action.ts";

export interface Leader {
  leader: {
    keys: string[];
    keycode: Action;
  };
}

interface CLeaderProperty {
  keys_address: number;
  keys_len: number;
  keycode: number;
}

export class CLeader extends struct.struct<CLeaderProperty> {
  static get fields(): any {
    return [
      ["keys_address", struct.size_t],
      ["keys_len", struct.uint16_t],
      ["keycode", CKeycodes],
    ];
  }
}

export function ConvertLeaders(
  leaders: Leader[],
  baseOffset: number = 0,
  keycodeConverter: (action: Action) => number = Keycodes.ConvertAction
): {
  cLeaders: struct.array<CLeader>;
  cLeadKeys: struct.array<CKeycodes>;
} {
  const cLeaders = new (CLeader.times(leaders.length))();
  let keyAddress = cLeaders.$buffer.byteLength + baseOffset;

  leaders.forEach((l, idx) => {
    cLeaders[idx].$value = {
      keys_address: keyAddress,
      keys_len: l.leader.keys.length,
      keycode: keycodeConverter(l.leader.keycode),
    };
    keyAddress += l.leader.keys.length * CKeycodes.byteSize;
  });

  const keys = leaders.flatMap((l) =>
    l.leader.keys.flatMap((k) => keycodeConverter(k))
  );
  // align to 4 byte
  const padding = keys.length % 4;
  if (padding !== 0) {
    keys.push(...Array(4 - padding).fill(0));
  }

  const leadKeys = new (CKeycodes.times(keys.length))(keys);

  return { cLeaders, cLeadKeys: leadKeys };
}
