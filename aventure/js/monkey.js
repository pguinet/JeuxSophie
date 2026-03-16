import * as THREE from 'three';

export class Monkey {
    constructor(scene, x, z) {
        this.scene = scene;
        this.monsterType = 'monkey';
        this.hp = 160;
        this.maxHp = 160;
        this.speed = 5;
        this.damage = 12;
        this.detectionRange = 20;
        this.attackRange = 8;
        this.dead = false;
        this.time = 0;
        this.coinAwarded = false;

        this.patrolTarget = null;
        this.patrolWaitTimer = 0;
        this.chasing = false;
        this.flashTimer = 0;
        this.throwCooldown = 0;

        this.group = new THREE.Group();
        this.arms = [];
        this._buildBody();
        this._buildHealthBar();

        this.group.position.set(x, 0.8, z);
        scene.add(this.group);
        this._pickPatrolTarget();

        // Projectiles lancés par le singe
        this.projectiles = [];
    }

    _buildBody() {
        this.furMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const faceMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });

        // Corps
        const bodyGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const body = new THREE.Mesh(bodyGeo, this.furMat);
        body.scale.set(1, 1.2, 0.9);
        body.position.set(0, 0, 0);
        this.group.add(body);

        // Tête
        const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const head = new THREE.Mesh(headGeo, this.furMat);
        head.position.set(0, 0.55, 0.1);
        this.group.add(head);

        // Visage
        const faceGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.set(0, 0.5, 0.25);
        face.scale.set(1, 0.9, 0.5);
        this.group.add(face);

        // Yeux
        const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        for (let side = -1; side <= 1; side += 2) {
            const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(side * 0.1, 0.58, 0.35);
            this.group.add(eye);
        }

        // Museau
        const muzzleGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const muzzle = new THREE.Mesh(muzzleGeo, faceMat);
        muzzle.position.set(0, 0.45, 0.38);
        muzzle.scale.set(1.2, 0.8, 0.8);
        this.group.add(muzzle);

        // Oreilles
        for (let side = -1; side <= 1; side += 2) {
            const earGeo = new THREE.SphereGeometry(0.1, 6, 6);
            const ear = new THREE.Mesh(earGeo, this.furMat);
            ear.position.set(side * 0.3, 0.6, 0);
            ear.scale.set(0.5, 1, 0.5);
            this.group.add(ear);
        }

        // Bras
        for (let side = -1; side <= 1; side += 2) {
            const armGroup = new THREE.Group();
            const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6);
            const arm = new THREE.Mesh(armGeo, this.furMat);
            arm.position.y = -0.2;
            armGroup.add(arm);
            armGroup.position.set(side * 0.4, 0.1, 0);
            this.group.add(armGroup);
            this.arms.push(armGroup);
        }

        // Jambes
        for (let side = -1; side <= 1; side += 2) {
            const legGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.4, 6);
            const leg = new THREE.Mesh(legGeo, this.furMat);
            leg.position.set(side * 0.2, -0.5, 0);
            this.group.add(leg);
        }

        // Queue
        const tailGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.8, 6);
        const tail = new THREE.Mesh(tailGeo, this.furMat);
        tail.position.set(0, 0.1, -0.5);
        tail.rotation.x = -0.8;
        this.group.add(tail);
        this.tail = tail;
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
        this.healthBar.position.set(0, 1.2, 0);
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

    _throwProjectile(playerPosition) {
        const projGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const projMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const proj = new THREE.Mesh(projGeo, projMat);
        proj.position.copy(this.group.position);
        proj.position.y += 0.5;

        const dir = new THREE.Vector3();
        dir.subVectors(playerPosition, proj.position).normalize();
        proj.userData.direction = dir;
        proj.userData.speed = 12;
        proj.userData.distance = 0;

        this.scene.add(proj);
        this.projectiles.push(proj);
    }

    update(deltaTime, playerPosition) {
        if (this.dead) return false;
        this.time += deltaTime;

        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) this.furMat.color.set(0x8B4513);
        }

        const dx = playerPosition.x - this.group.position.x;
        const dz = playerPosition.z - this.group.position.z;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);
        this.chasing = distToPlayer <= this.detectionRange;

        let moveDir = new THREE.Vector3();

        if (this.chasing) {
            // Le singe garde ses distances et lance des choses
            if (distToPlayer > 5) {
                moveDir.set(dx, 0, dz).normalize();
                const step = this.speed * deltaTime;
                this.group.position.x += moveDir.x * step;
                this.group.position.z += moveDir.z * step;
            } else if (distToPlayer < 3) {
                // Trop près, recule
                moveDir.set(-dx, 0, -dz).normalize();
                const step = this.speed * 0.7 * deltaTime;
                this.group.position.x += moveDir.x * step;
                this.group.position.z += moveDir.z * step;
            }

            // Lancer des projectiles
            this.throwCooldown -= deltaTime;
            if (this.throwCooldown <= 0 && distToPlayer <= this.attackRange) {
                this._throwProjectile(playerPosition);
                this.throwCooldown = 2;
                // Animation de lancer
                this.arms[0].rotation.x = -2;
            }
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

        // Animation bras
        for (let i = 0; i < this.arms.length; i++) {
            if (this.arms[i].rotation.x < -0.5) {
                this.arms[i].rotation.x += deltaTime * 4;
            } else {
                this.arms[i].rotation.x = Math.sin(this.time * 5 + i * Math.PI) * 0.4;
            }
        }

        // Animation queue
        this.tail.rotation.z = Math.sin(this.time * 3) * 0.4;

        // Mettre à jour les projectiles
        let playerHit = false;
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const move = p.userData.speed * deltaTime;
            p.position.addScaledVector(p.userData.direction, move);
            p.position.y -= deltaTime * 3; // gravité
            p.userData.distance += move;

            // Touche le joueur ?
            const pdx = p.position.x - playerPosition.x;
            const pdz = p.position.z - playerPosition.z;
            const pdy = p.position.y - playerPosition.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
            if (pdist < 1.0) {
                playerHit = true;
                this.scene.remove(p);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Trop loin ou touche le sol
            if (p.userData.distance > 30 || p.position.y < 0) {
                this.scene.remove(p);
                this.projectiles.splice(i, 1);
            }
        }

        this.group.position.x = Math.max(-90, Math.min(90, this.group.position.x));
        this.group.position.z = Math.max(-90, Math.min(90, this.group.position.z));

        return playerHit;
    }

    takeDamage(amount) {
        if (this.dead) return;
        this.hp -= amount;
        this.flashTimer = 0.15;
        this.furMat.color.set(0xff0000);
        this._updateHealthBar();
        if (this.hp <= 0) this.die();
    }

    die() {
        // Supprimer les projectiles
        for (const p of this.projectiles) {
            this.scene.remove(p);
        }
        this.projectiles.length = 0;
        this.scene.remove(this.group);
        this.dead = true;
    }

    isDead() { return this.dead; }
}
