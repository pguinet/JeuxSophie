// L'écran qui apparaît à la fin du défilé : les étoiles, ce qu'en pensent les
// trois juges, et les petits conseils pour faire encore mieux la prochaine fois.

const style = (el, css) => Object.assign(el.style, css);

function bouton(texte, couleur) {
    const b = document.createElement('button');
    b.textContent = texte;
    style(b, {
        fontFamily: 'inherit', cursor: 'pointer', border: 'none', color: '#fff',
        background: couleur, borderRadius: '22px', padding: '2.4vmin 5vmin',
        fontSize: 'clamp(16px, 3.2vmin, 24px)', fontWeight: 'bold',
        boxShadow: '0 5px 0 rgba(0,0,0,.3)',
    });
    return b;
}

export function initResultat({ onRejouer, onHabiller }) {
    const fond = document.createElement('div');
    style(fond, {
        position: 'fixed', inset: '0', zIndex: '40', display: 'none',
        background: 'rgba(20,6,30,.72)', alignItems: 'center', justifyContent: 'center',
        padding: '3vmin',
        fontFamily: "'Comic Sans MS', 'Baloo 2', 'Segoe UI', system-ui, sans-serif",
    });

    const carte = document.createElement('div');
    style(carte, {
        background: 'linear-gradient(160deg, #fff9fb, #ffe9f3)',
        width: 'min(680px, 96vw)', maxHeight: '92vh', overflowY: 'auto',
        borderRadius: '30px', padding: '3.4vmin 3.4vmin 3vmin',
        boxShadow: '0 12px 40px rgba(0,0,0,.5)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2vmin',
        textAlign: 'center',
    });
    fond.appendChild(carte);

    const titre = document.createElement('h1');
    style(titre, { fontSize: 'clamp(24px, 5vmin, 40px)', color: '#c2255c' });

    const etoilesEl = document.createElement('div');
    style(etoilesEl, { fontSize: 'clamp(34px, 8vmin, 64px)', letterSpacing: '0.2vmin', lineHeight: '1.1' });

    const jugesEl = document.createElement('div');
    style(jugesEl, { display: 'flex', flexDirection: 'column', gap: '1.2vmin', width: '100%' });

    const conseilsTitre = document.createElement('div');
    style(conseilsTitre, { fontSize: 'clamp(15px, 3vmin, 21px)', color: '#5f3dc4', fontWeight: 'bold', marginTop: '1vmin' });
    conseilsTitre.textContent = '💡 Pour faire encore mieux :';

    const conseilsEl = document.createElement('ul');
    style(conseilsEl, {
        listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8vmin',
        fontSize: 'clamp(14px, 2.7vmin, 19px)', color: '#495057', width: '100%',
    });

    const total = document.createElement('div');
    style(total, { fontSize: 'clamp(15px, 3vmin, 22px)', color: '#e8590c', fontWeight: 'bold' });

    const boutons = document.createElement('div');
    style(boutons, { display: 'flex', flexWrap: 'wrap', gap: '2vmin', justifyContent: 'center', marginTop: '1vmin' });
    const bRejouer = bouton('🎲 Nouveau thème', '#ff5fa2');
    const bHabiller = bouton('👗 Changer ma tenue', '#4dabf7');
    boutons.append(bRejouer, bHabiller);

    carte.append(titre, etoilesEl, jugesEl, conseilsTitre, conseilsEl, total, boutons);
    document.body.appendChild(fond);

    bRejouer.addEventListener('click', () => { api.cacher(); onRejouer(); });
    bHabiller.addEventListener('click', () => { api.cacher(); onHabiller(); });

    const api = {
        montrer({ theme, etoiles, notes, details, totalEtoiles, meilleur, record }) {
            titre.textContent = theme.emoji + ' ' + theme.nom;
            etoilesEl.textContent = '⭐'.repeat(etoiles) + '☆'.repeat(5 - etoiles);

            jugesEl.innerHTML = '';
            notes.forEach((n) => {
                const l = document.createElement('div');
                style(l, {
                    display: 'flex', alignItems: 'center', gap: '2vmin',
                    background: '#fff', borderRadius: '18px', padding: '1.4vmin 2.4vmin',
                    boxShadow: '0 3px 0 rgba(0,0,0,.12)', textAlign: 'left',
                });
                const av = document.createElement('div');
                av.textContent = n.juge.emoji;
                style(av, { fontSize: 'clamp(26px, 5vmin, 40px)' });
                const txt = document.createElement('div');
                style(txt, { flex: '1', fontSize: 'clamp(13px, 2.6vmin, 18px)', color: '#495057' });
                const nom = document.createElement('b');
                nom.textContent = n.juge.nom;
                style(nom, { color: n.juge.couleur });
                const phrase = document.createElement('div');
                phrase.textContent = n.phrase;
                txt.append(nom, phrase);
                const note = document.createElement('div');
                note.textContent = '⭐'.repeat(n.note);
                style(note, { fontSize: 'clamp(14px, 2.8vmin, 20px)', whiteSpace: 'nowrap' });
                l.append(av, txt, note);
                jugesEl.appendChild(l);
            });

            // au maximum trois conseils, en montrant d'abord ce qui manque
            conseilsEl.innerHTML = '';
            const aRevoir = details.filter((d) => !d.ok).slice(0, 3);
            const aGarder = details.filter((d) => d.ok).slice(0, 2);
            const lignes = aRevoir.length ? aRevoir : aGarder;
            conseilsTitre.textContent = aRevoir.length ? '💡 Pour faire encore mieux :' : '🎉 Ce qui a plu aux juges :';
            lignes.forEach((d) => {
                const li = document.createElement('li');
                li.textContent = (d.ok ? '✅ ' : '👉 ') + d.texte;
                conseilsEl.appendChild(li);
            });

            total.textContent = record
                ? `🏆 Nouveau record ! Tu as ${totalEtoiles} étoiles en tout.`
                : `Tu as ${totalEtoiles} étoiles en tout (meilleur défilé : ${meilleur} ⭐)`;

            fond.style.display = 'flex';
        },
        cacher() { fond.style.display = 'none'; },
        estOuvert: () => fond.style.display !== 'none',
    };
    return api;
}
