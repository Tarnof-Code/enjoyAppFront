/** Aligné sur enjoyApi `PasswordPolicy` (REGEX + MESSAGE). */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9\s])\S{4,}$/;

export const PASSWORD_MESSAGE =
  'Le mot de passe doit contenir au moins une minuscule, une majuscule, ' +
  'un caractère spécial (symbole ou ponctuation), et comporter au moins 4 caractères';

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
