import * as THREE from 'three';

export class Spider {
    constructor(scene, x, z) {
        this.scene = scene;
        this.hp = 80;
        this.maxHp = 80;
        this.speed = 4;
        this.damage = 15;
        this.detectionRange = 18;
        this.attackRange = 2;
        this.dead = false;
        this.time = 0;
        this.coinAwarded = false;

        this.patrolTarget = null;
        this.patrolWaitTimer = 0;
        this.chasing = false;
        this.flashTimer = 0;

        this.group = new THREE.Group();
        this.legs = [];
        this._buildBody();
        this._buildHealthBar();

        this.group.position.set(x, 0.5, z);
        scene.add(this.group);
        this._pickPatrolTarget();
    }

    _buildBody() {
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
        this.bodyMat = bodyMat;

        // Abdomen (gros, arrière)
        const abdomenGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const abdomen = new THREE.Mesh(abdomenGeo, bodyMat);
        abdomen.scale.set(1, 0.7, 1.2);
        abdomen.position.set(0, 0, -0.5);
        this.group.add(abdomen);

        // Thorax (plus petit, avant)
        const thoraxGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const thorax = new THREE.Mesh(thoraxGeo, bodyMat);
        thorax.position.set(0, 0.05, 0.2);
        this.group.add(thorax);

        // Tête
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 0.1, 0.55);
        this.group.add(head);

        // Yeux rouges (8 yeux)
        const eyeMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x880000 });
        const eyePositions = [
            [-0.08, 0.15, 0.7], [0.08, 0.15, 0.7],
            [-0.14, 0.1, 0.65], [0.14, 0.1, 0.65],
            [-0.05, 0.2, 0.68], [0.05, 0.2, 0.68],
        ];
        for (const pos of eyePositions) {
            const eyeGeo = new THREE.SphereGeometry(0.03, 4, 4);
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(...pos);
            this.group.add(eye);
        }

        // 8 pattes
        const legMat = new THREE.MeshLambertMaterial({ color: 0x2a1500 });
        const legAngles = [-0.8, -0.4, 0.4, 0.8];
        for (let side = -1; side <= 1; side += 2) {
            for (const angle of legAngles) {
                const legGroup = new THREE.Group();

                // Segment supérieur
                const upperGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.7, 4);
                const upper = new THREE.Mesh(upperGeo, legMat);
                upper.position.y = 0.2;
                upper.rotation.z = side * 1.2;
                legGroup.add(upper);

                // Segment inférieur
                const lowerGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.6, 4);
                const lower = new THREE.Mesh(lowerGeo, legMat);
                lower.position.set(side * 0.55, -0.15, 0);
                lower.rotation.z = side * 0.3;
                legGroup.add(lower);

                legGroup.position.set(side * 0.15, 0, angle * 0.4);
                this.group.add(legGroup);
                this.legs.push(legGroup);
            }
        }
    }

    _buildHealthBar() {
        this.hbCanvas = document.createElement('canvas');
        this.hbCanvas.width = 64;
        this.hbCanvas.height = 12;
        this.hbTexture = new THREE.CanvasTexture(this.hbCanvas);
        this.hbTexture.minFilter = THREE.LinearFilter;

        const mat = new THREE.SpriteMaterial({ map: this.hbTexture, depthTest: false });
        this.healthBar = new THREE.Sprite(mat);
        this.healthBar.scale.set(1.4, 0.3, 1);
        this.healthBar.position.set(0, 1.0, 0);
        this.group.add(this.healthBar);
        this._updateHealthBar();
    }

    _updateHealthBar() {
        const ctx = this.hbCanvas.getContext('2d');
        const w = this.hbCanvas.width;
        const h = this.hbCanvas.height;
        const ratio = Math.max(0, this.hp / this.maxHp);

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);

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
        const dist = 3 + Math.random() * 7;
        this.patrolTarget = new THREE.Vector3(
            this.group.position.x + Math.cos(angle) * dist,
            this.group.position.y,
            this.group.position.z + Math.sin(angle) * dist
        );
        this.patrolTarget.x = Math.max(-90, Math.min(90, this.patrolTarget.x));
        this.patrolTarget.z = Math.max(-90, Math.min(90, this.patrolTarget.z));
    }

    update(deltaTime, playerPosition) {
        if (this.dead) return false;
        this.time += deltaTime;

        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) this.bodyMat.color.set(0x1a0a00);
        }

        const dx = playerPosition.x - this.group.position.x;
        const dz = playerPosition.z - this.group.position.z;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);
        this.chasing = distToPlayer <= this.detectionRange;

        let moveDir = new THREE.Vector3();

        if (this.chasing) {
            moveDir.set(dx, 0, dz).normalize();
            const step = this.speed * deltaTime;
            this.group.position.x += moveDir.x * step;
            this.group.position.z += moveDir.z * step;
        } else {
            if (this.patrolWaitTimer > 0) {
                this.patrolWaitTimer -= deltaTime;
                if (this.patrolWaitTimer <= 0) this._pickPatrolTarget();
            } else if (this.patrolTarget) {
                const ptDx = this.patrolTarget.x - this.group.position.x;
                const ptDz = this.patrolTarget.z - this.group.position.z;
                const ptDist = Math.sqrt(ptDx * ptDx + ptDz * ptDz);
                if (ptDist < 0.5) {
                    this.patrolWaitTimer = 1 + Math.random();
                } else {
                    moveDir.set(ptDx, 0, ptDz).normalize();
                    const step = this.speed * 0.5 * deltaTime;
                    this.group.position.x += moveDir.x * step;
                    this.group.position.z += moveDir.z * step;
                }
            }
        }

        if (moveDir.lengthSq() > 0.001) {
            this.group.rotation.y = Math.atan2(moveDir.x, moveDir.z);
        }

        // Animation des pattes
        for (let i = 0; i < this.legs.length; i++) {
            this.legs[i].rotation.x = Math.sin(this.time * 8 + i * 0.8) * 0.3;
        }

        this.group.position.x = Math.max(-90, Math.min(90, this.group.position.x));
        this.group.position.z = Math.max(-90, Math.min(90, this.group.position.z));

        return distToPlayer <= this.attackRange;
    }

    takeDamage(amount) {
        if (this.dead) return;
        this.hp -= amount;
        this.flashTimer = 0.15;
        this.bodyMat.color.set(0xff0000);
        this._updateHealthBar();
        if (this.hp <= 0) this.die();
    }

    die() {
        this.scene.remove(this.group);
        this.dead = true;
    }

    isDead() { return this.dead; }
}
