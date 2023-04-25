import { expect, test } from "vitest";
import { ConvertLeaders } from "../leader.ts";

test("LeaderTest", () => {
  const cLeader = ConvertLeaders(
    [{ leader: { keys: ["KC_A", "KC_B", "KC_C"], keycode: "KC_D" } }],
    0
  );
  expect(cLeader.cLeaders[0].$value.keys_address).toBe(8);
  expect(cLeader.cLeaders[0].$value.keys_len).toBe(3);
  expect(cLeader.cLeaders[0].$value.keycode).toBe(7);
  expect(cLeader.cLeadKeys.$arrayBuffer.byteLength).toBe(8);
  expect(new Uint8Array(cLeader.cLeaders[0].$arrayBuffer)).toEqual(
    new Uint8Array([8, 0, 0, 0, 3, 0, 7, 0])
  );
});
