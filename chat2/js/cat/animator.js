// Animation procédurale du chat : poses par état, marche avec IK, respiration, queue, oreilles, clignements, regard.
import * as THREE from 'three';
import { LEG_JOINTS } from './sdf.js';
import { solveTwoBone, damp, dampAngle } from './ik.js';

const LEGS = ['legFL', 'legFR', 'legBL', 'legBR'];
// Phases de marche (séquence latérale du chat) : BL, FL, BR, FR
const GAIT_PHASE = { legBL: 0.0, legFL: 0.25, legBR: 0.5, legFR: 0.75 };
const TAIL = ['tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6'];

const rest = {};
for (const leg of LEGS) {
    const j = LEG_JOINTS[leg];
    rest[leg] = {
        hip: j.hip,
        l1: Math.hypot(j.knee[0] - j.hip[0], j.knee[1] - j.hip[1]),
        l2: Math.hypot(j.foot[0] - j.knee[0], j.foot[1] - j.knee[1]),
        phi1: Math.atan2(j.knee[1] - j.hip[1], j.knee[0] - j.hip[0]),
        phi2: Math.atan2(j.foot[1] - j.knee[1], j.foot[0] - j.knee[0]),
        bend: leg.startsWith('legB') ? 1 : -1,
        footRest: [j.foot[0] - j.hip[0], j.foot[1] - j.hip[1]],
    };
}

/**
 * Pose cible par état. Chaque pose : rotations (Euler XYZ, rad) par os, décalage du bassin (root),
 * cibles de pieds relatives à la hanche (x avant, y haut) ou null = repos, et paramètres divers.
 */
function poseFor(state, t) {
    const P = { rot: {}, rootOffset: [0, 0, 0], feet: {}, tailLift: 0, tailSway: 1, earBack: 0, squint: 0, headPitch: 0, headYaw: 0, lookWeight: 0.6, breath: 1 };
    switch (state) {
        case 'sit':
            P.rootOffset = [0.0, -0.13, 0];
            P.rot.spine1 = [0, 0, 0.55]; P.rot.spine2 = [0, 0, 0.30]; P.rot.chest = [0, 0, -0.15]; P.rot.neck = [0, 0, -0.4]; P.rot.head = [0, 0, -0.15];
            P.feet.legBL = [0.07, -0.18]; P.feet.legBR = [0.07, -0.18];   // pieds arrière au sol, devant les hanches
            P.feet.legFL = [0.04, -0.17]; P.feet.legFR = [0.04, -0.17];   // pattes avant droites, au sol
            P.tailLift = -0.5; P.tailSway = 0.5;
            break;
        case 'sleep':
            P.rootOffset = [0.0, -0.12, 0];
            P.rot.spine1 = [0, 0, 0.05]; P.rot.spine2 = [0, 0, 0.0]; P.rot.chest = [0, 0, -0.05]; P.rot.neck = [0, 0.6, -0.55]; P.rot.head = [0.25, 0.45, -0.35];
            P.feet.legBL = [0.06, -0.18]; P.feet.legBR = [0.06, -0.18];   // repliées sous le corps
            P.feet.legFL = [0.08, -0.17]; P.feet.legFR = [0.08, -0.17];   // avant-bras posés devant
            P.tailLift = -0.9; P.tailSway = 0.1; P.earBack = 0.2; P.squint = 1; P.lookWeight = 0; P.breath = 1.6;
            break;
        case 'eat': case 'drink':
            P.rot.neck = [0, 0, -0.85]; P.rot.head = [0, 0, -0.55]; P.rot.chest = [0, 0, -0.12];
            P.feet.legFL = [0.02, -0.17]; P.feet.legFR = [0.02, -0.17];
            P.tailLift = -0.3; P.lookWeight = 0;
            P.headPitch = Math.sin(t * (state === 'eat' ? 9 : 12)) * 0.06; // mâchonne / lape
            break;
        case 'groom':
            P.rootOffset = [0.0, -0.13, 0];
            P.rot.spine1 = [0, 0, 0.55]; P.rot.spine2 = [0, 0, 0.30]; P.rot.chest = [0, 0, -0.1]; P.rot.neck = [0, -0.35, -0.65]; P.rot.head = [0.3, -0.4, -0.35];
            P.feet.legBL = [0.07, -0.18]; P.feet.legBR = [0.07, -0.18];
            P.feet.legFR = [0.04, -0.17];
            P.feet.legFL = [0.12 + Math.sin(t * 5) * 0.015, -0.07 + Math.sin(t * 5) * 0.02]; // patte levée qui lèche
            P.headPitch = Math.sin(t * 10) * 0.05; P.tailLift = -0.5; P.tailSway = 0.4; P.lookWeight = 0; P.squint = 0.4;
            break;
        case 'stretch':
            P.rootOffset = [0.0, -0.01, 0];
            P.rot.spine1 = [0, 0, -0.1]; P.rot.spine2 = [0, 0, -0.2]; P.rot.chest = [0, 0, -0.35]; P.rot.neck = [0, 0, 0.1]; P.rot.head = [0, 0, 0.15];
            P.feet.legFL = [0.14, -0.17]; P.feet.legFR = [0.14, -0.17];
            P.tailLift = 0.25; P.lookWeight = 0.3;
            break;
        case 'sad':
            P.rot.neck = [0, 0, -0.45]; P.rot.head = [0, 0, -0.25]; P.rot.spine2 = [0, 0, 0.05];
            P.tailLift = -1.0; P.tailSway = 0.25; P.earBack = 0.9; P.squint = 0.3; P.lookWeight = 0.2;
            break;
        case 'pet':
            P.rot.neck = [0, 0, 0.2]; P.rot.head = [0, 0, 0.2];
            P.tailLift = 0.15; P.tailSway = 1.4; P.squint = 0.85; P.lookWeight = 1;
            break;
        case 'play':
            P.rot.chest = [0, 0, -0.15]; P.rot.neck = [0, 0, -0.2];
            P.tailLift = 0.2; P.tailSway = 1.8; P.lookWeight = 0.9; P.earBack = -0.2;
            break;
        default: // idle / wander / goto
            P.tailLift = 0; P.tailSway = 1;
    }
    return P;
}

export class CatAnimator {
    constructor(cat) {
        this.cat = cat;
        this.b = cat.bone;
        this.time = 0;
        this.phase = 0;
        this.cur = {};            // rotations courantes par os (Euler)
        for (const name of Object.keys(this.b)) this.cur[name] = new THREE.Euler();
        this.rootOffset = new THREE.Vector3();
        this.feet = {};           // cibles de pieds courantes (x, y) par patte
        for (const leg of LEGS) this.feet[leg] = [...rest[leg].footRest];
        this.blinkTimer = 2 + Math.random() * 3; this.blink = 0;
        this.earTwitch = { L: 0, R: 0, timer: 3 + Math.random() * 4 };
        this.squint = 0; this.pupil = 0.5;
        this.look = { yaw: 0, pitch: 0 };
        this.tailLift = 0;
        this._v = new THREE.Vector3(); this._v2 = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion();
        this.restRoot = this.b.root.position.clone();
        this.restEarL = this.b.earL.position.clone(); // inutilisé (orientation uniquement) mais garde la référence
    }

    update(dt, behavior, ctx) {
        dt = Math.min(dt, 0.05);
        this.time += dt;
        const t = this.time;
        const state = behavior?.state || 'idle';
        const speed = behavior?.speed || 0;
        const moving = speed > 0.02;
        const pose = poseFor(state, t);
        const hl = state === 'sleep' ? 0.5 : 0.18; // demi-vie du blend

        // ---- Bassin : décalage + respiration + rebond de marche ----
        const breath = Math.sin(t * 2 * Math.PI * (state === 'sleep' ? 0.3 : 0.5)) * 0.0022 * pose.breath;
        const bob = moving ? Math.abs(Math.sin(this.phase * 2 * Math.PI * 2)) * 0.006 : 0;
        this.rootOffset.x = damp(this.rootOffset.x, pose.rootOffset[0], hl, dt);
        this.rootOffset.y = damp(this.rootOffset.y, pose.rootOffset[1], hl, dt);
        this.rootOffset.z = damp(this.rootOffset.z, pose.rootOffset[2], hl, dt);
        this.b.root.position.set(this.restRoot.x + this.rootOffset.x, this.restRoot.y + this.rootOffset.y + breath + bob, this.restRoot.z + this.rootOffset.z);
        // Ronronnement : micro-vibration
        if (state === 'pet') this.b.root.position.y += Math.sin(t * 2 * Math.PI * 25) * 0.0006;

        // ---- Colonne, cou, tête ----
        const walkSway = moving ? Math.sin(this.phase * 2 * Math.PI) * 0.03 : 0;
        const spineNames = ['spine1', 'spine2', 'chest', 'neck', 'head'];
        for (const name of spineNames) {
            const target = pose.rot[name] || [0, 0, 0];
            const e = this.cur[name];
            e.x = damp(e.x, target[0], hl, dt);
            e.y = damp(e.y, target[1], hl, dt);
            e.z = damp(e.z, target[2], hl, dt);
        }
        // Regard : orienter cou+tête vers ctx.lookAt (monde) avec un poids
        let lookYaw = 0, lookPitch = 0;
        if (ctx.lookAt && pose.lookWeight > 0) {
            const headWorld = this.b.head.getWorldPosition(this._v);
            const dir = ctx.lookAt.clone().sub(headWorld);
            const local = this.cat.group.worldToLocal(headWorld.clone().add(dir)).sub(this.cat.group.worldToLocal(headWorld.clone()));
            lookYaw = THREE.MathUtils.clamp(Math.atan2(local.z, local.x), -0.9, 0.9) * pose.lookWeight;
            lookPitch = THREE.MathUtils.clamp(Math.atan2(local.y, Math.hypot(local.x, local.z)), -0.6, 0.7) * pose.lookWeight;
        } else if (moving) {
            lookYaw = 0; lookPitch = -0.05;
        }
        this.look.yaw = dampAngle(this.look.yaw, lookYaw, 0.25, dt);
        this.look.pitch = dampAngle(this.look.pitch, lookPitch, 0.25, dt);
        // Application : la tête pique du nez = rotation Z négative (X → -Y) ; tourner à gauche (+Z) = rotation Y négative
        this.b.spine1.rotation.set(this.cur.spine1.x, this.cur.spine1.y + walkSway * 0.3, this.cur.spine1.z);
        this.b.spine2.rotation.set(this.cur.spine2.x, this.cur.spine2.y + walkSway * 0.3, this.cur.spine2.z);
        this.b.chest.rotation.set(this.cur.chest.x, this.cur.chest.y - walkSway * 0.4, this.cur.chest.z + (moving ? Math.sin(this.phase * 4 * Math.PI) * 0.015 : 0));
        this.b.neck.rotation.set(this.cur.neck.x, this.cur.neck.y - this.look.yaw * 0.4, this.cur.neck.z + this.look.pitch * 0.4);
        this.b.head.rotation.set(this.cur.head.x, this.cur.head.y - this.look.yaw * 0.6, this.cur.head.z + this.look.pitch * 0.6 + pose.headPitch + (moving ? Math.sin(this.phase * 4 * Math.PI) * 0.02 : 0));

        // ---- Oreilles : en arrière (peur/tristesse), petits tics ----
        this.earTwitch.timer -= dt;
        if (this.earTwitch.timer <= 0) { this.earTwitch.timer = 2 + Math.random() * 5; if (Math.random() < 0.5) this.earTwitch.L = 1; else this.earTwitch.R = 1; }
        this.earTwitch.L = Math.max(0, this.earTwitch.L - dt * 6); this.earTwitch.R = Math.max(0, this.earTwitch.R - dt * 6);
        const earBack = damp(this.cur.earL.z, pose.earBack * 0.9, 0.2, dt);
        this.cur.earL.z = earBack; this.cur.earR.z = earBack;
        const twitchL = Math.sin(this.earTwitch.L * Math.PI) * 0.35, twitchR = Math.sin(this.earTwitch.R * Math.PI) * 0.35;
        this.b.earL.rotation.set(-twitchL * 0.5 + pose.earBack * 0.3, 0, earBack + twitchL);
        this.b.earR.rotation.set(twitchR * 0.5 - pose.earBack * 0.3, 0, earBack + twitchR);

        // ---- Queue : portée (lift) + ondulation ----
        this.tailLift = damp(this.tailLift, pose.tailLift, 0.3, dt);
        const swayAmp = pose.tailSway * (moving ? 0.12 : 0.08);
        for (let i = 0; i < TAIL.length; i++) {
            const f = (i + 1) / TAIL.length;
            const sway = Math.sin(t * 1.6 * pose.tailSway + i * 0.7) * swayAmp * f;
            const lift = -this.tailLift * (i < 3 ? 0.3 : 0.12);  // lift négatif = queue vers le bas (rotation Z positive)
            this.b[TAIL[i]].rotation.set(0, sway, lift + (moving ? Math.sin(this.phase * 2 * Math.PI + i * 0.5) * 0.03 : 0));
        }

        // ---- Pattes : marche (IK) ou pose. Les cibles de pieds sont exprimées dans le repère du chat,
        // relativement à la position de repos de la hanche, puis converties dans le repère local du parent de la patte.
        this.cat.mesh.updateMatrixWorld(true);
        const qGroupInv = this.cat.group.getWorldQuaternion(this._q).invert();
        if (moving) this.phase = (this.phase + dt * speed / 0.24) % 1; // 24 cm par foulée
        for (const leg of LEGS) {
            const r = rest[leg];
            let tx, ty;
            if (moving) {
                const ph = (this.phase + GAIT_PHASE[leg]) % 1;
                const stride = 0.11;
                // Appui (ph 0..0.6) : le pied recule ; balancement (0.6..1) : le pied avance en se levant
                if (ph < 0.6) { const k = ph / 0.6; tx = r.footRest[0] + stride / 2 - stride * k; ty = r.footRest[1]; }
                else { const k = (ph - 0.6) / 0.4; tx = r.footRest[0] - stride / 2 + stride * k; ty = r.footRest[1] + Math.sin(k * Math.PI) * 0.035; }
            } else {
                const target = pose.feet[leg] || r.footRest;
                tx = target[0]; ty = target[1];
            }
            const f = this.feet[leg];
            f[0] = damp(f[0], tx, moving ? 0.03 : hl, dt);
            f[1] = damp(f[1], ty, moving ? 0.03 : hl, dt);
            const up = this.b[`${leg}_up`], low = this.b[`${leg}_low`], foot = this.b[`${leg}_foot`];
            // Position courante de la hanche et orientation de son parent, dans le repère du chat
            const hipG = this.cat.group.worldToLocal(up.getWorldPosition(this._v));
            const qParent = up.parent.getWorldQuaternion(this._q2).premultiply(qGroupInv);
            const rel = this._v2.set(r.hip[0] + f[0] - hipG.x, r.hip[1] + f[1] - hipG.y, 0).applyQuaternion(qParent.invert());
            const sol = solveTwoBone(r.l1, r.l2, rel.x, rel.y, r.bend);
            const a1 = sol.phi1 - r.phi1;
            const a2 = (sol.phi2 - r.phi2) - a1;
            up.rotation.set(0, 0, a1);
            low.rotation.set(0, 0, a2);
            foot.rotation.set(0, 0, -(a1 + a2) * 0.85); // le pied reste à peu près à plat
        }

        // ---- Yeux : clignement, plissement, pupille ----
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) { this.blinkTimer = 2 + Math.random() * 4; this.blink = 1; }
        this.blink = Math.max(0, this.blink - dt * 7);
        const blinkCurve = Math.sin(Math.min(this.blink, 1) * Math.PI);
        this.squint = damp(this.squint, pose.squint, 0.25, dt);
        const light = ctx.lightLevel ?? 0.7;
        this.pupil = damp(this.pupil, 1 - light * 0.85, 0.6, dt);
        for (const eye of this.cat.eyes) {
            eye.setBlink(state === 'sleep' ? 1 : blinkCurve);
            eye.setSquint(this.squint);
            eye.setPupil(this.pupil);
            eye.look(this.look.yaw * 0.25, -this.look.pitch * 0.25);
        }
        // Moustaches : léger frémissement
        if (this.cat.whiskers) this.cat.whiskers.rotation.z = Math.sin(t * 7) * 0.02 + (state === 'eat' ? Math.sin(t * 20) * 0.03 : 0);
    }
}
