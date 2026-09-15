/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A090C",
        surface: {
          DEFAULT: "#121115",
          2: "#15141A",
          3: "#17161B",
          hover: "#191820",
          inset: "#0D0C10",
          clock: "#0E0D11",
        },
        hairline: {
          DEFAULT: "rgba(255,255,255,0.08)",
          soft: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.12)",
        },
        accent: {
          DEFAULT: "#E8FE5A",
          hi: "#F1FF7E",
          link: "#F3FF9B",
        },
        ink: {
          DEFAULT: "#F5F2EC",
          mute: "#D6D2DE",
          soft: "#B9B5C2",
          faint: "#8B8794",
          deep: "#736F7D",
        },
        loss: {
          DEFAULT: "#FF8A7A",
          hi: "#FFD9D3",
          mute: "#C7A9A4",
        },
        warn: {
          DEFAULT: "#FFC46B",
          hi: "#FFE0B0",
          mute: "#C9BCA8",
        },
        draw: "#9FB4FF",
        offchain: "rgba(255,255,255,0.26)",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "sans-serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "14px",
        xl3: "18px",
        xl4: "22px",
      },
      keyframes: {
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        ringpulse: {
          "0%": { transform: "scale(0.82)", opacity: "0.55" },
          "70%,100%": { transform: "scale(1.35)", opacity: "0" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-7px) rotate(2deg)" },
        },
        cyc: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.92)" },
          "3%,17%": { opacity: "1", transform: "none" },
          "23%,100%": { opacity: "0", transform: "translateY(-8px) scale(0.92)" },
        },
        risein: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        slamL: {
          "0%": { opacity: "0", transform: "translateX(-46px) rotate(-14deg) scale(0.7)" },
          "62%": { opacity: "1", transform: "translateX(6px) rotate(3deg) scale(1.06)" },
          "100%": { opacity: "1", transform: "none" },
        },
        slamR: {
          "0%": { opacity: "0", transform: "translateX(46px) rotate(14deg) scale(0.7)" },
          "62%": { opacity: "1", transform: "translateX(-6px) rotate(-3deg) scale(1.06)" },
          "100%": { opacity: "1", transform: "none" },
        },
        fadeup: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-240px 0" },
          "100%": { backgroundPosition: "240px 0" },
        },
        toastin: {
          from: { opacity: "0", transform: "translateY(-10px) scale(0.97)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        breathe: "breathe 2.6s ease-in-out infinite",
        ringpulse: "ringpulse 3.2s ease-out infinite",
        floaty: "floaty 5s ease-in-out infinite",
        cyc: "cyc 6s ease-in-out infinite",
        risein: "risein 0.5s cubic-bezier(0.2,0.9,0.2,1) both",
        slamL: "slamL 0.85s cubic-bezier(0.2,0.9,0.2,1) both",
        slamR: "slamR 0.85s cubic-bezier(0.2,0.9,0.2,1) both",
        fadeup: "fadeup 0.4s cubic-bezier(0.2,0.9,0.2,1) both",
        shimmer: "shimmer 1.4s linear infinite",
        toastin: "toastin 0.2s cubic-bezier(0.2,0.9,0.2,1) both",
      },
      boxShadow: {
        accentPop: "0 22px 40px -24px rgba(232,254,90,0.85)",
        accentGlow: "0 20px 44px -22px rgba(232,254,90,0.95)",
      },
    },
  },
  plugins: [],
};
