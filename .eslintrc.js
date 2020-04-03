module.exports = {
    env: {
        node: true,
        es6: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 2015,
        sourceType: 'module',
    },
    rules: {
        'no-console': 'off',
        indent: ['error', 4],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
    },
};
