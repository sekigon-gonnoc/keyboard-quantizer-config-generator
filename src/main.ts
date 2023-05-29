import { CConfig, ConfigConverter } from "./config.ts";
import {
  editor,
  Uri,
  languages,
  MarkerSeverity,
  type IRange,
} from "monaco-editor";
import { setDiagnosticsOptions } from "monaco-yaml";
import * as KeyCodeTable from "./keycode_table/keycode_table_converted.json";
import { KeycodeFunctions } from "./keycodes.ts";
import pako from "pako";
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

const ADDRESS_OFFSET = 0x1010_0000;
const CONFIG_LENGTH_MAX = 0x000f_0000;

// The uri is used for the schema file match.
const modelUri = Uri.parse("keyboard-quantizer-config.yaml");

setDiagnosticsOptions({
  enableSchemaRequest: true,
  hover: true,
  completion: true,
  validate: true,
  format: true,
  schemas: [
    {
      uri: new URL("./schema/yaml.schema.json", import.meta.url).href,
      fileMatch: [String(modelUri)],
    },
  ],
});

const initialEditorContent = `# See https://github.com/sekigon-gonnoc/keyboard-quantizer-doc/blob/master/mini/full_config.md for details
- application:
    keymaps:
      - keymap:
          layer: 0
          map:
            KC_CAPS: KC_LCTL
`;

const editorElem = document.getElementById("editor");
const ed =
  editorElem === null
    ? undefined
    : editor.create(editorElem, {
        automaticLayout: true,
        scrollBeyondLastLine: false,
        model: editor.createModel(initialEditorContent, "yaml", modelUri),
        theme: "vs-dark",
      });
editor.getModel(modelUri)?.updateOptions({ tabSize: 2, insertSpaces: true });
editor.getEditors()[0].updateOptions({ quickSuggestions: true });
languages.registerCompletionItemProvider("yaml", {
  provideCompletionItems: (model, position, context, token) => {
    const word = model.getWordUntilPosition(position);
    const range: IRange = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };
    const suggestions = [
      ...Object.entries(KeyCodeTable).map(([key, value]) => {
        const item: languages.CompletionItem = {
          label: key,
          kind: languages.CompletionItemKind.Keyword,
          insertText: key,
          range,
          detail: "0x" + ("0000" + value.toString(16).toUpperCase()).slice(-4),
        };
        return item;
      }),
      ...Object.keys(KeycodeFunctions).map((k) => {
        const item: languages.CompletionItem = {
          label: k,
          kind: languages.CompletionItemKind.Method,
          insertText: k,
          range,
          detail: KeycodeFunctions[k].toString(),
        };
        return item;
      }),
    ];
    return { suggestions };
  },
});

editor.onDidChangeMarkers(([resource]) => {
  const problems = document.getElementById("problems");
  if (problems == null) {
    return;
  }
  const markers = editor.getModelMarkers({ resource });
  while (problems.lastChild != null) {
    problems.lastChild.remove();
  }
  for (const marker of markers) {
    if (marker.severity === MarkerSeverity.Hint) {
      continue;
    }
    const wrapper = document.createElement("div");
    wrapper.setAttribute("role", "button");
    const codicon = document.createElement("div");
    const text = document.createElement("div");
    wrapper.classList.add("problem");
    text.classList.add("problem-text");
    text.textContent = marker.message;
    wrapper.append(codicon, text);
    wrapper.addEventListener("click", () => {
      ed?.setPosition({
        lineNumber: marker.startLineNumber,
        column: marker.startColumn,
      });
      ed?.focus();
    });
    problems.append(wrapper);
  }
});

const decoder = new TextDecoder();
const binButton = document.getElementById("binButton") as HTMLButtonElement;
const uf2Button = document.getElementById("uf2Button") as HTMLButtonElement;
const uploadFile = document.getElementById("uploadFile") as HTMLInputElement;

(document.getElementById("uploadButton") as HTMLButtonElement).addEventListener(
  "click",
  () => {
    document.getElementById("uploadFile")?.click();
  }
);

(document.getElementById("uploadFile") as HTMLInputElement).addEventListener(
  "change",
  () => {
    const file = uploadFile.files?.[0];
    if (file == null) return;
    const reader = new FileReader();

    reader.onload = async () => {
      const raw: ArrayBuffer = await file.arrayBuffer();
      const extension = file.name.slice(file.name.lastIndexOf(".") + 1);

      const buf = extension.toLowerCase() === "uf2" ? convertToBin(raw) : raw;

      try {
        // load array buffer to config header
        const config = new CConfig(null, {
          buffer: new Uint8Array(buf.slice(0, CConfig.byteSize)),
        });
        // load config yaml file to editor
        editor.getEditors()[0].setValue(
          // unzip yaml data which is appended at bottom of config binary
          decoder.decode(
            pako.ungzip(buf.slice(config.$value.yaml_address - ADDRESS_OFFSET))
          )
        );
      } catch (error) {
        alert(error);
      }
    };

    reader.readAsArrayBuffer(file);
  }
);

function downloadBinaryFile(data: Uint8Array, fileName: string): void {
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

binButton.addEventListener("click", () => {
  const config = new ConfigConverter();
  try {
    const cConfig = config.Convert(
      editor.getEditors()[0].getValue(),
      ADDRESS_OFFSET
    );

    if (cConfig.buffer.length > CONFIG_LENGTH_MAX) {
      throw new Error("Config is too long");
    }

    downloadBinaryFile(cConfig.buffer, "config.bin");
  } catch (error) {
    console.error(error);
    alert(error);
  }
});

uf2Button.addEventListener("click", () => {
  const config = new ConfigConverter();
  try {
    const cConfig = config.Convert(
      editor.getEditors()[0].getValue(),
      ADDRESS_OFFSET
    );

    if (cConfig.buffer.length > CONFIG_LENGTH_MAX) {
      throw new Error("Config is too long");
    }

    const uf2 = convertToUf2(cConfig.buffer, ADDRESS_OFFSET, 0xe48bff56);
    downloadBinaryFile(uf2, "CONFIG.UF2");
  } catch (error) {
    console.error(error);
    alert(error);
  }
});

const UF2_MAGIC_START0 = 0x0a324655;
const UF2_MAGIC_START1 = 0x9e5d5157;
const UF2_MAGIC_END = 0x0ab16f30;

function convertToUf2(
  fileContents: Uint8Array,
  appStartAddress: number,
  familyId: number
): Uint8Array {
  const dataPadding = new Uint8Array(512 - 256 - 32 - 4).fill(0x00);
  const numBlocks = Math.ceil(fileContents.length / 256);
  const outputArray: Uint8Array[] = [];

  for (let blockno = 0; blockno < numBlocks; blockno++) {
    const ptr = 256 * blockno;
    let chunk = fileContents.subarray(ptr, ptr + 256);
    let flags = 0x0;
    if (familyId !== 0) {
      flags |= 0x2000;
    }

    const hd = new Uint8Array(32);
    const dv = new DataView(hd.buffer);
    dv.setUint32(0, UF2_MAGIC_START0, true);
    dv.setUint32(4, UF2_MAGIC_START1, true);
    dv.setUint32(8, flags, true);
    dv.setUint32(12, ptr + appStartAddress, true);
    dv.setUint32(16, 256, true);
    dv.setUint32(20, blockno, true);
    dv.setUint32(24, numBlocks, true);
    dv.setUint32(28, familyId, true);

    while (chunk.length < 256) {
      chunk = new Uint8Array([...chunk, 0x00]);
    }

    let block = new Uint8Array([...hd, ...chunk, ...dataPadding]);
    const end = new Uint8Array(4);
    const dv2 = new DataView(end.buffer);
    dv2.setUint32(0, UF2_MAGIC_END, true);
    block = new Uint8Array([...block, ...end]);
    outputArray.push(block);
  }

  return new Uint8Array(
    outputArray.reduce<number[]>((acc, block) => [...acc, ...block], [])
  );
}

function convertToBin(fileContents: ArrayBuffer): Uint8Array {
  const numBlocks = Math.floor(fileContents.byteLength / 512);
  const binArray = new Uint8Array(256 * numBlocks);
  for (let blockno = 0; blockno < numBlocks; blockno++) {
    const ptr = 512 * blockno;
    binArray.set(
      new Uint8Array(fileContents.slice(ptr + 32, ptr + 32 + 256)),
      blockno * 256
    );
  }

  return binArray;
}
