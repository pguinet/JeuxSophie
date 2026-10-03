// ESLint 9 (flat config) pour le code partagé et les jeux qui l'utilisent.
// Lancé par shared/tools/lint.sh (Docker, sans npm local).
const browserGlobals = {
    window: 'readonly', document: 'readonly', navigator: 'readonly', console: 'readonly',
    requestAnimationFrame: 'readonly', performance: 'readonly', localStorage: 'readonly',
    setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
    ResizeObserver: 'readonly', location: 'readonly', URLSearchParams: 'readonly', innerWidth: 'readonly',
    innerHeight: 'readonly', devicePixelRatio: 'readonly', AudioContext: 'readonly', Image: 'readonly',
};
const nodeGlobals = { console: 'readonly', URL: 'readonly' };

const rules = {
    'no-undef': 'error',
    'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_' }],
    'no-redeclare': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-unreachable': 'error',
    'no-const-assign': 'error',
    'no-self-assign': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',
    'eqeqeq': ['error', 'smart'],
    'use-isnan': 'error',
    'valid-typeof': 'error',
};

export default [
    {
        files: ['shared/*.js', 'habille/js/**/*.js', 'etoiles3d/js/**/*.js', 'defile/js/**/*.js', 'monde/atelier/js/**/*.js'],
        languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: browserGlobals },
        rules,
    },
    {
        files: ['shared/test/**/*.mjs', 'shared/eslint.config.js'],
        languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: nodeGlobals },
        rules,
    },
];
