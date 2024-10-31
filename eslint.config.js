import js from "@eslint/js";
import pluginVue from 'eslint-plugin-vue';

export default [
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
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
