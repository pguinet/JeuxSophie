export class CameraControls {
    constructor(camera, element) {
        this.camera = camera;
        this.yaw = 0;
        this.pitch = 0;
        this.sensitivity = 0.003;

        this._touchId = null;
        this._lastX = 0;
        this._lastY = 0;

        const PITCH_LIMIT = 80 * Math.PI / 180; // ±80° in radians (~1.396)

        element.addEventListener('touchstart', (e) => {
            if (this._touchId !== null) return;

            for (const touch of e.changedTouches) {
                if (touch.clientX > window.innerWidth / 2) {
                    this._touchId = touch.identifier;
                    this._lastX = touch.clientX;
                    this._lastY = touch.clientY;
                    break;
                }
            }
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (this._touchId === null) return;

            for (const touch of e.changedTouches) {
                if (touch.identifier === this._touchId) {
                    const deltaX = touch.clientX - this._lastX;
                    const deltaY = touch.clientY - this._lastY;

                    this.yaw -= deltaX * this.sensitivity;
                    this.pitch -= deltaY * this.sensitivity;
                    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));

                    this._lastX = touch.clientX;
                    this._lastY = touch.clientY;
                    break;
                }
            }
        }, { passive: true });

        const onTouchEnd = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this._touchId) {
                    this._touchId = null;
                    break;
                }
            }
        };

        element.addEventListener('touchend', onTouchEnd, { passive: true });
        element.addEventListener('touchcancel', onTouchEnd, { passive: true });
    }

    update() {
        // yaw et pitch sont lus par main.js pour positionner la caméra en 3ème personne
    }
}
