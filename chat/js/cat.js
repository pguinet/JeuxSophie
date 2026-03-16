import * as THREE from 'three';

export class Cat {
    constructor(scene, color = 0xe87e24) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.state = 'idle';
        this.targetPos = null;
        this.walkSpeed = 1.5;
        this.walkTime = 0;
        this.idleTimer = 0;
        this.nextWanderTime = 3;
        this.animationTimer = 0;

        const furMat = new THREE.MeshStandardMaterial({ color });
        this.furMat = furMat;

        // Corps
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.8), furMat);
        body.position.y = 0.5;
        this.group.add(body);
        this.body = body;

        // Tête
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.4), furMat);
        head.position.set(0, 0.65, -0.55);
        this.group.add(head);
        this.head = head;

        // Oreilles
        const earMat = new THREE.MeshStandardMaterial({ color });
        const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa });

        const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), earMat);
        leftEar.position.set(-0.13, 0.95, -0.55);
        this.group.add(leftEar);
        this.leftEar = leftEar;

        const leftEarInner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), earInnerMat);
        leftEarInner.position.set(-0.13, 0.93, -0.53);
        this.group.add(leftEarInner);

        const rightEar = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), earMat);
        rightEar.position.set(0.13, 0.95, -0.55);
        this.group.add(rightEar);
        this.rightEar = rightEar;

        const rightEarInner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), earInnerMat);
        rightEarInner.position.set(0.13, 0.93, -0.53);
        this.group.add(rightEarInner);

        // Yeux
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xeeffaa });

        const leftEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeWhiteMat);
        leftEyeWhite.position.set(-0.1, 0.7, -0.75);
        this.group.add(leftEyeWhite);
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
        leftEye.position.set(-0.1, 0.7, -0.78);
        this.group.add(leftEye);

        const rightEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeWhiteMat);
        rightEyeWhite.position.set(0.1, 0.7, -0.75);
        this.group.add(rightEyeWhite);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
        rightEye.position.set(0.1, 0.7, -0.78);
        this.group.add(rightEye);

        // Nez
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xff9999 });
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), noseMat);
        nose.position.set(0, 0.62, -0.78);
        this.group.add(nose);

        // Moustaches (lignes fines)
        const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -1; i <= 1; i++) {
                const whisker = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.01), whiskerMat);
                whisker.position.set(side * 0.25, 0.6 + i * 0.03, -0.7);
                this.group.add(whisker);
            }
        }

        // Queue
        this.tailSegments = [];
        const tailMat = new THREE.MeshStandardMaterial({ color });
        for (let i = 0; i < 3; i++) {
            const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.04 - i * 0.008, 0.04 - i * 0.005, 0.3, 6), tailMat);
            seg.position.set(0, 0.55 + i * 0.15, 0.4 + i * 0.15);
            seg.rotation.x = -0.3 - i * 0.15;
            this.group.add(seg);
            this.tailSegments.push(seg);
        }

        // Pattes
        const legGeo = new THREE.BoxGeometry(0.12, 0.3, 0.12);

        this.frontLeftLeg = new THREE.Group();
        this.frontLeftLeg.position.set(-0.15, 0.3, -0.3);
        const flLeg = new THREE.Mesh(legGeo, furMat);
        flLeg.position.y = -0.15;
        this.frontLeftLeg.add(flLeg);
        this.group.add(this.frontLeftLeg);

        this.frontRightLeg = new THREE.Group();
        this.frontRightLeg.position.set(0.15, 0.3, -0.3);
        const frLeg = new THREE.Mesh(legGeo, furMat);
        frLeg.position.y = -0.15;
        this.frontRightLeg.add(frLeg);
        this.group.add(this.frontRightLeg);

        this.backLeftLeg = new THREE.Group();
        this.backLeftLeg.position.set(-0.15, 0.3, 0.3);
        const blLeg = new THREE.Mesh(legGeo, furMat);
        blLeg.position.y = -0.15;
        this.backLeftLeg.add(blLeg);
        this.group.add(this.backLeftLeg);

        this.backRightLeg = new THREE.Group();
        this.backRightLeg.position.set(0.15, 0.3, 0.3);
        const brLeg = new THREE.Mesh(legGeo, furMat);
        brLeg.position.y = -0.15;
        this.backRightLeg.add(brLeg);
        this.group.add(this.backRightLeg);

        scene.add(this.group);
    }

    setColor(hex) {
        this.furMat.color.setHex(hex);
        // Mettre à jour oreilles et queue
        for (const seg of this.tailSegments) {
            seg.material.color.setHex(hex);
        }
        this.leftEar.material.color.setHex(hex);
        this.rightEar.material.color.setHex(hex);
    }

    _walkAnimation(delta) {
        this.walkTime += delta * 8;
        const swing = Math.sin(this.walkTime) * 0.4;
        this.frontLeftLeg.rotation.x = swing;
        this.frontRightLeg.rotation.x = -swing;
        this.backLeftLeg.rotation.x = -swing;
        this.backRightLeg.rotation.x = swing;
    }

    _resetLegs() {
        this.walkTime = 0;
        this.frontLeftLeg.rotation.x = 0;
        this.frontRightLeg.rotation.x = 0;
        this.backLeftLeg.rotation.x = 0;
        this.backRightLeg.rotation.x = 0;
    }

    _tailWag(delta) {
        this.animationTimer += delta * 3;
        const wag = Math.sin(this.animationTimer) * 0.3;
        for (let i = 0; i < this.tailSegments.length; i++) {
            this.tailSegments[i].rotation.z = wag * (i + 1) * 0.5;
        }
    }

    _faceTarget() {
        if (!this.targetPos) return;
        const dx = this.targetPos.x - this.group.position.x;
        const dz = this.targetPos.z - this.group.position.z;
        this.group.rotation.y = Math.atan2(dx, dz);
    }

    walkTo(x, z) {
        this.targetPos = new THREE.Vector3(x, 0, z);
        this.state = 'walking';
    }

    update(delta) {
        this._tailWag(delta);

        if (this.state === 'walking' && this.targetPos) {
            this._faceTarget();
            this._walkAnimation(delta);

            const dx = this.targetPos.x - this.group.position.x;
            const dz = this.targetPos.z - this.group.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 0.2) {
                this._resetLegs();
                this.targetPos = null;
                if (this._onArrival) {
                    const cb = this._onArrival;
                    this._onArrival = null;
                    cb();
                } else {
                    this.state = 'idle';
                }
                this.idleTimer = 0;
                this.nextWanderTime = 3 + Math.random() * 5;
            } else {
                const speed = this.walkSpeed * delta;
                this.group.position.x += (dx / dist) * speed;
                this.group.position.z += (dz / dist) * speed;
            }
        }

        if (this.state === 'sleeping') {
            // Corps au sol
            this.body.position.y = 0.25;
            this.head.position.y = 0.3;
            this.head.position.z = -0.55;
            return;
        } else {
            this.body.position.y = 0.5;
            this.head.position.y = 0.65;
        }

        if (this.state === 'idle') {
            this._resetLegs();
            this.idleTimer += delta;
            if (this.idleTimer >= this.nextWanderTime) {
                // Se balader aléatoirement
                const x = -8 + Math.random() * 16;
                const z = -8 + Math.random() * 16;
                this.walkTo(x, z);
            }
        }
    }

    // Actions
    playSleep() {
        this.state = 'sleeping';
        this._resetLegs();
        setTimeout(() => {
            if (this.state === 'sleeping') {
                this.state = 'idle';
                this.idleTimer = 0;
            }
        }, 5000);
    }

    playEat(targetX, targetZ) {
        this.walkTo(targetX, targetZ);
        this.state = 'walking';
        // L'animation de manger se déclenche quand le chat arrive
        this._onArrival = () => {
            this.state = 'eating';
            this.animationTimer = 0;
            setTimeout(() => {
                this.state = 'idle';
                this.idleTimer = 0;
            }, 2000);
        };
    }

    playPet() {
        this.state = 'idle';
        // Petit saut de joie
        const startY = this.group.position.y;
        let t = 0;
        const jump = () => {
            t += 0.05;
            this.group.position.y = startY + Math.sin(t * Math.PI) * 0.3;
            if (t < 1) requestAnimationFrame(jump);
            else this.group.position.y = startY;
        };
        jump();
    }

    playWash() {
        this.state = 'washing';
        this.animationTimer = 0;
        setTimeout(() => {
            this.state = 'idle';
            this.idleTimer = 0;
        }, 3000);
    }
}
