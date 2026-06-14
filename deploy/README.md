# Déploiement des jeux de Sophie sur le Raspberry Pi

Ce dossier contient tout le nécessaire pour héberger les jeux sur un Raspberry Pi
(testé pour un **modèle 1**, ARMv6) qui sert les pages statiques en HTTP sur le
réseau local. Le rendu 3D (Three.js) se fait sur la tablette de Sophie, pas sur le
Pi : le Pi n'est qu'un serveur de fichiers, ce qui reste très léger.

## Vue d'ensemble

- **Serveur** : `lighttpd` (ultra-léger, démarre au boot via son propre service systemd).
- **Docroot** : `/var/www/jeux` (tout le dépôt y est copié, sauf `.git`, `docs`, etc.).
- **Three.js** : hébergé en local dans `vendor/three@0.170.0/three.module.js`
  (les jeux `aventure/` et `chat/` y pointent via leur `importmap`). Plus aucune
  dépendance au CDN jsdelivr — les jeux marchent même si Internet tombe.
- **Déploiement** : `deploy/deploy.sh` (rsync over SSH depuis le poste de dev).

---

## 1. Préparer le Raspberry Pi (une seule fois)

> ⚠️ Sur un Pi modèle 1, utilise une image **Raspberry Pi OS Lite** (sans bureau)
> pour économiser RAM et CPU.

```bash
# Sur le Pi :
sudo apt update
sudo apt install -y lighttpd rsync

# Crée le docroot et donne-le à l'utilisateur SSH (ici "sophie") pour que rsync
# puisse écrire dedans sans sudo.
sudo mkdir -p /var/www/jeux
sudo chown -R sophie:sophie /var/www/jeux
```

### Configurer lighttpd

Le dossier `deploy/` est **exclu** du déploiement (il n'a rien à faire dans le
docroot), donc on envoie la config par `scp` depuis le poste de dev :

```bash
# Depuis le poste de dev :
scp deploy/50-jeux.conf sophie@jeux.local:/tmp/50-jeux.conf
```

```bash
# Sur le Pi :
# 1. Pointer le docroot vers /var/www/jeux dans le conf principal.
#    (lighttpd refuse de réassigner server.document-root dans un fragment :
#     il faut éditer la valeur d'origine.)
sudo sed -i 's#^server.document-root\s*=.*#server.document-root        = "/var/www/jeux"#' \
    /etc/lighttpd/lighttpd.conf

# 2. Activer le fragment (en-tête no-cache via mod_setenv).
sudo cp /tmp/50-jeux.conf /etc/lighttpd/conf-available/50-jeux.conf
sudo lighttpd-enable-mod jeux

# 3. Tester puis (re)démarrer. lighttpd est déjà activé au boot par le paquet.
sudo lighttpd -tt -f /etc/lighttpd/lighttpd.conf   # doit afficher la config sans erreur
sudo systemctl enable lighttpd                     # idempotent (déjà fait à l'install)
sudo systemctl restart lighttpd
```

Vérifie le statut :

```bash
sudo systemctl status lighttpd
```

### Accès par mDNS (optionnel mais pratique)

Pour joindre le Pi par un nom plutôt qu'une IP, installe Avahi :

```bash
sudo apt install -y avahi-daemon
```

Donne au Pi le hostname `jeux` avec `sudo raspi-config` (System Options →
Hostname), puis redémarre. Il sera alors joignable à `http://jeux.local/`
(le hostname par défaut d'une image neuve est `raspberrypi`).

---

## 2. Déployer depuis le poste de dev

Configure une fois l'accès SSH par clé (évite de taper le mot de passe) :

```bash
ssh-copy-id sophie@jeux.local
```

Puis, à chaque mise à jour des jeux :

```bash
# Valeurs par défaut : sophie@jeux.local:/var/www/jeux
./deploy/deploy.sh

# Surcharger si besoin (ex. forcer l'IP quand le mDNS jeux.local ne répond pas) :
PI_HOST=192.168.1.42 ./deploy/deploy.sh

# Simuler sans rien copier :
./deploy/deploy.sh --dry-run
```

Le script utilise `rsync -az --delete` : seuls les fichiers modifiés sont envoyés,
et les fichiers supprimés localement le sont aussi côté Pi. Sont exclus du transfert :
`.git/`, `.claude/`, `docs/`, `deploy/`, `croquis.pdf`, `CLAUDE.md`.

---

## 3. Jouer

Sur la tablette de Sophie, ouvrir :

- `http://jeux.local/` — page d'accueil de tous les jeux
- `http://jeux.local/aventure/`, `/chat/`, etc.

---

## Dépannage

| Symptôme | Piste |
|---|---|
| `aventure`/`chat` : écran noir, erreur console `Failed to load module` | Vérifier que `vendor/three@0.170.0/three.module.js` a bien été déployé et que `.js` est servi en `text/javascript` (config `50-jeux.conf`). |
| `rsync: permission denied` | Le docroot n'appartient pas à l'utilisateur SSH : `sudo chown -R sophie:sophie /var/www/jeux`. |
| `jeux.local` introuvable | Installer `avahi-daemon` sur le Pi, ou utiliser l'IP directement. |
| Page pas à jour après déploiement | Les en-têtes `no-cache` sont actifs ; forcer un rafraîchissement (Ctrl/Cmd+Maj+R) sur la tablette. |
