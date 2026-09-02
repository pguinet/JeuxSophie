// Configuration ESLint 9 (flat config) autonome : pas d'import de paquet externe
// pour rester exécutable via `npx eslint` dans Docker sans node_modules local.
const browserGlobals = {
    window: 'readonly', document: 'readonly', navigator: 'readonly', console: 'readonly',
    requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly', performance: 'readonly',
    localStorage: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
    setInterval: 'readonly', clearInterval: 'readonly', Image: 'readonly', URL: 'readonly',
    fetch: 'readonly', Worker: 'readonly', ImageData: 'readonly', OffscreenCanvas: 'readonly',
    HTMLCanvasElement: 'readonly', TextDecoder: 'readonly', Blob: 'readonly', location: 'readonly',
    devicePixelRatio: 'readonly', innerWidth: 'readonly', innerHeight: 'readonly', self: 'readonly',
    postMessage: 'readonly', onmessage: 'writable', URLSearchParams: 'readonly', history: 'readonly', AudioContext: 'readonly', CustomEvent: 'readonly',
};
const nodeGlobals = { process: 'readonly', Buffer: 'readonly', console: 'readonly', URL: 'readonly', fetch: 'readonly', performance: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' };

const rules = {
    'no-undef': 'error',
    'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_' }],
    'no-redeclare': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-unreachable': 'error',
    'no-const-assign': 'error',
    'no-self-assign': 'error',
    'no-shadow-restricted-names': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',
    'eqeqeq': ['error', 'smart'],
    'no-implicit-globals': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
};

export default [
    {
        files: ['chat2/js/**/*.js'],
        languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: browserGlobals },
        rules,
    },
    {
        files: ['chat2/tools/**/*.mjs', 'chat2/test/**/*.js', 'chat2/eslint.config.js'],
        languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: nodeGlobals },
        rules,
    },
];
