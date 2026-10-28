import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"], // not used yet: the app is light only (dark mode deprioritized 2026-10-28)
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Daybreak tokens (src/styles/tokens.css). Families: DEFAULT/deep = text and icons, ink = text
				// on soft fills, bright = graphics, vivid = bold bands, soft = badges, line = borders, tint = boxes.
				base: 'rgb(var(--base) / <alpha-value>)',
				surface: { DEFAULT: 'rgb(var(--surface) / <alpha-value>)', 2: 'rgb(var(--surface2) / <alpha-value>)' },
				line: 'rgb(var(--border) / <alpha-value>)',
				ink: { DEFAULT: 'rgb(var(--text) / <alpha-value>)', soft: 'rgb(var(--text2) / <alpha-value>)', faint: 'rgb(var(--text3) / <alpha-value>)', muted: 'rgb(var(--text4) / <alpha-value>)' },
				highlight: 'rgb(var(--highlight) / <alpha-value>)',
				brand: { DEFAULT: 'rgb(var(--primary-deep) / <alpha-value>)', deep: 'rgb(var(--primary-deep) / <alpha-value>)', ink: 'rgb(var(--primary-ink) / <alpha-value>)', bright: 'rgb(var(--primary-bright) / <alpha-value>)', vivid: 'rgb(var(--primary-vivid) / <alpha-value>)', soft: 'rgb(var(--primary-soft) / <alpha-value>)', line: 'rgb(var(--primary-border) / <alpha-value>)', tint: 'rgb(var(--primary-tint) / <alpha-value>)' },
				positive: { DEFAULT: 'rgb(var(--positive-deep) / <alpha-value>)', deep: 'rgb(var(--positive-deep) / <alpha-value>)', ink: 'rgb(var(--positive-ink) / <alpha-value>)', bright: 'rgb(var(--positive-bright) / <alpha-value>)', vivid: 'rgb(var(--positive-vivid) / <alpha-value>)', soft: 'rgb(var(--positive-soft) / <alpha-value>)', line: 'rgb(var(--positive-border) / <alpha-value>)', tint: 'rgb(var(--positive-tint) / <alpha-value>)' },
				info: { DEFAULT: 'rgb(var(--info-deep) / <alpha-value>)', deep: 'rgb(var(--info-deep) / <alpha-value>)', ink: 'rgb(var(--info-ink) / <alpha-value>)', bright: 'rgb(var(--info-bright) / <alpha-value>)', vivid: 'rgb(var(--info-vivid) / <alpha-value>)', soft: 'rgb(var(--info-soft) / <alpha-value>)', line: 'rgb(var(--info-border) / <alpha-value>)', tint: 'rgb(var(--info-tint) / <alpha-value>)' },
				caution: { DEFAULT: 'rgb(var(--caution-deep) / <alpha-value>)', deep: 'rgb(var(--caution-deep) / <alpha-value>)', ink: 'rgb(var(--caution-ink) / <alpha-value>)', bright: 'rgb(var(--caution-bright) / <alpha-value>)', vivid: 'rgb(var(--caution-vivid) / <alpha-value>)', soft: 'rgb(var(--caution-soft) / <alpha-value>)', line: 'rgb(var(--caution-border) / <alpha-value>)', tint: 'rgb(var(--caution-tint) / <alpha-value>)' },
				premium: { DEFAULT: 'rgb(var(--premium-deep) / <alpha-value>)', deep: 'rgb(var(--premium-deep) / <alpha-value>)', ink: 'rgb(var(--premium-ink) / <alpha-value>)', bright: 'rgb(var(--premium-bright) / <alpha-value>)', vivid: 'rgb(var(--premium-vivid) / <alpha-value>)', soft: 'rgb(var(--premium-soft) / <alpha-value>)', line: 'rgb(var(--premium-border) / <alpha-value>)', tint: 'rgb(var(--premium-tint) / <alpha-value>)' },
				support: { DEFAULT: 'rgb(var(--donation-deep) / <alpha-value>)', deep: 'rgb(var(--donation-deep) / <alpha-value>)', ink: 'rgb(var(--donation-ink) / <alpha-value>)', bright: 'rgb(var(--donation-bright) / <alpha-value>)', vivid: 'rgb(var(--donation-vivid) / <alpha-value>)', soft: 'rgb(var(--donation-soft) / <alpha-value>)', line: 'rgb(var(--donation-border) / <alpha-value>)', tint: 'rgb(var(--donation-tint) / <alpha-value>)' },
				cause: {
					beat_cancer: { DEFAULT: 'rgb(var(--cause-beat-cancer-deep) / <alpha-value>)', deep: 'rgb(var(--cause-beat-cancer-deep) / <alpha-value>)', ink: 'rgb(var(--cause-beat-cancer-ink) / <alpha-value>)', bright: 'rgb(var(--cause-beat-cancer-bright) / <alpha-value>)', vivid: 'rgb(var(--cause-beat-cancer-vivid) / <alpha-value>)', soft: 'rgb(var(--cause-beat-cancer-soft) / <alpha-value>)', line: 'rgb(var(--cause-beat-cancer-border) / <alpha-value>)', tint: 'rgb(var(--cause-beat-cancer-tint) / <alpha-value>)' },
					live_healthier: { DEFAULT: 'rgb(var(--cause-live-healthier-deep) / <alpha-value>)', deep: 'rgb(var(--cause-live-healthier-deep) / <alpha-value>)', ink: 'rgb(var(--cause-live-healthier-ink) / <alpha-value>)', bright: 'rgb(var(--cause-live-healthier-bright) / <alpha-value>)', vivid: 'rgb(var(--cause-live-healthier-vivid) / <alpha-value>)', soft: 'rgb(var(--cause-live-healthier-soft) / <alpha-value>)', line: 'rgb(var(--cause-live-healthier-border) / <alpha-value>)', tint: 'rgb(var(--cause-live-healthier-tint) / <alpha-value>)' },
					clean_energy: { DEFAULT: 'rgb(var(--cause-clean-energy-deep) / <alpha-value>)', deep: 'rgb(var(--cause-clean-energy-deep) / <alpha-value>)', ink: 'rgb(var(--cause-clean-energy-ink) / <alpha-value>)', bright: 'rgb(var(--cause-clean-energy-bright) / <alpha-value>)', vivid: 'rgb(var(--cause-clean-energy-vivid) / <alpha-value>)', soft: 'rgb(var(--cause-clean-energy-soft) / <alpha-value>)', line: 'rgb(var(--cause-clean-energy-border) / <alpha-value>)', tint: 'rgb(var(--cause-clean-energy-tint) / <alpha-value>)' },
					keeping_safe: { DEFAULT: 'rgb(var(--cause-keeping-safe-deep) / <alpha-value>)', deep: 'rgb(var(--cause-keeping-safe-deep) / <alpha-value>)', ink: 'rgb(var(--cause-keeping-safe-ink) / <alpha-value>)', bright: 'rgb(var(--cause-keeping-safe-bright) / <alpha-value>)', vivid: 'rgb(var(--cause-keeping-safe-vivid) / <alpha-value>)', soft: 'rgb(var(--cause-keeping-safe-soft) / <alpha-value>)', line: 'rgb(var(--cause-keeping-safe-border) / <alpha-value>)', tint: 'rgb(var(--cause-keeping-safe-tint) / <alpha-value>)' },
					mental_health: { DEFAULT: 'rgb(var(--cause-mental-health-deep) / <alpha-value>)', deep: 'rgb(var(--cause-mental-health-deep) / <alpha-value>)', ink: 'rgb(var(--cause-mental-health-ink) / <alpha-value>)', bright: 'rgb(var(--cause-mental-health-bright) / <alpha-value>)', vivid: 'rgb(var(--cause-mental-health-vivid) / <alpha-value>)', soft: 'rgb(var(--cause-mental-health-soft) / <alpha-value>)', line: 'rgb(var(--cause-mental-health-border) / <alpha-value>)', tint: 'rgb(var(--cause-mental-health-tint) / <alpha-value>)' },
					clean_food: { DEFAULT: 'rgb(var(--cause-clean-food-deep) / <alpha-value>)', deep: 'rgb(var(--cause-clean-food-deep) / <alpha-value>)', ink: 'rgb(var(--cause-clean-food-ink) / <alpha-value>)', bright: 'rgb(var(--cause-clean-food-bright) / <alpha-value>)', vivid: 'rgb(var(--cause-clean-food-vivid) / <alpha-value>)', soft: 'rgb(var(--cause-clean-food-soft) / <alpha-value>)', line: 'rgb(var(--cause-clean-food-border) / <alpha-value>)', tint: 'rgb(var(--cause-clean-food-tint) / <alpha-value>)' },
					clean_water: { DEFAULT: 'rgb(var(--cause-clean-water-deep) / <alpha-value>)', deep: 'rgb(var(--cause-clean-water-deep) / <alpha-value>)', ink: 'rgb(var(--cause-clean-water-ink) / <alpha-value>)', bright: 'rgb(var(--cause-clean-water-bright) / <alpha-value>)', vivid: 'rgb(var(--cause-clean-water-vivid) / <alpha-value>)', soft: 'rgb(var(--cause-clean-water-soft) / <alpha-value>)', line: 'rgb(var(--cause-clean-water-border) / <alpha-value>)', tint: 'rgb(var(--cause-clean-water-tint) / <alpha-value>)' },
				},
				// Older names, kept so every screen picks up the palette while components move to the names above
				cream: 'rgb(var(--base) / <alpha-value>)',
				sand: { DEFAULT: 'rgb(var(--surface2) / <alpha-value>)', deep: 'rgb(var(--border) / <alpha-value>)' },
				clay: { DEFAULT: 'rgb(var(--primary-bright) / <alpha-value>)', deep: 'rgb(var(--primary-deep) / <alpha-value>)', ink: 'rgb(var(--primary-ink) / <alpha-value>)', tint: 'rgb(var(--primary-tint) / <alpha-value>)', soft: 'rgb(var(--primary-soft) / <alpha-value>)' },
				gain: 'rgb(var(--positive-deep) / <alpha-value>)',
				loss: 'rgb(var(--caution-deep) / <alpha-value>)',
				// shadcn/ui names (src/index.css)
				border: 'rgb(var(--border) / <alpha-value>)',
				input: 'rgb(var(--input) / <alpha-value>)',
				ring: 'rgb(var(--ring) / <alpha-value>)',
				background: 'rgb(var(--background) / <alpha-value>)',
				foreground: 'rgb(var(--foreground) / <alpha-value>)',
				primary: { DEFAULT: 'rgb(var(--primary) / <alpha-value>)', foreground: 'rgb(var(--primary-foreground) / <alpha-value>)' },
				secondary: { DEFAULT: 'rgb(var(--secondary) / <alpha-value>)', foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)' },
				destructive: { DEFAULT: 'rgb(var(--destructive) / <alpha-value>)', foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)' },
				muted: { DEFAULT: 'rgb(var(--muted) / <alpha-value>)', foreground: 'rgb(var(--muted-foreground) / <alpha-value>)' },
				accent: { DEFAULT: 'rgb(var(--accent) / <alpha-value>)', foreground: 'rgb(var(--accent-foreground) / <alpha-value>)' },
				popover: { DEFAULT: 'rgb(var(--popover) / <alpha-value>)', foreground: 'rgb(var(--popover-foreground) / <alpha-value>)' },
				card: { DEFAULT: 'rgb(var(--card) / <alpha-value>)', foreground: 'rgb(var(--card-foreground) / <alpha-value>)' },
			},
			// Motion tokens (src/lib/motion.ts): ease-out is the shared curve everywhere
			transitionTimingFunction: { out: 'var(--ease-out)' },
			transitionDuration: { fast: 'var(--dur-fast)', base: 'var(--dur-base)', slow: 'var(--dur-slow)' },
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
