import * as THREE from 'three';

export class Crocodile {
    constructor(scene, x, z) {
        this.scene = scene;
        this.monsterType = 'crocodile';
        this.hp = 250;
        this.maxHp = 250;
        this.speed = 2;
        this.damage = 25;
        this.detectionRange = 12;
        this.attackRange = 2.5;
        this.dead = false;
        this.time = 0;
        this.coinAwarded = false;

        this.patrolTarget = null;
        this.patrolWaitTimer = 0;
        this.chasing = false;
        this.flashTimer = 0;

        this.group = new THREE.Group();
        this._buildBody();
        this._buildHealthBar();

        this.group.position.set(x, 0.2, z);
        scene.add(this.group);
        this._pickPatrolTarget();
    }

    _buildBody() {
        this.skinMat = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });
        const bellyMat = new THREE.MeshLambertMaterial({ color: 0x6a7a4a });

        // Corps principal (long et plat)
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.3, 2.5);
        const body = new THREE.Mesh(bodyGeo, this.skinMat);
        body.position.set(0, 0.15, 0);
        this.group.add(body);

        // Ventre
        const bellyGeo = new THREE.BoxGeometry(0.5, 0.1, 2.3);
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.position.set(0, 0.02, 0);
        this.group.add(belly);

        // Tête (museau long)
        const headGeo = new THREE.BoxGeometry(0.5, 0.25, 1.0);
        const head = new THREE.Mesh(headGeo, this.skinMat);
        head.position.set(0, 0.2, 1.7);
        this.group.add(head);

        // Mâchoire inférieure
        const jawGeo = new THREE.BoxGeometry(0.45, 0.1, 0.9);
        const jaw = new THREE.Mesh(jawGeo, bellyMat);
        jaw.position.set(0, 0.05, 1.65);
        this.group.add(jaw);
        this.jaw = jaw;

        // Dents
        const toothMat = new THREE.MeshLambertMaterial({ color: 0xffffee });
        for (let i = 0; i < 6; i++) {
            for (let side = -1; side <= 1; side += 2) {
                const toothGeo = new THREE.ConeGeometry(0.02, 0.06, 4);
                const tooth = new THREE.Mesh(toothGeo, toothMat);
                tooth.position.set(side * 0.2, 0.15, 1.3 + i * 0.15);
                tooth.rotation.x = Math.PI;
                this.group.add(tooth);
            }
        }

        // Yeux jaunes
        const eyeMat = new THREE.MeshLambertMaterial({ color: 0xddcc00, emissive: 0x554400 });
        for (let side = -1; side <= 1; side += 2) {
            const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(side * 0.2, 0.38, 1.5);
            this.group.add(eye);

            // Pupille
            const pupilGeo = new THREE.SphereGeometry(0.03, 4, 4);
            const pupilMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const pupil = new THREE.Mesh(pupilGeo, pupilMat);
            pupil.position.set(side * 0.2, 0.38, 1.56);
            this.group.add(pupil);
        }

        // Queue (segments)
        this.tailSegments = [];
        let tailZ = -1.25;
        for (let i = 0; i < 5; i++) {
            const size = 0.5 - i * 0.08;
            const segGeo = new THREE.BoxGeometry(size, 0.2 - i * 0.02, 0.5);
            const seg = new THREE.Mesh(segGeo, this.skinMat);
            seg.position.set(0, 0.12, tailZ - i * 0.45);
            this.group.add(seg);
            this.tailSegments.push(seg);
        }

        // 4 pattes courtes
        const legMat = new THREE.MeshLambertMaterial({ color: 0x2a4a1a });
        const legPositions = [
            [-0.35, 0, 0.7], [0.35, 0, 0.7],
            [-0.35, 0, -0.5], [0.35, 0, -0.5],
        ];
        this.legMeshes = [];
        for (const pos of legPositions) {
            const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.25, 6);
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(...pos);
            this.group.add(leg);
            this.legMeshes.push(leg);
        }

        // Bosses/écailles sur le dos
        for (let i = 0; i < 8; i++) {
            const bumpGeo = new THREE.SphereGeometry(0.08, 4, 4);
            const bump = new THREE.Mesh(bumpGeo, this.skinMat);
            bump.scale.y = 0.5;
            bump.position.set(
                (Math.random() - 0.5) * 0.3,
                0.32,
                -0.8 + i * 0.3
            );
            this.group.add(bump);
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
        this.healthBar.scale.set(1.6, 0.3, 1);
        this.healthBar.position.set(0, 1.0, 0.5);
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
            if (this.flashTimer <= 0) this.skinMat.color.set(0x3a5a2a);
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

        // Animation queue ondulante
        for (let i = 0; i < this.tailSegments.length; i++) {
            this.tailSegments[i].position.x = Math.sin(this.time * 3 - i * 0.6) * 0.15;
        }

        // Animation mâchoire quand proche du joueur
        if (distToPlayer < this.attackRange * 1.5) {
            this.jaw.position.y = 0.05 - Math.abs(Math.sin(this.time * 6)) * 0.08;
        } else {
            this.jaw.position.y = 0.05;
        }

        // Animation pattes
        for (let i = 0; i < this.legMeshes.length; i++) {
            this.legMeshes[i].rotation.x = Math.sin(this.time * 4 + i * 1.5) * 0.2;
        }

        this.group.position.x = Math.max(-90, Math.min(90, this.group.position.x));
        this.group.position.z = Math.max(-90, Math.min(90, this.group.position.z));

        return distToPlayer <= this.attackRange;
    }

    takeDamage(amount) {
        if (this.dead) return;
        this.hp -= amount;
        this.flashTimer = 0.15;
        this.skinMat.color.set(0xff0000);
        this._updateHealthBar();
        if (this.hp <= 0) this.die();
    }

    die() {
        this.scene.remove(this.group);
        this.dead = true;
    }

    isDead() { return this.dead; }
}
