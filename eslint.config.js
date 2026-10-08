import js from "@eslint/js";
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            }
        },
        files: ['src/*.js', 'src/*.vue'],
        rules: {
            'vue/html-indent': ['error', 4],
            'vue/max-attributes-per-line': ['error', {
                'singleline': 5,
                'multiline': 5,
            }]
        },
    },
];
