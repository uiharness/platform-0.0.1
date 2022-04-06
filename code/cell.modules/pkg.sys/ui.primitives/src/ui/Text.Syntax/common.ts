import { t, COLORS, color } from '../../common';
export * from '../../common';

/**
 * Constants
 */
const LIGHT: t.TextSyntaxColors = {
  Brace: COLORS.MAGENTA,
  Predicate: COLORS.MAGENTA,
  Colon: color.alpha(COLORS.DARK, 0.6),
  Word: { Base: COLORS.DARK, Element: COLORS.CYAN },
};
const DARK: t.TextSyntaxColors = {
  Brace: color.lighten(COLORS.MAGENTA, 10),
  Predicate: color.lighten(COLORS.MAGENTA, 10),
  Colon: color.alpha(COLORS.WHITE, 0.8),
  Word: { Base: COLORS.WHITE, Element: COLORS.CYAN },
};

const THEMES: t.PropListTheme[] = ['Light', 'Dark'];
const THEME: t.PropListTheme = 'Light';
export const DEFAULT = { THEME };
export const constants = {
  DEFAULT,
  THEMES,
  COLORS: { LIGHT, DARK },
};
