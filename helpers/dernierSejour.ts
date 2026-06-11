import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX_DERNIER_SEJOUR_UTILISATEUR = 'enjoy.dernierSejourId.';

export function cleDernierSejourUtilisateur(utilisateurSub: string): string {
  return `${PREFIX_DERNIER_SEJOUR_UTILISATEUR}${utilisateurSub}`;
}

export async function enregistrerDernierSejourVisite(
  utilisateurSub: string,
  sejourId: number,
): Promise<void> {
  if (!utilisateurSub || !Number.isFinite(sejourId) || sejourId <= 0) return;
  try {
    await AsyncStorage.setItem(cleDernierSejourUtilisateur(utilisateurSub), String(sejourId));
  } catch {
    /* quota */
  }
}

export async function lireDernierSejourVisite(utilisateurSub: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(cleDernierSejourUtilisateur(utilisateurSub));
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
