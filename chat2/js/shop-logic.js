// Boutique — logique pure (catalogue, achat, pièces). Mêmes objets et prix que la v1.
export const ITEMS = [
    { id: 'ball',        name: 'Balle',         icon: '⚽', price: 20, effect: { happiness: +15 }, kind: 'toy',       desc: 'Le chat court après la balle.' },
    { id: 'mouse',       name: 'Souris',        icon: '🐭', price: 30, effect: { happiness: +20 }, kind: 'toy',       desc: 'Une souris en peluche à chasser.' },
    { id: 'fish',        name: 'Poisson',       icon: '🐟', price: 15, effect: { hunger: +40, happiness: +5 }, kind: 'food', desc: 'Un bon poisson frais.' },
    { id: 'cushion_lux', name: 'Coussin luxe',  icon: '🛏️', price: 80, effect: { fatigue: -30 }, kind: 'furniture', desc: 'Un coussin moelleux pour mieux dormir.', once: true },
    { id: 'collar',      name: 'Collier',       icon: '📿', price: 50, effect: { happiness: +10 }, kind: 'accessory', desc: 'Un joli collier rouge.', once: true },
    { id: 'bow',         name: 'Nœud',          icon: '🎀', price: 40, effect: { happiness: +10 }, kind: 'accessory', desc: 'Un nœud rose sur le cou.', once: true },
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const COINS_PER_MINUTE = 1;

export function createWallet() { return { coins: 0, owned: [], playTime: 0, coinAccumulator: 0 }; }

/** Ajoute du temps de jeu ; crédite 1 pièce par minute. Retourne le nombre de pièces gagnées. */
export function tickWallet(w, dt) {
    w.playTime += dt;
    w.coinAccumulator += dt;
    let earned = 0;
    while (w.coinAccumulator >= 60 / COINS_PER_MINUTE) { w.coinAccumulator -= 60 / COINS_PER_MINUTE; w.coins++; earned++; }
    return earned;
}

export function canBuy(w, id) {
    const item = ITEM_BY_ID[id];
    if (!item) return { ok: false, reason: 'inconnu' };
    if (item.once && w.owned.includes(id)) return { ok: false, reason: 'déjà acheté' };
    if (w.coins < item.price) return { ok: false, reason: 'pas assez de pièces' };
    return { ok: true };
}

/** Achète : débite, marque possédé (objets uniques), retourne l'objet ou null. */
export function buy(w, id) {
    if (!canBuy(w, id).ok) return null;
    const item = ITEM_BY_ID[id];
    w.coins -= item.price;
    if (item.once) w.owned.push(id);
    return item;
}
