import fs from "fs";
import fetch from "node-fetch";

function convertKeycodeTableToNumberTable(keycodeTable) {
  const result = {};
  for (const keycodeNumber in keycodeTable) {
    const keycode = keycodeTable[keycodeNumber];
    result[keycode.key] = Number(keycodeNumber);
    if (keycode.aliases) {
      for (const alias of keycode.aliases) {
        result[alias] = Number(keycodeNumber);
      }
    }
  }
  return result;
}

const filePaths = [
  "src/keycode_table/mod_keycodes.json",
  "src/keycode_table/quantizer_keycodes.json",
  "src/keycode_table/character_keycodes.json",
  "src/keycode_table/user_keycodes.json",
];
const outputFilePath = "src/keycode_table/";

const userTable = filePaths.map(filePath => {
  const jsonStr = fs.readFileSync(filePath, { encoding: "utf8" });
  const keycodeTable = JSON.parse(jsonStr);
  return convertKeycodeTableToNumberTable(keycodeTable);
}).reduce((acc, table) => ({ ...acc, ...table }), {});


const settings = { method: "Get" };

const [keycodeBase, range] = await fetch("https://keyboards.qmk.fm/v1/constants/keycodes_0.0.2.json", settings)
  .then(res => res.json())
  .then((json) => {
    const kt = convertKeycodeTableToNumberTable(json.keycodes);
    const range = Object.entries(json.ranges).reduce((acc, cur) => {
      acc[cur[1].define] = Number(cur[0].split('/')[0]);
      acc[cur[1].define + "_MAX"] = Number(cur[0].split('/')[0]) + Number(cur[0].split('/')[1]);
      return acc;
    }, {});
    return [kt, range];
  });

const keycodeAliases = await fetch("https://keyboards.qmk.fm/v1/constants/keycodes_us_0.0.1.json", settings)
  .then(res => res.json())
  .then((json) => {
    const kt = {};

    for (const [keyCodeExpr, value] of Object.entries(json.aliases)) {
      const match = keyCodeExpr.match(/^S\((.*)\)/);
      if (match.length > 1) {
        const keycodeNumber = keycodeBase[match[1]] | (2 << 8);
        kt[value.key] = keycodeNumber;
        if (value.aliases) {
          for (const alias of value.aliases) {
            kt[alias] = keycodeNumber;
          }
        }
      }
    }

    return kt;
  });

const jpKeycodeAliases = await fetch("https://keyboards.qmk.fm/v1/constants/keycodes_japanese_0.0.1.json", settings)
  .then(res => res.json())
  .then((json) => {
    const kt = {};

    for (const [keyCodeExpr, value] of Object.entries(json.aliases)) {
      const match = keyCodeExpr.match(/^S\((.*)\)/);
      if (match == null) {
        kt[value.key] = keycodeBase[keyCodeExpr];
      }
      else if (match?.length > 1) {
        const keycodeNumber = kt[match[1]] | (2 << 8);
        kt[value.key] = keycodeNumber;
      }
    }

    return kt;
  });

const convertedTable = { ...keycodeBase, ...keycodeAliases, ...jpKeycodeAliases, ...userTable };
fs.writeFileSync(outputFilePath + "keycode_table_converted.json", JSON.stringify(convertedTable, null, 2));
fs.writeFileSync(outputFilePath + "quantum_keycode_range.json", JSON.stringify(range, null, 2));