// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';

/* global __dirname:readonly */

export default defineConfig({
    plugins: [vue(), eslintPlugin()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'BPaginationTable',
            fileName: (format) => `b-pagination-table.${format}.js`
        },
        rollupOptions: {
            // Make sure to externalise deps that shouldn't be bundled into the library.
            external: ['vue', 'bootstrap-vue-next', 'axios'],
            output: {
                // Provide global variables to use in the UMD for externalised deps
                globals: {
                    axios: 'axios',
                    'bootstrap-vue-next': 'bootstrap-vue-next',
                    vue: 'Vue',
                }
            }
        },
    },
});
