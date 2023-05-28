/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
  },
  base: "/keyboard-quantizer-config-generator/",
  plugins: [
    monacoEditorPlugin.default({
      languageWorkers: ["editorWorkerService"],
      customWorkers: [{ label: "yaml", entry: "monaco-yaml/yaml.worker.js" }],
    }),
  ],
});
