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
        this.breathTimer = 0;

        const furMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.0 });
        this.furMat = furMat;

        // Ventre (blanc/crème, partie inférieure)
        const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfff5e6, roughness: 0.9 });

        // ===== CORPS =====
        // Corps principal arrondi (ellipsoïde)
        const bodyGeo = new THREE.SphereGeometry(1, 16, 12);
        bodyGeo.scale(0.3, 0.25, 0.45);
        const body = new THREE.Mesh(bodyGeo, furMat);
        body.position.y = 0.45;
        this.group.add(body);
        this.body = body;

        // Ventre (demi-sphère dessous)
        const bellyGeo = new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.6);
        bellyGeo.scale(0.28, 0.22, 0.4);
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.position.set(0, 0.38, 0);
        belly.rotation.x = Math.PI;
        this.group.add(belly);

        // Poitrine (bosse avant)
        const chestGeo = new THREE.SphereGeometry(0.18, 10, 10);
        const chest = new THREE.Mesh(chestGeo, bellyMat);
        chest.position.set(0, 0.4, -0.25);
        this.group.add(chest);

        // ===== TÊTE =====
        // Tête ronde (plus grosse = plus mignon)
        const headGeo = new THREE.SphereGeometry(0.28, 16, 14);
        headGeo.scale(1, 0.9, 0.95);
        const head = new THREE.Mesh(headGeo, furMat);
        head.position.set(0, 0.7, -0.45);
        this.group.add(head);
        this.head = head;

        // Joues (rondeurs sur les côtés)
        const cheekGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const leftCheek = new THREE.Mesh(cheekGeo, furMat);
        leftCheek.position.set(-0.15, 0.62, -0.6);
        this.group.add(leftCheek);
        const rightCheek = new THREE.Mesh(cheekGeo, furMat);
        rightCheek.position.set(0.15, 0.62, -0.6);
        this.group.add(rightCheek);

        // Museau (petite bosse blanche)
        const muzzleGeo = new THREE.SphereGeometry(0.1, 10, 10);
        muzzleGeo.scale(1, 0.7, 0.8);
        const muzzle = new THREE.Mesh(muzzleGeo, bellyMat);
        muzzle.position.set(0, 0.6, -0.7);
        this.group.add(muzzle);

        // ===== OREILLES =====
        const earMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 0.8 });

        // Oreille gauche (triangle arrondi)
        this.leftEarGroup = new THREE.Group();
        this.leftEarGroup.position.set(-0.14, 0.95, -0.4);
        this.leftEarGroup.rotation.z = 0.15;
        const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 6), earMat);
        this.leftEarGroup.add(leftEar);
        const leftEarInner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 6), earInnerMat);
        leftEarInner.position.y = 0.01;
        leftEarInner.position.z = -0.01;
        this.leftEarGroup.add(leftEarInner);
        this.group.add(this.leftEarGroup);
        this.leftEar = leftEar;

        // Oreille droite
        this.rightEarGroup = new THREE.Group();
        this.rightEarGroup.position.set(0.14, 0.95, -0.4);
        this.rightEarGroup.rotation.z = -0.15;
        const rightEar = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 6), earMat);
        this.rightEarGroup.add(rightEar);
        const rightEarInner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 6), earInnerMat);
        rightEarInner.position.y = 0.01;
        rightEarInner.position.z = -0.01;
        this.rightEarGroup.add(rightEarInner);
        this.group.add(this.rightEarGroup);
        this.rightEar = rightEar;

        // ===== YEUX =====
        // Gros yeux ronds (style kawaii)
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f0 });
        const irisMat = new THREE.MeshStandardMaterial({ color: 0x44aa44 }); // Yeux verts
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const shineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });

        // Oeil gauche
        const lEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), eyeWhiteMat);
        lEyeWhite.position.set(-0.11, 0.73, -0.68);
        this.group.add(lEyeWhite);
        const lIris = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), irisMat);
        lIris.position.set(-0.11, 0.73, -0.74);
        this.group.add(lIris);
        const lPupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), pupilMat);
        lPupil.position.set(-0.11, 0.73, -0.77);
        this.group.add(lPupil);
        // Reflet dans l'oeil
        const lShine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), shineMat);
        lShine.position.set(-0.095, 0.755, -0.78);
        this.group.add(lShine);

        // Oeil droit
        const rEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), eyeWhiteMat);
        rEyeWhite.position.set(0.11, 0.73, -0.68);
        this.group.add(rEyeWhite);
        const rIris = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), irisMat);
        rIris.position.set(0.11, 0.73, -0.74);
        this.group.add(rIris);
        const rPupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), pupilMat);
        rPupil.position.set(0.11, 0.73, -0.77);
        this.group.add(rPupil);
        const rShine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), shineMat);
        rShine.position.set(0.125, 0.755, -0.78);
        this.group.add(rShine);

        // ===== NEZ =====
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xee8888 });
        // Petit triangle inversé
        const noseShape = new THREE.Shape();
        noseShape.moveTo(0, 0);
        noseShape.lineTo(0.03, 0.04);
        noseShape.lineTo(-0.03, 0.04);
        noseShape.closePath();
        const noseGeo = new THREE.ExtrudeGeometry(noseShape, { depth: 0.02, bevelEnabled: false });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, 0.6, -0.76);
        nose.rotation.y = Math.PI;
        this.group.add(nose);

        // Bouche (petite ligne sous le nez)
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x553333 });
        const mouthLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.005), mouthMat);
        mouthLeft.position.set(-0.025, 0.575, -0.76);
        mouthLeft.rotation.z = -0.3;
        this.group.add(mouthLeft);
        const mouthRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.005), mouthMat);
        mouthRight.position.set(0.025, 0.575, -0.76);
        mouthRight.rotation.z = 0.3;
        this.group.add(mouthRight);

        // ===== MOUSTACHES =====
        const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -1; i <= 1; i++) {
                const whisker = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.003, 0.001, 0.25, 4),
                    whiskerMat
                );
                whisker.rotation.z = Math.PI / 2 * side + i * 0.15 * side;
                whisker.position.set(side * 0.2, 0.6 + i * 0.02, -0.67);
                this.group.add(whisker);
            }
        }

        // ===== QUEUE =====
        this.tailGroup = new THREE.Group();
        this.tailGroup.position.set(0, 0.45, 0.4);
        this.tailSegments = [];
        const tailMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });

        for (let i = 0; i < 5; i++) {
            const radius = 0.04 - i * 0.005;
            const seg = new THREE.Mesh(
                new THREE.SphereGeometry(radius, 8, 6),
                tailMat
            );
            seg.position.set(0, i * 0.08, i * 0.08);
            this.tailGroup.add(seg);
            this.tailSegments.push(seg);
        }
        // Bout de la queue (petite boule)
        const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), tailMat);
        tailTip.position.set(0, 0.4, 0.4);
        this.tailGroup.add(tailTip);
        this.tailSegments.push(tailTip);

        this.group.add(this.tailGroup);

        // ===== PATTES =====
        // Pattes arrondies avec coussinets
        const padMat = new THREE.MeshStandardMaterial({ color: 0xffbbbb });

        const makeLeg = (x, z) => {
            const leg = new THREE.Group();
            leg.position.set(x, 0.25, z);

            // Cuisse arrondie
            const thigh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.055, 0.25, 8),
                furMat
            );
            thigh.position.y = -0.05;
            leg.add(thigh);

            // Patte (pied arrondi)
            const paw = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 8, 6),
                furMat
            );
            paw.scale.set(1, 0.6, 1.2);
            paw.position.set(0, -0.18, -0.01);
            leg.add(paw);

            // Coussinet
            const pad = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 6, 6),
                padMat
            );
            pad.position.set(0, -0.2, 0);
            leg.add(pad);

            return leg;
        };

        this.frontLeftLeg = makeLeg(-0.15, -0.28);
        this.group.add(this.frontLeftLeg);
        this.frontRightLeg = makeLeg(0.15, -0.28);
        this.group.add(this.frontRightLeg);
        this.backLeftLeg = makeLeg(-0.15, 0.28);
        this.group.add(this.backLeftLeg);
        this.backRightLeg = makeLeg(0.15, 0.28);
        this.group.add(this.backRightLeg);

        // Échelle globale
        this.group.scale.set(1.1, 1.1, 1.1);

        scene.add(this.group);
    }

    setColor(hex) {
        this.furMat.color.setHex(hex);
        for (const seg of this.tailSegments) {
            seg.material.color.setHex(hex);
        }
        this.leftEar.material.color.setHex(hex);
        this.rightEar.material.color.setHex(hex);
    }

    _walkAnimation(delta) {
        this.walkTime += delta * 8;
        const swing = Math.sin(this.walkTime) * 0.35;
        this.frontLeftLeg.rotation.x = swing;
        this.frontRightLeg.rotation.x = -swing;
        this.backLeftLeg.rotation.x = -swing;
        this.backRightLeg.rotation.x = swing;
        // Léger balancement du corps
        this.body.rotation.z = Math.sin(this.walkTime * 0.5) * 0.03;
    }

    _resetLegs() {
        this.walkTime = 0;
        this.frontLeftLeg.rotation.x = 0;
        this.frontRightLeg.rotation.x = 0;
        this.backLeftLeg.rotation.x = 0;
        this.backRightLeg.rotation.x = 0;
        this.body.rotation.z = 0;
    }

    _tailWag(delta) {
        this.animationTimer += delta * 3;
        const wag = Math.sin(this.animationTimer) * 0.4;
        this.tailGroup.rotation.x = -0.5 + Math.sin(this.animationTimer * 0.5) * 0.1;
        this.tailGroup.rotation.z = wag;
    }

    _breathe(delta) {
        this.breathTimer += delta * 2;
        const breath = Math.sin(this.breathTimer) * 0.01;
        this.body.scale.y = 1 + breath;
        this.body.scale.x = 1 - breath * 0.5;
    }

    _faceTarget() {
        if (!this.targetPos) return;
        const dx = this.targetPos.x - this.group.position.x;
        const dz = this.targetPos.z - this.group.position.z;
        // Le modèle fait face à -Z, donc on inverse
        const targetAngle = Math.atan2(-dx, -dz);
        // Rotation progressive (smooth)
        let diff = targetAngle - this.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.group.rotation.y += diff * 0.1;
    }

    // Vérifie si une position est valide (pas dans un mur)
    _isValidPos(x, z) {
        const margin = 0.3;
        // Limites extérieures
        if (x < -9.5 + margin) return false;
        if (x > 9.5 - margin) return false;
        if (z < -9.5 + margin) return false;
        if (z > 9.5 - margin) return false;

        // Mur de séparation maison/jardin à x=0
        // Ouverture (porte) entre z=-3 et z=3
        const prevX = this.group.position.x;
        if ((prevX < 0 && x >= -margin) || (prevX > 0 && x <= margin)) {
            // On essaie de traverser le mur à x=0
            if (z < -3 + margin || z > 3 - margin) {
                return false;
            }
        }

        return true;
    }

    walkTo(x, z) {
        // Clamp la destination dans les limites
        x = Math.max(-9.2, Math.min(9.2, x));
        z = Math.max(-9.2, Math.min(9.2, z));
        this.targetPos = new THREE.Vector3(x, 0, z);
        this.state = 'walking';
    }

    update(delta) {
        this._tailWag(delta);
        this._breathe(delta);

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
                const newX = this.group.position.x + (dx / dist) * speed;
                const newZ = this.group.position.z + (dz / dist) * speed;

                if (this._isValidPos(newX, newZ)) {
                    this.group.position.x = newX;
                    this.group.position.z = newZ;
                } else {
                    // Bloqué par un mur, arrêter
                    this._resetLegs();
                    this.targetPos = null;
                    this.state = 'idle';
                    this.idleTimer = 0;
                    this.nextWanderTime = 1 + Math.random() * 3;
                }
            }
        }

        if (this.state === 'sleeping') {
            this.body.position.y = 0.25;
            this.head.position.set(0, 0.3, -0.35);
            // Oreilles baissées
            this.leftEarGroup.rotation.z = 0.5;
            this.rightEarGroup.rotation.z = -0.5;
            return;
        } else {
            this.body.position.y = 0.45;
            this.head.position.set(0, 0.7, -0.45);
            this.leftEarGroup.rotation.z = 0.15;
            this.rightEarGroup.rotation.z = -0.15;
        }

        if (this.state === 'idle') {
            this._resetLegs();
            this.idleTimer += delta;
            if (this.idleTimer >= this.nextWanderTime) {
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
        this._onArrival = () => {
            this.state = 'eating';
            this.animationTimer = 0;
            // Animation tête qui monte et descend
            let eatCount = 0;
            const eatAnim = () => {
                eatCount++;
                this.head.position.y = 0.7 - Math.sin(eatCount * 0.3) * 0.15;
                if (eatCount < 20) requestAnimationFrame(eatAnim);
                else {
                    this.head.position.y = 0.7;
                    this.state = 'idle';
                    this.idleTimer = 0;
                }
            };
            eatAnim();
        };
    }

    playPet() {
        this.state = 'idle';
        // Petit saut de joie + ronronnement
        const startY = this.group.position.y;
        let t = 0;
        const jump = () => {
            t += 0.04;
            this.group.position.y = startY + Math.sin(t * Math.PI) * 0.2;
            // Queue qui remue vite
            this.tailGroup.rotation.z = Math.sin(t * 20) * 0.6;
            if (t < 1) requestAnimationFrame(jump);
            else {
                this.group.position.y = startY;
            }
        };
        jump();
    }

    playWash() {
        this.state = 'washing';
        this.animationTimer = 0;
        // Rotation douce sur place
        let washT = 0;
        const washAnim = () => {
            washT += 0.02;
            this.group.rotation.y += 0.05;
            this.body.scale.x = 1 + Math.sin(washT * 5) * 0.05;
            if (washT < 1) requestAnimationFrame(washAnim);
            else {
                this.body.scale.x = 1;
                this.state = 'idle';
                this.idleTimer = 0;
            }
        };
        washAnim();
    }
}
