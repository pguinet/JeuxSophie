export class QuestSystem {
    constructor(container, hud) {
        this.hud = hud;
        this.questReward = 10;

        // Pool de quêtes possibles
        this.questPool = [
            { type: 'kill_snake', icon: '🐍', label: 'Tuer {n} serpents', minN: 2, maxN: 4 },
            { type: 'kill_spider', icon: '🕷️', label: 'Tuer {n} araignées', minN: 2, maxN: 3 },
            { type: 'kill_crocodile', icon: '🐊', label: 'Tuer {n} crocodiles', minN: 1, maxN: 2 },
            { type: 'kill_monkey', icon: '🐒', label: 'Tuer {n} singes', minN: 1, maxN: 2 },
            { type: 'kill_any', icon: '💀', label: 'Tuer {n} monstres', minN: 3, maxN: 6 },
            { type: 'collect_coins', icon: '🪙', label: 'Collecter {n} pièces', minN: 10, maxN: 30 },
        ];

        this.quests = [];
        this._loadOrGenerate();
        this._buildUI(container);
        this._updateUI();
    }

    // Seed déterministe basé sur la date du jour
    _dayHash() {
        const d = new Date();
        const str = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // Pseudo-random à partir d'un seed
    _seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    _generateQuests() {
        const hash = this._dayHash();
        const quests = [];
        const usedTypes = new Set();

        for (let i = 0; i < 3; i++) {
            let idx;
            let attempts = 0;
            do {
                idx = Math.floor(this._seededRandom(hash + i * 7 + attempts * 13) * this.questPool.length);
                attempts++;
            } while (usedTypes.has(idx) && attempts < 50);
            usedTypes.add(idx);

            const template = this.questPool[idx];
            const range = template.maxN - template.minN + 1;
            const n = template.minN + Math.floor(this._seededRandom(hash + i * 31) * range);

            quests.push({
                type: template.type,
                icon: template.icon,
                label: template.label.replace('{n}', n),
                target: n,
                progress: 0,
                completed: false,
                rewarded: false,
            });
        }
        return quests;
    }

    _todayKey() {
        const d = new Date();
        return `quests_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
    }

    _loadOrGenerate() {
        const key = this._todayKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            this.quests = JSON.parse(saved);
        } else {
            // Nettoyer les anciennes sauvegardes
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith('quests_') && k !== key) {
                    localStorage.removeItem(k);
                }
            }
            this.quests = this._generateQuests();
            this._save();
        }
    }

    _save() {
        localStorage.setItem(this._todayKey(), JSON.stringify(this.quests));
    }

    _buildUI(container) {
        this.panel = document.createElement('div');
        Object.assign(this.panel.style, {
            position: 'absolute',
            top: '50px',
            left: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            pointerEvents: 'none',
            zIndex: '20',
            fontFamily: "'Segoe UI', Arial, sans-serif",
        });

        const title = document.createElement('div');
        Object.assign(title.style, {
            color: '#ffd700',
            fontSize: '13px',
            fontWeight: 'bold',
            textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
            marginBottom: '2px',
        });
        title.textContent = '📜 Quêtes du jour';
        this.panel.appendChild(title);

        this.questEls = [];
        for (let i = 0; i < 3; i++) {
            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0,0,0,0.45)',
                borderRadius: '6px',
                padding: '4px 8px',
                minWidth: '180px',
            });

            const icon = document.createElement('span');
            icon.style.fontSize = '16px';
            row.appendChild(icon);

            const textCol = document.createElement('div');
            textCol.style.flex = '1';

            const label = document.createElement('div');
            Object.assign(label.style, {
                color: 'white',
                fontSize: '11px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            });
            textCol.appendChild(label);

            const barBg = document.createElement('div');
            Object.assign(barBg.style, {
                width: '100%',
                height: '5px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '3px',
                marginTop: '2px',
                overflow: 'hidden',
            });
            const barFill = document.createElement('div');
            Object.assign(barFill.style, {
                width: '0%',
                height: '100%',
                background: 'linear-gradient(to right, #f39c12, #f1c40f)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
            });
            barBg.appendChild(barFill);
            textCol.appendChild(barBg);

            row.appendChild(textCol);

            const progress = document.createElement('span');
            Object.assign(progress.style, {
                color: 'rgba(255,255,255,0.8)',
                fontSize: '11px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                minWidth: '28px',
                textAlign: 'right',
            });
            row.appendChild(progress);

            this.panel.appendChild(row);
            this.questEls.push({ row, icon, label, barFill, progress });
        }

        container.appendChild(this.panel);
    }

    _updateUI() {
        for (let i = 0; i < 3; i++) {
            const q = this.quests[i];
            const el = this.questEls[i];
            el.icon.textContent = q.icon;
            el.label.textContent = q.label;
            const pct = Math.min(q.progress / q.target, 1) * 100;
            el.barFill.style.width = `${pct}%`;
            el.progress.textContent = `${Math.min(q.progress, q.target)}/${q.target}`;

            if (q.completed) {
                el.barFill.style.background = 'linear-gradient(to right, #2ecc40, #01ff70)';
                el.label.style.color = '#2ecc40';
                el.progress.textContent = '✓';
                el.row.style.opacity = '0.7';
            } else {
                el.barFill.style.background = 'linear-gradient(to right, #f39c12, #f1c40f)';
                el.label.style.color = 'white';
                el.row.style.opacity = '1';
            }
        }
    }

    // Appelé quand un monstre est tué
    onMonsterKilled(monsterType) {
        const typeMap = {
            'snake': 'kill_snake',
            'spider': 'kill_spider',
            'crocodile': 'kill_crocodile',
            'monkey': 'kill_monkey',
        };

        for (const q of this.quests) {
            if (q.completed) continue;
            if (q.type === typeMap[monsterType] || q.type === 'kill_any') {
                q.progress++;
                if (q.progress >= q.target && !q.rewarded) {
                    q.completed = true;
                    q.rewarded = true;
                    this.hud.addCoins(this.questReward);
                }
            }
        }
        this._save();
        this._updateUI();
    }

    // Appelé quand des pièces sont collectées
    onCoinsCollected(totalCoins) {
        for (const q of this.quests) {
            if (q.completed) continue;
            if (q.type === 'collect_coins') {
                q.progress = totalCoins;
                if (q.progress >= q.target && !q.rewarded) {
                    q.completed = true;
                    q.rewarded = true;
                    this.hud.addCoins(this.questReward);
                }
            }
        }
        this._save();
        this._updateUI();
    }

    reset() {
        // Recharger les quêtes du jour (garde la progression sauvegardée)
        this._loadOrGenerate();
        this._updateUI();
    }
}
