// Navigation 2D (plan xz) du chat : zones praticables (rectangles), obstacles (cercles/rectangles), passage par la porte.
// Module pur, testable sous Node.

export class Nav {
    /**
     * @param {{ zones: Array<{name:string, min:[x,z], max:[x,z]}>, obstacles?: Array<{type:'circle'|'rect', ...}>, door?: {pos:[x,z], zones:[string,string]} }} def
     */
    constructor(def) {
        this.zones = def.zones;
        this.obstacles = def.obstacles || [];
        this.door = def.door || null;
        this.margin = def.margin ?? 0.12;
    }

    zoneAt(p) {
        for (const z of this.zones) if (p[0] >= z.min[0] && p[0] <= z.max[0] && p[1] >= z.min[1] && p[1] <= z.max[1]) return z.name;
        return null;
    }

    inObstacle(p) {
        for (const o of this.obstacles) {
            if (o.type === 'circle') { if (Math.hypot(p[0] - o.c[0], p[1] - o.c[1]) < o.r + this.margin) return true; }
            else if (p[0] > o.min[0] - this.margin && p[0] < o.max[0] + this.margin && p[1] > o.min[1] - this.margin && p[1] < o.max[1] + this.margin) return true;
        }
        return false;
    }

    isWalkable(p) {
        if (this.door && Math.hypot(p[0] - this.door.pos[0], p[1] - this.door.pos[1]) < (this.door.radius ?? 0.5)) return true;
        return this.zoneAt(p) !== null && !this.inObstacle(p);
    }

    /** Point praticable aléatoire ; `zoneName` optionnel pour rester dans une zone. */
    randomPoint(rng, zoneName = null) {
        const candidates = zoneName ? this.zones.filter((z) => z.name === zoneName) : this.zones;
        for (let i = 0; i < 60; i++) {
            const z = candidates[Math.floor(rng() * candidates.length)];
            const p = [z.min[0] + this.margin + rng() * (z.max[0] - z.min[0] - 2 * this.margin), z.min[1] + this.margin + rng() * (z.max[1] - z.min[1] - 2 * this.margin)];
            if (!this.inObstacle(p)) return p;
        }
        return [(candidates[0].min[0] + candidates[0].max[0]) / 2, (candidates[0].min[1] + candidates[0].max[1]) / 2];
    }

    /** Ramène un déplacement dans le praticable : renvoie `next` si OK, sinon `prev`. */
    clamp(next, prev) {
        return this.isWalkable(next) ? next : (prev ? [prev[0], prev[1]] : next);
    }

    /** Itinéraire : liste de points à atteindre successivement (passe par la porte si on change de zone). */
    route(from, to) {
        const zf = this.zoneAt(from), zt = this.zoneAt(to);
        if (this.door && zf && zt && zf !== zt && this.door.zones.includes(zf) && this.door.zones.includes(zt)) {
            const d = this.door.pos, dir = this.door.dir || [1, 0];
            // Deux jalons de part et d'autre du seuil pour traverser bien perpendiculairement
            const inside = [d[0] - dir[0] * 0.45, d[1] - dir[1] * 0.45], outside = [d[0] + dir[0] * 0.45, d[1] + dir[1] * 0.45];
            const fromInside = this.door.zones[0] === zf;
            return fromInside ? [inside, outside, to] : [outside, inside, to];
        }
        return [to];
    }
}
