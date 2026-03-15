import * as THREE from 'three';

export class Snake {
    constructor(scene, x, z) {
        this.scene = scene;
        this.hp = 150;
        this.maxHp = 150;
        this.speed = 3;
        this.damage = 10;
        this.detectionRange = 15;
        this.attackRange = 1.5;
        this.dead = false;
        this.time = 0;

        // Patrol state
        this.patrolTarget = null;
        this.patrolWaitTimer = 0;
        this.chasing = false;

        // Flash state
        this.flashTimer = 0;

        this.group = new THREE.Group();
        this.segments = [];
        this.originalColors = [];

        this._buildBody();
        this._buildHealthBar();

        this.group.position.set(x, 0.3, z);
        scene.add(this.group);

        // Pick initial patrol target
        this._pickPatrolTarget();
    }

    _buildBody() {
        const bodyColor = new THREE.Color(0x2d4a1e);
        const bellyColor = new THREE.Color(0x4a6b2a);

        // 8 body segments
        const segmentCount = 8;
        for (let i = 0; i < segmentCount; i++) {
            const isHead = i === 0;
            const radius = isHead ? 0.25 : 0.15 + 0.05 * (1 - i / segmentCount);
            const geometry = new THREE.SphereGeometry(radius, 8, 6);
            const color = i % 2 === 0 ? bodyColor.clone() : bellyColor.clone();
            const material = new THREE.MeshLambertMaterial({ color });
            const segment = new THREE.Mesh(geometry, material);

            // Position segments in a line along local -Z
            segment.position.set(0, isHead ? 0.05 : 0, -i * 0.3);
            this.group.add(segment);
            this.segments.push(segment);
            this.originalColors.push(color.clone());
        }

        // Eyes on the head
        const eyeGeometry = new THREE.SphereGeometry(0.05, 6, 4);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.12, 0.1, 0.15);
        this.segments[0].add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.12, 0.1, 0.15);
        this.segments[0].add(rightEye);
    }

    _buildHealthBar() {
        this.hbCanvas = document.createElement('canvas');
        this.hbCanvas.width = 64;
        this.hbCanvas.height = 12;
        this.hbTexture = new THREE.CanvasTexture(this.hbCanvas);
        this.hbTexture.minFilter = THREE.LinearFilter;

        const mat = new THREE.SpriteMaterial({ map: this.hbTexture, depthTest: false });
        this.healthBar = new THREE.Sprite(mat);
        this.healthBar.scale.set(1.2, 0.25, 1);
        this.healthBar.position.set(0, 0.7, 0);
        this.group.add(this.healthBar);

        this._updateHealthBar();
    }

    _updateHealthBar() {
        const ctx = this.hbCanvas.getContext('2d');
        const w = this.hbCanvas.width;
        const h = this.hbCanvas.height;
        const ratio = Math.max(0, this.hp / this.maxHp);

        // Fond noir
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        // Bordure blanche
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);

        // Barre de vie (vert > jaune > rouge)
        let color;
        if (ratio > 0.6) color = '#22cc22';
        else if (ratio > 0.3) color = '#cccc22';
        else color = '#cc2222';

        const barWidth = (w - 4) * ratio;
        if (barWidth > 0) {
            ctx.fillStyle = color;
            ctx.fillRect(2, 2, barWidth, h - 4);
        }

        this.hbTexture.needsUpdate = true;
    }

    _pickPatrolTarget() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 7; // 3-10 units
        this.patrolTarget = new THREE.Vector3(
            this.group.position.x + Math.cos(angle) * dist,
            this.group.position.y,
            this.group.position.z + Math.sin(angle) * dist
        );
        // Clamp within terrain bounds
        this.patrolTarget.x = Math.max(-90, Math.min(90, this.patrolTarget.x));
        this.patrolTarget.z = Math.max(-90, Math.min(90, this.patrolTarget.z));
    }

    update(deltaTime, playerPosition) {
        if (this.dead) return false;

        this.time += deltaTime;

        // Flash timer
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this._restoreColors();
            }
        }

        // Distance to player
        const dx = playerPosition.x - this.group.position.x;
        const dz = playerPosition.z - this.group.position.z;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);

        this.chasing = distToPlayer <= this.detectionRange;

        let moveDir = new THREE.Vector3();

        if (this.chasing) {
            // Chase player
            moveDir.set(dx, 0, dz).normalize();
            const step = this.speed * deltaTime;
            this.group.position.x += moveDir.x * step;
            this.group.position.z += moveDir.z * step;
        } else {
            // Patrol
            if (this.patrolWaitTimer > 0) {
                this.patrolWaitTimer -= deltaTime;
                if (this.patrolWaitTimer <= 0) {
                    this._pickPatrolTarget();
                }
            } else if (this.patrolTarget) {
                const ptDx = this.patrolTarget.x - this.group.position.x;
                const ptDz = this.patrolTarget.z - this.group.position.z;
                const ptDist = Math.sqrt(ptDx * ptDx + ptDz * ptDz);

                if (ptDist < 0.5) {
                    // Reached target, wait
                    this.patrolWaitTimer = 1 + Math.random();
                } else {
                    moveDir.set(ptDx, 0, ptDz).normalize();
                    const step = this.speed * 0.5 * deltaTime;
                    this.group.position.x += moveDir.x * step;
                    this.group.position.z += moveDir.z * step;
                }
            }
        }

        // Face movement direction
        if (moveDir.lengthSq() > 0.001) {
            const angle = Math.atan2(moveDir.x, moveDir.z);
            this.group.rotation.y = angle;
        }

        // Undulating body animation
        for (let i = 1; i < this.segments.length; i++) {
            const offset = Math.sin(this.time * 4 - i * 0.8) * 0.12;
            this.segments[i].position.x = offset;
        }

        // Keep within terrain bounds
        this.group.position.x = Math.max(-90, Math.min(90, this.group.position.x));
        this.group.position.z = Math.max(-90, Math.min(90, this.group.position.z));

        return distToPlayer <= this.attackRange;
    }

    takeDamage(amount) {
        if (this.dead) return;
        this.hp -= amount;
        this._flashRed();
        this._updateHealthBar();
        if (this.hp <= 0) {
            this.die();
        }
    }

    _flashRed() {
        this.flashTimer = 0.15;
        const red = new THREE.Color(0xff0000);
        for (const segment of this.segments) {
            segment.material.color.copy(red);
        }
    }

    _restoreColors() {
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].material.color.copy(this.originalColors[i]);
        }
    }

    die() {
        this.scene.remove(this.group);
        this.dead = true;
    }

    isDead() {
        return this.dead;
    }
}
