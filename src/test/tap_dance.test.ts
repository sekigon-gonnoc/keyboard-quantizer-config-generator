import { expect, test } from "vitest";
import { ConvertTapDances } from "../tap_dance";

test("TapDanceTest", () => {
  const cTapDance = ConvertTapDances(
    [
      {
        tap_dance: {
          single_tap: "KC_A",
          single_hold: "KC_B",
          double_tap: "KC_C",
          double_hold: "KC_D",
          term: 100,
        },
      },
    ],
    0
  );
  expect(cTapDance.cTapDances[0].$value.single_tap).toBe(4);
  expect(cTapDance.cTapDances[0].$value.single_hold).toBe(5);
  expect(cTapDance.cTapDances[0].$value.double_tap).toBe(6);
  expect(cTapDance.cTapDances[0].$value.double_hold).toBe(7);
  expect(cTapDance.cTapDances.$arrayBuffer.byteLength).toBe(8);
});
