module.exports = {
    env: {
        browser: true,
        node: true,
        'vue/setup-compiler-macros': true,
    },
    root: true,
    parser: 'vue-eslint-parser',
    parserOptions: {
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
    },
    ignorePatterns: ['dist/'],
    rules: {
        ////////////////////////
        // Style rules
        ////////////////////////

        // Use single quotes, also helps with vue code since HTML requires doubles.
        'quotes': ['error', 'single'],

        // I use 4 spaces for indent.
        'indent': ['error', 4],
        'vue/script-indent': ['error', 4, { 'baseIndent': 0 }],
        'vue/html-indent': ['error', 4, { 'baseIndent': 1 }],

        // Consider those up to readability so turned off.
        'vue/singleline-html-element-content-newline': ['off'],
        'vue/max-attributes-per-line': ['off'],

        // Think this is nicer don't @ me
        'vue/html-closing-bracket-newline': ['error', { 'singleline': 'never', 'multiline': 'never' }],
        'vue/html-closing-bracket-spacing': ['error', { 'startTag': 'never', 'endTag': 'never', 'selfClosingTag': 'never' }],

        // Inconsistent ruling of my brain: spaces inside braces, not inside arrays.
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],

        // My preferred if-block-indent style -> no braces on single-lines (errors impossible because of indent linting)
        // but no single-line ifs. I'd prefer allman ovre 1tbs but the arrow-function handling is horrible.
        'nonblock-statement-body-position': ['error', 'below'],
        'curly': ['error', 'multi'],
        'brace-style': ['error', '1tbs'],

        // Leave trailing commas on multiline stuff, for better diffing.
        'comma-dangle': ['error', 'always-multiline'],

        'no-trailing-spaces': ['error'],

        ////////////////////////
        // Code quality rules
        ////////////////////////

        // Turned off, I've actived 'no implicit any', and I'm too lazy to explicitly specify everything.
        '@typescript-eslint/no-explicit-any': ['off'],
        // Actually useful feature™
        '@typescript-eslint/no-non-null-assertion': ['off'],
        // Shimmied now and then.
        'no-empty-function': ['off'],
        '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],

        // _ marks unused arguments.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-strongly-recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    overrides: [
        {
            'files': ['*.vue'],
            'rules': {
                'indent': 'off',
            },
        },
    ],
};
