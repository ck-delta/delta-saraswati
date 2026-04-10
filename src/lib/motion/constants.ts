export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;
export const SPRING_GENTLE = { type: "spring" as const, stiffness: 300, damping: 30 };
export const SPRING_BOUNCY = { type: "spring" as const, stiffness: 400, damping: 25 };
export const SPRING_STIFF = { type: "spring" as const, stiffness: 500, damping: 35 };

export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  medium: 0.3,
  slow: 0.4,
  page: 0.5,
} as const;

export const STAGGER = {
  fast: 0.04,
  normal: 0.06,
  slow: 0.08,
  section: 0.12,
} as const;

export const PRICE_FLASH_MS = 600;
