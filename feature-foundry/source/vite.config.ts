import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 550,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "three-runtime", test: /node_modules[\\/]three/, priority: 30 },
            { name: "tauri-runtime", test: /node_modules[\\/]@tauri-apps/, priority: 20 },
            { name: "world-catalogs", test: /src[\\/]data[\\/]/, priority: 15 },
            { name: "vendor", test: /node_modules/, priority: 10 },
          ],
        },
      },
    },
  },
});
