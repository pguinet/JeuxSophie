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

        // Construire le pistolet (caché par défaut)
        this.gunGroup = new THREE.Group();
        this._buildGun();
        this.gunGroup.position.set(0.35, -0.3, -0.5);
        this.gunGroup.scale.set(1.2, 1.2, 1.2);
        this.gunRestRotation = new THREE.Euler(0, 0, 0);
        this.gunGroup.rotation.copy(this.gunRestRotation);
        this.gunGroup.visible = false;
        camera.add(this.gunGroup);

        this.isGun = false;
    }

    _buildGun() {
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.4 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x4a2800 });

        // Canon
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.5, 8);
        const barrel = new THREE.Mesh(barrelGeo, metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, -0.15);
        this.gunGroup.add(barrel);

        // Corps du pistolet
        const bodyGeo = new THREE.BoxGeometry(0.08, 0.1, 0.25);
        const body = new THREE.Mesh(bodyGeo, darkMat);
        body.position.set(0, 0, 0.05);
        this.gunGroup.add(body);

        // Poignée
        const gripGeo = new THREE.BoxGeometry(0.06, 0.18, 0.08);
        const grip = new THREE.Mesh(gripGeo, handleMat);
        grip.position.set(0, -0.12, 0.12);
        grip.rotation.x = 0.2;
        this.gunGroup.add(grip);

        // Gâchette
        const triggerGeo = new THREE.BoxGeometry(0.02, 0.06, 0.04);
        const trigger = new THREE.Mesh(triggerGeo, metalMat);
        trigger.position.set(0, -0.05, 0.05);
        this.gunGroup.add(trigger);

        // Bout du canon (orange)
        const muzzleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8);
        const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.05, -0.41);
        this.gunGroup.add(muzzle);
    }

    switchToGun(active) {
        this.isGun = active;
        this.group.visible = !active;
        this.gunGroup.visible = active;
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

    gunRecoil() {
        this.attacking = true;
        this.attackTime = 0;
    }

    update(deltaTime) {
        if (!this.attacking) return;

        this.attackTime += deltaTime;

        // Animation recul pistolet
        if (this.isGun) {
            const gunDuration = 0.3;
            const t = this.attackTime / gunDuration;
            if (t >= 1) {
                this.attacking = false;
                this.gunGroup.position.set(0.35, -0.3, -0.5);
                this.gunGroup.rotation.copy(this.gunRestRotation);
                return;
            }
            // Recul rapide puis retour
            const recoil = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7;
            this.gunGroup.position.z = -0.5 + recoil * 0.15;
            this.gunGroup.rotation.x = -recoil * 0.3;
            return;
        }

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
