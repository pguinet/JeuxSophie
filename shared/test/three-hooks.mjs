// Crochet de chargement Node : fait pointer l'import nu « three » vers la copie
// locale de Three.js (comme l'importmap des pages), pour tester les modules 3D.
const THREE_URL = new URL('../../vendor/three@0.170.0/three.module.js', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
    if (specifier === 'three') return { url: THREE_URL, shortCircuit: true };
    return nextResolve(specifier, context);
}
