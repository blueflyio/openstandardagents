import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--ossa-primary)', // From SCSS variables - #4A3ECD
          50: '#f5f4fd',
          100: '#e8e5fa',
          200: '#d4cff5',
          300: '#b5abee',
          400: '#8f7ee4',
          500: 'var(--ossa-primary)', // #4A3ECD - from SCSS
          600: '#3d2fb8',
          700: '#322598',
          800: '#2a1f7a',
          900: '#241f65',
          950: '#15113a',
        },
        secondary: {
          DEFAULT: 'var(--ossa-secondary)', // From SCSS variables - #1CB9ED
          50: '#ecfbff',
          100: '#d1f5fe',
          200: '#a8e9fd',
          300: '#6fd8fa',
          400: '#2ec0f5',
          500: 'var(--ossa-secondary)', // #1CB9ED - from SCSS
          600: '#0a9dd1',
          700: '#087da9',
          800: '#0c6688',
          900: '#105570',
          950: '#08374a',
        },
        accent: {
          DEFAULT: 'var(--ossa-accent)', // From SCSS variables - #9060EA
          50: '#f7f4fe',
          100: '#ede9fd',
          200: '#ddd4fb',
          300: '#c5b3f8',
          400: '#a887f3',
          500: 'var(--ossa-accent)', // #9060EA - from SCSS
          600: '#7c3aed',
          700: '#6b28d9',
          800: '#5923b8',
          900: '#4b1f97',
          950: '#2d0f5c',
        },
        // Semantic colors - centralized and muted
        // These reference CSS variables which come from SCSS variables in styles/_variables.scss
        // Update colors in ONE place: styles/_variables.scss
        success: {
          DEFAULT: 'var(--ossa-success)',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: 'var(--ossa-success)', // #10b981 - from SCSS
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          DEFAULT: 'var(--ossa-warning)',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: 'var(--ossa-warning)', // #f59e0b - from SCSS
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          DEFAULT: 'var(--ossa-error)',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: 'var(--ossa-error)', // #ef4444 - from SCSS
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          DEFAULT: 'var(--ossa-info)',
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: 'var(--ossa-info)', // #06b6d4 - from SCSS
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        code: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#334155',
            a: {
              color: '#0284c7',
              '&:hover': {
                color: '#0369a1',
              },
            },
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
