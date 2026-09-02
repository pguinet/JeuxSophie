// Gestion de la qualité graphique : détection, persistance, moniteur de FPS, menu ⚙️.
import * as THREE from 'three';
import { PRESETS, PRESET_ORDER, detectPreset, adjustPreset, createFpsMeter } from './quality-presets.js';

const STORAGE_KEY = 'monchat2_quality';

export class QualityManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.listeners = [];
        this.meter = createFpsMeter(180);
        this.autoChecked = false;
        let saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* stockage indisponible */ }
        this.manual = saved && PRESET_ORDER.includes(saved);
        this.preset = this.manual ? saved : detectPreset(this._info());
    }

    _info() {
        const gl = this.renderer.getContext();
        let name = '';
        try {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        } catch { /* ignore */ }
        return {
            renderer: name,
            deviceMemory: navigator.deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
            isMobile: /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent),
        };
    }

    get settings() { return PRESETS[this.preset]; }

    onChange(cb) { this.listeners.push(cb); }

    set(preset, { manual = true } = {}) {
        if (!PRESET_ORDER.includes(preset) || preset === this.preset) return;
        this.preset = preset;
        if (manual) { this.manual = true; try { localStorage.setItem(STORAGE_KEY, preset); } catch { /* ignore */ } }
        this.applyToRenderer();
        for (const cb of this.listeners) cb(this.settings, preset);
        this._refreshMenu();
    }

    applyToRenderer() {
        const s = this.settings;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.pixelRatioCap));
        this.renderer.shadowMap.type = s.shadowType === 'pcfsoft' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
        this.renderer.shadowMap.needsUpdate = true;
    }

    /** À appeler chaque frame : après ~3 s stables, baisse automatiquement d'un cran si ça rame (une seule fois, sauf réglage manuel). */
    tick(dt) {
        if (this.manual || this.autoChecked) return;
        this.meter.push(dt);
        if (!this.meter.ready) return;
        this.autoChecked = true;
        const next = adjustPreset(this.preset, this.meter.fps, 40);
        if (next !== this.preset) { this.set(next, { manual: false }); this.autoChecked = false; this.meter.reset(); }
    }

    /** Menu ⚙️ (coin supérieur droit). */
    buildMenu(container) {
        const btn = document.createElement('button');
        btn.className = 'glass round-btn quality-btn';
        btn.textContent = '⚙️';
        btn.title = 'Qualité graphique';
        container.appendChild(btn);
        const panel = document.createElement('div');
        panel.className = 'glass panel quality-panel';
        panel.hidden = true;
        panel.innerHTML = `<div class="panel-title">Qualité graphique</div>`;
        this.menuButtons = {};
        for (const key of PRESET_ORDER) {
            const b = document.createElement('button');
            b.className = 'choice';
            b.textContent = PRESETS[key].label;
            b.addEventListener('click', () => this.set(key));
            panel.appendChild(b);
            this.menuButtons[key] = b;
        }
        const hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = 'Si ça saccade, choisis « Faible ».';
        panel.appendChild(hint);
        container.appendChild(panel);
        btn.addEventListener('click', () => { panel.hidden = !panel.hidden; });
        this.panel = panel;
        this._refreshMenu();
    }

    _refreshMenu() {
        if (!this.menuButtons) return;
        for (const [k, b] of Object.entries(this.menuButtons)) b.classList.toggle('active', k === this.preset);
    }
}
