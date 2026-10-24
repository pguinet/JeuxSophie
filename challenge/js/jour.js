// challenge/js/jour.js
// Numéro du jour (heure locale) : change à minuit. Partagé par le classement et la sauvegarde.
export function jourIndex(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}
