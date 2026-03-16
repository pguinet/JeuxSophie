import * as THREE from 'three';

export class Player {
    constructor(scene) {
        this.group = new THREE.Group();

        // Corps (t-shirt bleu)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2266aa });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), bodyMat);
        body.position.y = 1.0;
        this.group.add(body);

        // Tête (peau)
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc88 });
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skinMat);
        head.position.y = 1.62;
        this.group.add(head);

        // Cheveux (brun)
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2800 });
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.48), hairMat);
        hair.position.y = 1.92;
        this.group.add(hair);

        // Yeux
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        leftEye.position.set(-0.12, 1.65, -0.23);
        this.group.add(leftEye);
        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        rightEye.position.set(0.12, 1.65, -0.23);
        this.group.add(rightEye);

        // Bras gauche
        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-0.4, 1.3, 0);
        const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.25), bodyMat);
        leftArmMesh.position.y = -0.3;
        this.leftArm.add(leftArmMesh);
        this.group.add(this.leftArm);

        // Bras droit (porte l'arme)
        this.rightArm = new THREE.Group();
        this.rightArm.position.set(0.4, 1.3, 0);
        const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.25), bodyMat);
        rightArmMesh.position.y = -0.3;
        this.rightArm.add(rightArmMesh);
        this.group.add(this.rightArm);

        // Point d'attache de l'arme (bout de la main droite)
        this.weaponMount = new THREE.Group();
        this.weaponMount.position.set(0, -0.6, -0.1);
        this.rightArm.add(this.weaponMount);

        // Jambe gauche (pantalon marron)
        const legMat = new THREE.MeshStandardMaterial({ color: 0x553322 });
        this.leftLeg = new THREE.Group();
        this.leftLeg.position.set(-0.15, 0.6, 0);
        const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), legMat);
        leftLegMesh.position.y = -0.3;
        this.leftLeg.add(leftLegMesh);
        this.group.add(this.leftLeg);

        // Jambe droite
        this.rightLeg = new THREE.Group();
        this.rightLeg.position.set(0.15, 0.6, 0);
        const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), legMat);
        rightLegMesh.position.y = -0.3;
        this.rightLeg.add(rightLegMesh);
        this.group.add(this.rightLeg);

        this.walkTime = 0;
        scene.add(this.group);
    }

    update(delta, isMoving, yaw) {
        this.group.rotation.y = yaw;

        if (isMoving) {
            this.walkTime += delta * 8;
            const swing = Math.sin(this.walkTime) * 0.5;
            this.leftLeg.rotation.x = swing;
            this.rightLeg.rotation.x = -swing;
            this.leftArm.rotation.x = -swing * 0.6;
        } else {
            this.walkTime = 0;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftArm.rotation.x = 0;
        }
    }
}
