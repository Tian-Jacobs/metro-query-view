import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
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
				border: '#e2e8f0',     // slate-200
				input: '#e2e8f0',      // slate-200
				ring: '#3b82f6',       // blue-500
				background: '#ffffff',  // white
				foreground: '#334155',  // slate-700
				primary: {
					DEFAULT: '#1e40af',   // blue-700
					foreground: '#ffffff' // white
				},
				secondary: {
					DEFAULT: '#f1f5f9',   // slate-100
					foreground: '#334155' // slate-700
				},
				destructive: {
					DEFAULT: '#ef4444',   // red-500
					foreground: '#ffffff' // white
				},
				muted: {
					DEFAULT: '#e2e8f0',   // slate-200
					foreground: '#64748b' // slate-500
				},
				accent: {
					DEFAULT: '#3b82f6',   // blue-500
					foreground: '#ffffff' // white
				},
				popover: {
					DEFAULT: '#ffffff',   // white
					foreground: '#334155' // slate-700
				},
				card: {
					DEFAULT: '#ffffff',   // white
					foreground: '#334155' // slate-700
				},
				// Municipal Color Palette
				municipal: {
					blue: {
						DEFAULT: '#1e40af', // blue-700
						light: '#3b82f6'    // blue-500
					},
					gray: {
						DEFAULT: '#475569', // slate-600
						light: '#94a3b8'    // slate-400
					}
				},
				// Chart Colors
				chart: {
					primary: '#1e40af',   // blue-700
					secondary: '#3b82f6', // blue-500
					tertiary: '#475569',  // slate-600
					quaternary: '#e2e8f0' // slate-200
				}
			},
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
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-right': {
					'0%': {
						transform: 'translateX(100%)'
					},
					'100%': {
						transform: 'translateX(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
