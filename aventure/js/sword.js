import * as THREE from 'three';

export class Sword {
    constructor(camera) {
        this.camera = camera;
        this.attacking = false;
        this.attackTime = 0;
        this.attackDuration = 0.3; // seconds
        this.damage = 15;
        this.attackRange = 3;
        this.attackAngle = Math.PI / 3; // 60 degree cone in front

        // Build sword mesh as a Group, child of camera
        this.group = new THREE.Group();

        // Handle (bottom) - brown cylinder
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2800 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = 0;
        this.group.add(handle);

        // Guard (middle) - gold box
        const guardGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.05);
        const guardMaterial = new THREE.MeshStandardMaterial({ color: 0xdaa520 });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.y = 0.075 + 0.015; // top of handle + half guard height
        this.group.add(guard);

        // Blade (top) - silver/grey box
        const bladeGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.05);
        const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.075 + 0.03 + 0.3; // top of guard + half blade height
        this.group.add(blade);

        // Position bottom-right of view
        this.group.position.set(0.4, -0.3, -0.5);

        // Rest rotation (slight tilt)
        this.restRotation = new THREE.Euler(-0.3, 0, 0.2);
        this.group.rotation.copy(this.restRotation);

        camera.add(this.group);
    }

    attack(snakes, playerPosition, cameraYaw) {
        if (this.attacking) return;
        this.attacking = true;
        this.attackTime = 0;

        // Check which snakes are in range and in front of player
        for (const snake of snakes) {
            if (snake.isDead()) continue;

            const dx = snake.group.position.x - playerPosition.x;
            const dz = snake.group.position.z - playerPosition.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > this.attackRange) continue;

            // Check if snake is in front of player (within attackAngle cone)
            const angleToSnake = Math.atan2(dx, -dz);
            let angleDiff = angleToSnake - cameraYaw;
            // Normalize angle difference to -PI..PI
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < this.attackAngle / 2) {
                snake.takeDamage(this.damage);
            }
        }
    }

    update(deltaTime) {
        if (!this.attacking) return;

        this.attackTime += deltaTime;
        const t = this.attackTime / this.attackDuration;

        if (t >= 1) {
            // Attack finished, return to rest
            this.attacking = false;
            this.group.rotation.copy(this.restRotation);
            return;
        }

        // Swing animation: rotate forward then back
        // First half: swing forward (rotate on X axis)
        // Second half: return to rest
        const swing = t < 0.5
            ? t * 2       // 0 to 1 in first half
            : (1 - t) * 2; // 1 to 0 in second half

        this.group.rotation.x = this.restRotation.x - swing * 1.5;
        this.group.rotation.z = this.restRotation.z - swing * 0.3;
    }

    isAttacking() { return this.attacking; }
}
