/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      // Enable esbuild polyfill plugins
      // https://medium.com/@ftaioli/using-node-js-builtin-modules-with-vite-6194737c2cd2
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
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
