import { expect, test } from "vitest";
import { ConvertMouse, type Mouse } from "../mouse";

test("MouseTest", () => {
  const mouse: Mouse = { scale_x: 1.5, scale_y: -0.5 };
  const cMouse = ConvertMouse(mouse);
  expect(cMouse.$value.scale_x).toBe(24);
  expect(cMouse.$value.scale_y).toBe(-8);
});
