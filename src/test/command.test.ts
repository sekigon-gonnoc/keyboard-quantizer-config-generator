import { expect, test } from "vitest";
import { ConvertMacros } from "../action";

test("Launch", () => {
  const res = ConvertMacros([{ command: "launch" }], 0x100);
  expect(new Uint8Array(res.macroAddress.$buffer)).toEqual(
    Uint8Array.from([4, 1, 0, 0])
  );
  expect(new Uint8Array(res.macroDefinitions.$buffer)).toEqual(
    Uint8Array.from([2, 0x6c, 0x61, 0x75, 0x6e, 0x63, 0x68, 0])
  );
});
