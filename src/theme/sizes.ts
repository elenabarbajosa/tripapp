export const sizes = {
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 28,

  touchTarget: 44,
  buttonHeight: 52,
  buttonHeightSm: 40,
  inputHeight: 52,

  avatarSm: 28,
  avatarMd: 36,
  avatarLg: 48,
  avatarXl: 64,

  tabBarHeight: 64,
  headerHeight: 56,

  tripCardImageHeight: 168,
  progressBarHeight: 8,

  hairline: 1,
} as const;

export type SizeToken = keyof typeof sizes;
