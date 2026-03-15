export class VirtualJoystick {
    constructor(container) {
        this.dx = 0;
        this.dy = 0;
        this.activeTouchId = null;
        this.centerX = 0;
        this.centerY = 0;
        this.maxRadius = 60; // half of outer circle diameter (120 / 2)

        // Create joystick zone (left half of screen)
        this.zone = document.createElement('div');
        this.zone.id = 'joystick-zone';
        container.appendChild(this.zone);

        // Outer circle
        this.outer = document.createElement('div');
        this.outer.className = 'joystick-outer';
        this.zone.appendChild(this.outer);

        // Inner circle (stick)
        this.inner = document.createElement('div');
        this.inner.className = 'joystick-inner';
        this.outer.appendChild(this.inner);

        // Bind touch events
        this.zone.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        window.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
    }

    onTouchStart(e) {
        // Only activate if no touch is currently tracked
        if (this.activeTouchId !== null) return;

        for (const touch of e.changedTouches) {
            // Only respond to touches on the left half of the screen
            if (touch.clientX > window.innerWidth / 2) continue;

            e.preventDefault();
            this.activeTouchId = touch.identifier;
            this.centerX = touch.clientX;
            this.centerY = touch.clientY;

            // Show outer circle centered on touch position
            this.outer.style.display = 'block';
            this.outer.style.left = `${this.centerX - 60}px`;
            this.outer.style.top = `${this.centerY - 60}px`;

            // Reset inner circle to center
            this.inner.style.left = '50%';
            this.inner.style.top = '50%';

            this.dx = 0;
            this.dy = 0;
            break;
        }
    }

    onTouchMove(e) {
        if (this.activeTouchId === null) return;

        for (const touch of e.changedTouches) {
            if (touch.identifier !== this.activeTouchId) continue;

            e.preventDefault();

            let offsetX = touch.clientX - this.centerX;
            let offsetY = touch.clientY - this.centerY;

            // Clamp to outer circle radius
            const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            if (distance > this.maxRadius) {
                offsetX = (offsetX / distance) * this.maxRadius;
                offsetY = (offsetY / distance) * this.maxRadius;
            }

            // Move inner circle relative to outer circle center
            // outer is 120px, so center is at 60px; inner is 50px, offset by -25px for centering
            this.inner.style.left = `${60 + offsetX - 25}px`;
            this.inner.style.top = `${60 + offsetY - 25}px`;
            this.inner.style.transform = 'none';

            // Normalize to -1..1
            this.dx = offsetX / this.maxRadius;
            this.dy = offsetY / this.maxRadius;
            break;
        }
    }

    onTouchEnd(e) {
        if (this.activeTouchId === null) return;

        for (const touch of e.changedTouches) {
            if (touch.identifier !== this.activeTouchId) continue;

            this.activeTouchId = null;
            this.dx = 0;
            this.dy = 0;

            // Hide joystick
            this.outer.style.display = 'none';
            // Reset inner circle position
            this.inner.style.left = '50%';
            this.inner.style.top = '50%';
            this.inner.style.transform = 'translate(-50%, -50%)';
            break;
        }
    }

    getDirection() {
        return { x: this.dx, y: this.dy };
    }
}
