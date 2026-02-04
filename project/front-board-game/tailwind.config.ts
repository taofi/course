// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
        fontFamily: { 
            'serif': ['Cormorant Garamond', 'serif'], 
            'sans': ['Merriweather', 'sans-serif'],
            'heading': ['Cormorant Garamond', 'serif'],
            'body': ['Merriweather', 'sans-serif'],
          },
    },
  },
  plugins: [],
};

export default config;