export class ColorPicker {
    constructor(container) {
        this.container = container;
        this.onSelect = null;

        this.colors = [
            { name: 'Orange', hex: 0xe87e24 },
            { name: 'Noir', hex: 0x333333 },
            { name: 'Gris', hex: 0x7a8b99 },
            { name: 'Blanc', hex: 0xf0ede6 },
            { name: 'Roux', hex: 0xc45e2c },
        ];

        this._build();
    }

    _build() {
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '50',
            pointerEvents: 'auto',
            fontFamily: "'Segoe UI', Arial, sans-serif",
        });

        // Titre
        const title = document.createElement('div');
        Object.assign(title.style, {
            color: 'white',
            fontSize: '22px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
            textAlign: 'center',
        });
        title.textContent = 'Choisis la couleur de ton chat !';
        this.overlay.appendChild(title);

        // Emoji chat
        const catEmoji = document.createElement('div');
        catEmoji.textContent = '🐱';
        catEmoji.style.fontSize = '60px';
        catEmoji.style.marginBottom = '20px';
        this.overlay.appendChild(catEmoji);

        // Ronds de couleur
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            justifyContent: 'center',
        });

        for (const color of this.colors) {
            const circle = document.createElement('div');
            const hexStr = '#' + color.hex.toString(16).padStart(6, '0');
            Object.assign(circle.style, {
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: hexStr,
                border: '3px solid rgba(255,255,255,0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
            });

            const label = document.createElement('div');
            Object.assign(label.style, {
                color: color.hex === 0x333333 ? '#aaa' : '#333',
                fontSize: '10px',
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: color.hex === 0x333333 ? 'none' : '0 0 3px rgba(255,255,255,0.8)',
            });
            label.textContent = color.name;
            circle.appendChild(label);

            circle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this._select(color.hex);
            });
            circle.addEventListener('click', () => this._select(color.hex));

            row.appendChild(circle);
        }

        this.overlay.appendChild(row);
        this.container.appendChild(this.overlay);
    }

    _select(hex) {
        this.overlay.style.display = 'none';
        if (this.onSelect) this.onSelect(hex);
    }

    hide() {
        this.overlay.style.display = 'none';
    }
}
