import type { CSSProperties } from "react";

export const colors = {
  bgBase: "#060B14",
  bgPanel: "#0B1324",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  borderSoft: "rgba(255, 255, 255, 0.12)",
  textPrimary: "rgba(255, 255, 255, 0.92)",
  textMuted: "rgba(255, 255, 255, 0.70)",
  accentBlue: "#3b82f6",
  accentBlueSoft: "rgba(59, 130, 246, 0.6)",
};

export const radii = {
  card: 22,
  button: 15,
};

export const shadows = {
  card: "0 12px 40px rgba(0, 0, 0, 0.35)",
  soft: "0 8px 24px rgba(0, 0, 0, 0.25)",
};

export const glow = {
  primary: "0 12px 32px rgba(59, 130, 246, 0.45)",
};

export const themeVars: CSSProperties = {
  "--bg-base": colors.bgBase,
  "--bg-panel": colors.bgPanel,
  "--border-subtle": colors.borderSubtle,
  "--border-soft": colors.borderSoft,
  "--text-primary": colors.textPrimary,
  "--text-muted": colors.textMuted,
  "--accent-blue": colors.accentBlue,
  "--accent-blue-soft": colors.accentBlueSoft,
  "--radius-card": `${radii.card}px`,
  "--radius-button": `${radii.button}px`,
  "--shadow-card": shadows.card,
  "--shadow-soft": shadows.soft,
  "--glow-primary": glow.primary,
};

export type GlowLevel = "none" | "primary";

