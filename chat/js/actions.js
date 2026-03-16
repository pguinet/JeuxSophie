export class ActionBar {
    constructor(container) {
        this.container = container;
        this.callbacks = {};
        this.cooldowns = {};
        this._build();
    }

    _build() {
        this.bar = document.createElement('div');
        Object.assign(this.bar.style, {
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            pointerEvents: 'auto',
            zIndex: '20',
        });

        const actions = [
            { id: 'feed',  icon: '🍖', label: 'Nourrir' },
            { id: 'drink', icon: '💧', label: 'Boire' },
            { id: 'pet',   icon: '🤚', label: 'Caresser' },
            { id: 'wash',  icon: '🧼', label: 'Laver' },
            { id: 'sleep', icon: '😴', label: 'Dormir' },
        ];

        this.buttons = {};
        for (const action of actions) {
            const btn = document.createElement('div');
            Object.assign(btn.style, {
                width: '58px',
                height: '58px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.5)',
                border: '2px solid rgba(255,255,255,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                transition: 'opacity 0.2s ease, transform 0.1s ease',
            });

            const icon = document.createElement('div');
            icon.textContent = action.icon;
            icon.style.fontSize = '22px';
            btn.appendChild(icon);

            const label = document.createElement('div');
            Object.assign(label.style, {
                color: 'white',
                fontSize: '9px',
                fontWeight: 'bold',
                fontFamily: "'Segoe UI', Arial, sans-serif",
            });
            label.textContent = action.label;
            btn.appendChild(label);

            const handler = (e) => {
                if (e.type === 'touchstart') e.preventDefault();
                this._trigger(action.id, btn);
            };
            btn.addEventListener('touchstart', handler);
            btn.addEventListener('click', handler);

            this.bar.appendChild(btn);
            this.buttons[action.id] = btn;
        }

        this.container.appendChild(this.bar);
    }

    _trigger(id, btn) {
        if (this.cooldowns[id]) return;

        // Animation press
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => { btn.style.transform = 'scale(1)'; }, 100);

        // Cooldown 3s
        this.cooldowns[id] = true;
        btn.style.opacity = '0.4';
        setTimeout(() => {
            this.cooldowns[id] = false;
            btn.style.opacity = '1';
        }, 3000);

        if (this.callbacks[id]) this.callbacks[id]();
    }

    on(actionId, callback) {
        this.callbacks[actionId] = callback;
    }
}
