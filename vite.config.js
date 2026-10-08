// vite.config.js
import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite'
import {BootstrapVueNextResolver} from 'bootstrap-vue-next/resolvers'
import eslintPlugin from 'vite-plugin-eslint';

export default defineConfig({
    plugins: [
        vue(),
        Components({
            resolvers: [BootstrapVueNextResolver()],
        }),
        eslintPlugin()
    ],
    build: {
        lib: {
            entry: 'src/index.js',
            name: '@xactsystems/b-pagination-table',
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
