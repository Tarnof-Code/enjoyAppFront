// Palette mirroir de l'app web (source de vérité : enjoyWebApp/src/_variables.scss)
// pour une cohérence visuelle totale entre les deux applications.
export const colors = {
  // Marque (web : $bleu_principal, $bleu_secondaire, $rouge_principal, $vert_principal)
  primary: '#383CA7',
  primaryDark: '#333796',
  primarySoft: '#dbdcef',
  danger: '#f94a56',
  success: '#00b894',

  // Palette sémantique des actions UI (web : $action-*)
  actionAdd: '#16a34a',
  actionAddHover: '#15803d',
  actionEdit: '#2563eb',
  actionEditHover: '#1d4ed8',
  actionDelete: '#dc2626',
  actionDeleteHover: '#b91c1c',
  actionWarning: '#ea580c',
  actionWarningHover: '#c2410c',
  actionSecondary: '#6b7280',
  actionSecondaryHover: '#4b5563',
  actionInfo: '#0891b2',
  actionInfoHover: '#0e7490',

  // Neutres
  ink: '#000000',
  text: '#2d3436',
  muted: '#6b7280',
  disabled: '#b2bec3',
  placeholder: '#888888',
  border: '#dfe6e9',
  inputBorder: 'gray',
  surface: '#ffffff',
  background: '#f1f2f6',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Accents / variantes locales (sans équivalent web direct)
  dangerSoft: '#ffb8b8',
  slate: '#4b6584',
  warningSoft: '#ffeaa7',
  accent: '#7c3aed',

  // Alias sémantiques (mappés sur la palette d'actions web)
  focus: '#2563eb',
  link: '#2563eb',
  info: '#2563eb',
  highlight: '#dc2626',
  tempCold: '#2563eb',
  tempHot: '#dc2626',
} as const;

export const gradients = {
  calm: ['#f7f1e3', '#dff9fb'],
  alert: ['#f7f1e3', '#ffcccc'],
} as const;

export const fonts = {
  script: 'DancingScript_400Regular',
  body: 'Roboto_400Regular',
  sans: 'PTSans_400Regular',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 12,
  md: 20,
  lg: 40,
  full: 9999,
} as const;

export const fontSizes = {
  xs: 13,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  display: 40,
} as const;

export const theme = { colors, gradients, fonts, spacing, radius, fontSizes } as const;
