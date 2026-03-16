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
        this.purring = false;

        // Matériaux
        const furMat = new THREE.MeshPhysicalMaterial({
            color,
            roughness: 0.85,
            metalness: 0.0,
            clearcoat: 0.1,
            clearcoatRoughness: 0.8,
        });
        this.furMat = furMat;

        // Couleur plus claire pour le ventre/poitrine/museau
        const lighterColor = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.6);
        const bellyMat = new THREE.MeshPhysicalMaterial({
            color: lighterColor,
            roughness: 0.9,
            clearcoat: 0.05,
        });
        this.bellyMat = bellyMat;

        // Couleur légèrement plus foncée pour les rayures/ombres
        const darkerColor = new THREE.Color(color).lerp(new THREE.Color(0x000000), 0.25);
        const stripeMat = new THREE.MeshPhysicalMaterial({
            color: darkerColor,
            roughness: 0.85,
            clearcoat: 0.1,
        });

        // ===== CORPS =====
        // Torse principal — forme de haricot douce
        const bodyGeo = new THREE.SphereGeometry(1, 24, 18);
        bodyGeo.scale(0.32, 0.28, 0.5);
        const body = new THREE.Mesh(bodyGeo, furMat);
        body.position.y = 0.48;
        this.group.add(body);
        this.body = body;

        // Arrière-train (légèrement plus large)
        const hipGeo = new THREE.SphereGeometry(0.26, 16, 14);
        hipGeo.scale(1.1, 0.9, 1);
        const hip = new THREE.Mesh(hipGeo, furMat);
        hip.position.set(0, 0.42, 0.2);
        this.group.add(hip);

        // Ventre crème/blanc
        const bellyGeo = new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.5);
        bellyGeo.scale(0.28, 0.24, 0.42);
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.position.set(0, 0.38, 0);
        belly.rotation.x = Math.PI;
        this.group.add(belly);

        // Poitrine douce
        const chestGeo = new THREE.SphereGeometry(0.2, 14, 12);
        chestGeo.scale(0.9, 0.85, 0.7);
        const chest = new THREE.Mesh(chestGeo, bellyMat);
        chest.position.set(0, 0.42, -0.28);
        this.group.add(chest);

        // Rayures sur le dos (3 lignes)
        for (let i = -1; i <= 1; i++) {
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.02, 0.25),
                stripeMat
            );
            stripe.position.set(i * 0.1, 0.62, 0);
            stripe.rotation.z = i * 0.1;
            this.group.add(stripe);
        }

        // ===== TÊTE =====
        const headGeo = new THREE.SphereGeometry(0.3, 24, 20);
        headGeo.scale(1.05, 0.95, 1);
        const head = new THREE.Mesh(headGeo, furMat);
        head.position.set(0, 0.72, -0.48);
        this.group.add(head);
        this.head = head;

        // Joues poilues (rondes, douces)
        const cheekGeo = new THREE.SphereGeometry(0.14, 12, 10);
        cheekGeo.scale(1, 0.8, 0.7);
        const leftCheek = new THREE.Mesh(cheekGeo, furMat);
        leftCheek.position.set(-0.18, 0.64, -0.6);
        this.group.add(leftCheek);
        const rightCheek = new THREE.Mesh(cheekGeo, furMat);
        rightCheek.position.set(0.18, 0.64, -0.6);
        this.group.add(rightCheek);

        // Museau (forme douce, blanc/crème)
        const muzzleGeo = new THREE.SphereGeometry(0.12, 14, 12);
        muzzleGeo.scale(1, 0.65, 0.75);
        const muzzle = new THREE.Mesh(muzzleGeo, bellyMat);
        muzzle.position.set(0, 0.62, -0.72);
        this.group.add(muzzle);

        // Menton
        const chinGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const chin = new THREE.Mesh(chinGeo, bellyMat);
        chin.position.set(0, 0.56, -0.7);
        this.group.add(chin);

        // Front (léger renflement)
        const foreheadGeo = new THREE.SphereGeometry(0.12, 10, 10);
        const forehead = new THREE.Mesh(foreheadGeo, furMat);
        forehead.position.set(0, 0.82, -0.52);
        this.group.add(forehead);

        // Rayure sur le front (M de chat tigré)
        const mStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.01), stripeMat);
        mStripe.position.set(0, 0.85, -0.6);
        this.group.add(mStripe);

        // ===== OREILLES =====
        const earMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.85 });
        const earInnerMat = new THREE.MeshPhysicalMaterial({ color: 0xffaaaa, roughness: 0.7 });
        const earFurMat = new THREE.MeshPhysicalMaterial({ color: lighterColor, roughness: 0.9 });

        const makeEar = (side) => {
            const earGroup = new THREE.Group();
            earGroup.position.set(side * 0.16, 0.98, -0.42);
            earGroup.rotation.z = side * 0.2;
            earGroup.rotation.x = -0.1;

            // Oreille extérieure (forme triangulaire arrondie)
            const outerGeo = new THREE.ConeGeometry(0.08, 0.2, 8);
            const outer = new THREE.Mesh(outerGeo, earMat);
            earGroup.add(outer);

            // Intérieur rose
            const innerGeo = new THREE.ConeGeometry(0.05, 0.14, 8);
            const inner = new THREE.Mesh(innerGeo, earInnerMat);
            inner.position.set(0, 0.01, -0.01);
            earGroup.add(inner);

            // Petites touffes de poils dans l'oreille
            const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), earFurMat);
            tuft.position.set(0, -0.05, -0.02);
            earGroup.add(tuft);

            return earGroup;
        };

        this.leftEarGroup = makeEar(-1);
        this.group.add(this.leftEarGroup);
        this.rightEarGroup = makeEar(1);
        this.group.add(this.rightEarGroup);
        this.leftEar = this.leftEarGroup.children[0];
        this.rightEar = this.rightEarGroup.children[0];

        // ===== YEUX =====
        const eyeWhiteMat = new THREE.MeshPhysicalMaterial({
            color: 0xfcfcf8,
            roughness: 0.3,
            clearcoat: 0.8,
        });
        const irisMat = new THREE.MeshPhysicalMaterial({
            color: 0x55bb55,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
        });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
        const shineMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.8,
        });

        const makeEye = (side) => {
            const eyeGroup = new THREE.Group();
            eyeGroup.position.set(side * 0.12, 0.74, -0.7);

            // Globe oculaire
            const white = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), eyeWhiteMat);
            eyeGroup.add(white);

            // Iris (aplati)
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 14), irisMat);
            iris.position.z = -0.035;
            iris.scale.z = 0.5;
            eyeGroup.add(iris);

            // Pupille (fente verticale de chat)
            const pupilShape = new THREE.Shape();
            pupilShape.ellipse(0, 0, 0.012, 0.04, 0, Math.PI * 2, false, 0);
            const pupilGeo = new THREE.ExtrudeGeometry(pupilShape, { depth: 0.01, bevelEnabled: false });
            const pupil = new THREE.Mesh(pupilGeo, pupilMat);
            pupil.position.set(0, 0, -0.065);
            eyeGroup.add(pupil);

            // Reflet lumineux (2 points)
            const shine1 = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), shineMat);
            shine1.position.set(side * 0.02, 0.025, -0.07);
            eyeGroup.add(shine1);

            const shine2 = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), shineMat);
            shine2.position.set(side * -0.015, -0.015, -0.07);
            eyeGroup.add(shine2);

            // Paupière supérieure
            const lidGeo = new THREE.SphereGeometry(0.08, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.35);
            const lidMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.85 });
            const lid = new THREE.Mesh(lidGeo, lidMat);
            lid.rotation.x = -0.2;
            lid.position.z = -0.005;
            eyeGroup.add(lid);

            return eyeGroup;
        };

        this.leftEye = makeEye(-1);
        this.group.add(this.leftEye);
        this.rightEye = makeEye(1);
        this.group.add(this.rightEye);

        // ===== NEZ =====
        const noseMat = new THREE.MeshPhysicalMaterial({
            color: 0xee8888,
            roughness: 0.4,
            clearcoat: 0.6,
        });
        // Nez en forme de coeur inversé
        const noseGeo = new THREE.SphereGeometry(0.035, 10, 8);
        noseGeo.scale(1.2, 0.8, 0.6);
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, 0.635, -0.8);
        this.group.add(nose);

        // Narines
        const narineMat = new THREE.MeshStandardMaterial({ color: 0xcc6666 });
        const leftNarine = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), narineMat);
        leftNarine.position.set(-0.015, 0.63, -0.82);
        this.group.add(leftNarine);
        const rightNarine = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), narineMat);
        rightNarine.position.set(0.015, 0.63, -0.82);
        this.group.add(rightNarine);

        // Bouche (ligne de philtrum + sourire)
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x664444 });
        // Philtrum (ligne verticale nez → bouche)
        const philtrum = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.005), mouthMat);
        philtrum.position.set(0, 0.6, -0.8);
        this.group.add(philtrum);
        // Sourire gauche
        const smileL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.005), mouthMat);
        smileL.position.set(-0.02, 0.58, -0.79);
        smileL.rotation.z = 0.25;
        this.group.add(smileL);
        // Sourire droit
        const smileR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.005), mouthMat);
        smileR.position.set(0.02, 0.58, -0.79);
        smileR.rotation.z = -0.25;
        this.group.add(smileR);

        // ===== MOUSTACHES =====
        const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -1; i <= 1; i++) {
                const length = 0.3 - Math.abs(i) * 0.05;
                const whisker = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.002, 0.001, length, 4),
                    whiskerMat
                );
                whisker.rotation.z = (Math.PI / 2) * side + i * 0.12 * side;
                whisker.rotation.y = i * 0.1;
                whisker.position.set(side * 0.18, 0.615 + i * 0.018, -0.72);
                this.group.add(whisker);
            }
        }

        // ===== QUEUE =====
        this.tailGroup = new THREE.Group();
        this.tailGroup.position.set(0, 0.48, 0.42);
        this.tailSegments = [];
        const tailMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.85, clearcoat: 0.1 });

        // Queue fluide avec 8 segments
        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const radius = 0.04 - t * 0.02;
            const seg = new THREE.Mesh(
                new THREE.SphereGeometry(radius, 8, 6),
                tailMat
            );
            seg.position.set(0, i * 0.06, i * 0.06);
            this.tailGroup.add(seg);
            this.tailSegments.push(seg);
        }

        // Bout de la queue (touffe plus épaisse)
        const tailTip = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 6),
            tailMat
        );
        tailTip.position.set(0, 0.5, 0.5);
        this.tailGroup.add(tailTip);
        this.tailSegments.push(tailTip);

        this.group.add(this.tailGroup);

        // ===== PATTES =====
        const padMat = new THREE.MeshPhysicalMaterial({
            color: 0xffbbcc,
            roughness: 0.5,
            clearcoat: 0.3,
        });
        const clawMat = new THREE.MeshStandardMaterial({ color: 0xeeddcc });

        const makeLeg = (x, z, isBack) => {
            const leg = new THREE.Group();
            leg.position.set(x, 0.28, z);

            // Cuisse (plus épaisse pour les pattes arrière)
            const thighRadius = isBack ? 0.07 : 0.06;
            const thigh = new THREE.Mesh(
                new THREE.CylinderGeometry(thighRadius * 0.9, thighRadius, 0.22, 10),
                furMat
            );
            thigh.position.y = -0.04;
            leg.add(thigh);

            // Cheville/tibia
            const shin = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8),
                furMat
            );
            shin.position.y = -0.16;
            leg.add(shin);

            // Patte (pied arrondi, légèrement ovale)
            const pawGeo = new THREE.SphereGeometry(0.06, 10, 8);
            pawGeo.scale(1.1, 0.5, 1.3);
            const paw = new THREE.Mesh(pawGeo, furMat);
            paw.position.set(0, -0.2, -0.02);
            leg.add(paw);

            // Coussinet principal (rose)
            const mainPad = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 6),
                padMat
            );
            mainPad.scale.y = 0.5;
            mainPad.position.set(0, -0.22, 0);
            leg.add(mainPad);

            // 3 petits coussinets (doigts)
            for (let d = -1; d <= 1; d++) {
                const toePad = new THREE.Mesh(
                    new THREE.SphereGeometry(0.012, 6, 6),
                    padMat
                );
                toePad.scale.y = 0.5;
                toePad.position.set(d * 0.02, -0.22, -0.03);
                leg.add(toePad);
            }

            return leg;
        };

        this.frontLeftLeg = makeLeg(-0.16, -0.3, false);
        this.group.add(this.frontLeftLeg);
        this.frontRightLeg = makeLeg(0.16, -0.3, false);
        this.group.add(this.frontRightLeg);
        this.backLeftLeg = makeLeg(-0.16, 0.28, true);
        this.group.add(this.backLeftLeg);
        this.backRightLeg = makeLeg(0.16, 0.28, true);
        this.group.add(this.backRightLeg);

        // Échelle
        this.group.scale.set(1.15, 1.15, 1.15);

        scene.add(this.group);
    }

    setColor(hex) {
        const color = new THREE.Color(hex);
        this.furMat.color.copy(color);
        const lighter = color.clone().lerp(new THREE.Color(0xffffff), 0.6);
        this.bellyMat.color.copy(lighter);
        for (const seg of this.tailSegments) {
            seg.material.color.copy(color);
        }
        this.leftEar.material.color.copy(color);
        this.rightEar.material.color.copy(color);
    }

    _walkAnimation(delta) {
        this.walkTime += delta * 8;
        const swing = Math.sin(this.walkTime) * 0.35;
        this.frontLeftLeg.rotation.x = swing;
        this.frontRightLeg.rotation.x = -swing;
        this.backLeftLeg.rotation.x = -swing * 1.1;
        this.backRightLeg.rotation.x = swing * 1.1;
        // Balancement naturel du corps
        this.body.rotation.z = Math.sin(this.walkTime * 0.5) * 0.025;
        this.body.position.y = 0.48 + Math.abs(Math.sin(this.walkTime)) * 0.01;
        // Tête légèrement en mouvement
        this.head.rotation.z = Math.sin(this.walkTime * 0.5) * -0.015;
    }

    _resetLegs() {
        this.walkTime = 0;
        this.frontLeftLeg.rotation.x = 0;
        this.frontRightLeg.rotation.x = 0;
        this.backLeftLeg.rotation.x = 0;
        this.backRightLeg.rotation.x = 0;
        this.body.rotation.z = 0;
        this.body.position.y = 0.48;
        this.head.rotation.z = 0;
    }

    _tailWag(delta) {
        this.animationTimer += delta * 2.5;
        // Queue avec mouvement sinusoïdal doux
        const baseWag = Math.sin(this.animationTimer) * 0.3;
        this.tailGroup.rotation.x = -0.6 + Math.sin(this.animationTimer * 0.4) * 0.1;
        this.tailGroup.rotation.z = baseWag * 0.6;
        // Chaque segment ondule avec un décalage
        for (let i = 0; i < this.tailSegments.length; i++) {
            const t = i / this.tailSegments.length;
            this.tailSegments[i].position.x = Math.sin(this.animationTimer + t * 2) * 0.03 * (i + 1);
        }
    }

    _breathe(delta) {
        this.breathTimer += delta * 1.8;
        const breath = Math.sin(this.breathTimer) * 0.015;
        this.body.scale.y = 1 + breath;
        this.body.scale.x = 1 - breath * 0.4;
        // Les oreilles bougent très légèrement
        this.leftEarGroup.rotation.x = -0.1 + Math.sin(this.breathTimer * 0.7 + 1) * 0.03;
        this.rightEarGroup.rotation.x = -0.1 + Math.sin(this.breathTimer * 0.7) * 0.03;
    }

    _idleAnimation(delta) {
        // Petits mouvements quand le chat est au repos
        this.head.rotation.y = Math.sin(this.animationTimer * 0.3) * 0.08;
        this.head.rotation.x = Math.sin(this.animationTimer * 0.2) * 0.03;
    }

    _faceTarget() {
        if (!this.targetPos) return;
        const dx = this.targetPos.x - this.group.position.x;
        const dz = this.targetPos.z - this.group.position.z;
        const targetAngle = Math.atan2(-dx, -dz);
        let diff = targetAngle - this.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.group.rotation.y += diff * 0.1;
    }

    _isValidPos(x, z) {
        const margin = 0.3;
        if (x < -9.5 + margin) return false;
        if (x > 9.5 - margin) return false;
        if (z < -9.5 + margin) return false;
        if (z > 9.5 - margin) return false;
        const prevX = this.group.position.x;
        if ((prevX < 0 && x >= -margin) || (prevX > 0 && x <= margin)) {
            if (z < -3 + margin || z > 3 - margin) {
                return false;
            }
        }
        return true;
    }

    walkTo(x, z) {
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
                    this._resetLegs();
                    this.targetPos = null;
                    this.state = 'idle';
                    this.idleTimer = 0;
                    this.nextWanderTime = 1 + Math.random() * 3;
                }
            }
        }

        if (this.state === 'sleeping') {
            this.body.position.y = 0.28;
            this.head.position.set(0, 0.32, -0.35);
            this.head.rotation.x = 0.15;
            // Oreilles baissées
            this.leftEarGroup.rotation.z = 0.5;
            this.rightEarGroup.rotation.z = -0.5;
            // Pattes repliées
            this.frontLeftLeg.rotation.x = -0.4;
            this.frontRightLeg.rotation.x = -0.4;
            this.backLeftLeg.rotation.x = 0.4;
            this.backRightLeg.rotation.x = 0.4;
            // Queue enroulée
            this.tailGroup.rotation.x = -0.2;
            this.tailGroup.rotation.z = 0.8;
            return;
        } else {
            this.body.position.y = 0.48;
            this.head.position.set(0, 0.72, -0.48);
            this.head.rotation.x = 0;
            this.leftEarGroup.rotation.z = -0.2;
            this.rightEarGroup.rotation.z = 0.2;
        }

        if (this.state === 'idle') {
            this._resetLegs();
            this._idleAnimation(delta);
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
            let eatCount = 0;
            const eatAnim = () => {
                eatCount++;
                // Tête descend vers la gamelle puis remonte
                this.head.position.y = 0.72 - Math.sin(eatCount * 0.25) * 0.18;
                this.head.rotation.x = Math.sin(eatCount * 0.25) * 0.2;
                // Queue contente
                this.tailGroup.rotation.z = Math.sin(eatCount * 0.5) * 0.4;
                if (eatCount < 25) requestAnimationFrame(eatAnim);
                else {
                    this.head.position.y = 0.72;
                    this.head.rotation.x = 0;
                    this.state = 'idle';
                    this.idleTimer = 0;
                }
            };
            eatAnim();
        };
    }

    playPet() {
        this.state = 'idle';
        const startY = this.group.position.y;
        let t = 0;
        const jump = () => {
            t += 0.035;
            this.group.position.y = startY + Math.sin(t * Math.PI) * 0.15;
            // Queue qui remue vite de bonheur
            this.tailGroup.rotation.z = Math.sin(t * 25) * 0.7;
            this.tailGroup.rotation.x = -0.8;
            // Oreilles dressées
            this.leftEarGroup.rotation.z = -0.3;
            this.rightEarGroup.rotation.z = 0.3;
            // Yeux plissés de plaisir
            this.leftEye.scale.y = 1 - Math.sin(t * Math.PI) * 0.5;
            this.rightEye.scale.y = 1 - Math.sin(t * Math.PI) * 0.5;
            if (t < 1) requestAnimationFrame(jump);
            else {
                this.group.position.y = startY;
                this.leftEye.scale.y = 1;
                this.rightEye.scale.y = 1;
            }
        };
        jump();
    }

    playWash() {
        this.state = 'washing';
        this.animationTimer = 0;
        let washT = 0;
        const washAnim = () => {
            washT += 0.018;
            // Lèche sa patte (patte avant monte vers la tête)
            this.frontRightLeg.rotation.x = -Math.sin(washT * 4) * 0.6;
            this.frontRightLeg.rotation.z = Math.sin(washT * 4) * 0.3;
            // Tête se penche vers la patte
            this.head.rotation.z = Math.sin(washT * 4) * 0.15;
            this.head.rotation.y = Math.sin(washT * 2) * 0.1;
            if (washT < 1.2) requestAnimationFrame(washAnim);
            else {
                this.frontRightLeg.rotation.x = 0;
                this.frontRightLeg.rotation.z = 0;
                this.head.rotation.z = 0;
                this.head.rotation.y = 0;
                this.state = 'idle';
                this.idleTimer = 0;
            }
        };
        washAnim();
    }
}
