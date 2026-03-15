import * as THREE from 'three';

export class Sword {
    constructor(camera) {
        this.camera = camera;
        this.attacking = false;
        this.attackTime = 0;
        this.attackDuration = 0.4;
        this.damage = 15;
        this.attackRange = 3;
        this.attackAngle = Math.PI / 3;

        this.group = new THREE.Group();

        // Handle (bottom) - brown cylinder, plus gros
        const handleGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.25, 8);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x4a2800 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.y = 0;
        this.group.add(handle);

        // Pommeau (bout de la poignée) - sphère dorée
        const pommelGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const pommelMat = new THREE.MeshStandardMaterial({ color: 0xdaa520 });
        const pommel = new THREE.Mesh(pommelGeo, pommelMat);
        pommel.position.y = -0.13;
        this.group.add(pommel);

        // Guard (middle) - gold, plus large
        const guardGeo = new THREE.BoxGeometry(0.25, 0.04, 0.06);
        const guardMat = new THREE.MeshStandardMaterial({ color: 0xdaa520 });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.position.y = 0.14;
        this.group.add(guard);

        // Blade - lame triangulaire plus imposante
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(0.06, 0);
        bladeShape.lineTo(0.0, 0.8);
        bladeShape.lineTo(-0.06, 0);
        bladeShape.closePath();

        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
            depth: 0.03,
            bevelEnabled: true,
            bevelThickness: 0.005,
            bevelSize: 0.005,
            bevelSegments: 1,
        });
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2,
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(0, 0.16, -0.015);
        this.group.add(blade);

        // Ligne brillante au centre de la lame
        const edgeGeo = new THREE.BoxGeometry(0.01, 0.75, 0.005);
        const edgeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1,
            roughness: 0.1,
        });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(0, 0.53, 0);
        this.group.add(edge);

        // Position en bas à droite, bien visible
        this.group.position.set(0.45, -0.35, -0.6);
        this.group.scale.set(1.3, 1.3, 1.3);

        // Rotation au repos (légèrement inclinée)
        this.restRotation = new THREE.Euler(-0.2, 0, 0.15);
        this.group.rotation.copy(this.restRotation);

        camera.add(this.group);
    }

    attack(snakes, playerPosition, cameraYaw) {
        if (this.attacking) return;
        this.attacking = true;
        this.attackTime = 0;

        for (const snake of snakes) {
            if (snake.isDead()) continue;

            const dx = snake.group.position.x - playerPosition.x;
            const dz = snake.group.position.z - playerPosition.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > this.attackRange) continue;

            const angleToSnake = Math.atan2(dx, -dz);
            let angleDiff = angleToSnake - cameraYaw;
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
            this.attacking = false;
            this.group.rotation.copy(this.restRotation);
            this.group.position.set(0.45, -0.35, -0.6);
            return;
        }

        // Grande animation de frappe en 3 phases :
        // 1. Lever l'épée en haut à droite (0-20%)
        // 2. Trancher en diagonale vers le centre/bas-gauche (20-50%)
        // 3. Revenir au repos (50-100%)
        if (t < 0.20) {
            // Lever : l'épée monte au-dessus de l'épaule droite
            const p = t / 0.20;
            this.group.position.x = 0.45 - p * 0.1;
            this.group.position.y = -0.35 + p * 0.6;
            this.group.position.z = -0.6 + p * 0.1;
            this.group.rotation.x = this.restRotation.x + p * 1.2;
            this.group.rotation.z = this.restRotation.z - p * 0.8;
            this.group.rotation.y = p * 0.3;
        } else if (t < 0.50) {
            // Frapper : grand slash diagonal de droite à gauche au centre de l'écran
            const p = (t - 0.20) / 0.30;
            const easeIn = p * p; // accélération
            this.group.position.x = 0.35 - easeIn * 0.7;
            this.group.position.y = 0.25 - easeIn * 0.5;
            this.group.position.z = -0.5 - easeIn * 0.3;
            this.group.rotation.x = this.restRotation.x + 1.2 - easeIn * 3.0;
            this.group.rotation.z = this.restRotation.z - 0.8 + easeIn * 1.8;
            this.group.rotation.y = 0.3 - easeIn * 0.6;
        } else {
            // Retour au repos
            const p = (t - 0.50) / 0.50;
            const ease = p * p * (3 - 2 * p); // smoothstep
            // Position de fin de frappe → position repos
            this.group.position.x = -0.35 + ease * 0.8;
            this.group.position.y = -0.25 - ease * 0.1;
            this.group.position.z = -0.8 + ease * 0.2;
            this.group.rotation.x = (this.restRotation.x - 1.8) + ease * 1.6;
            this.group.rotation.z = (this.restRotation.z + 1.0) - ease * 0.85;
            this.group.rotation.y = -0.3 + ease * 0.3;
        }
    }

    isAttacking() { return this.attacking; }
}
