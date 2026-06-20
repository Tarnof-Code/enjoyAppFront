export const colors = {
  primary: '#121851',
  primaryDark: '#0E0E66',
  primarySoft: '#f0f1fb',
  ink: '#000000',
  text: '#2d3436',
  muted: '#636e72',
  disabled: '#b2bec3',
  placeholder: '#888888',
  border: '#dfe6e9',
  inputBorder: 'gray',
  surface: '#ffffff',
  background: '#f1f2f6',
  danger: '#F94A56',
  dangerSoft: '#ffb8b8',
  slate: '#4b6584',
  warningSoft: '#ffeaa7',
  focus: 'blue',
  overlay: 'rgba(0, 0, 0, 0.4)',
  link: 'blue',
  info: 'blue',
  success: 'green',
  accent: 'purple',
  highlight: 'red',
  tempCold: 'blue',
  tempHot: 'red',
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
