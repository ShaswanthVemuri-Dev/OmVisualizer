import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        aura: '0 0 70px rgba(168, 85, 247, 0.22)',
        canvas: '0 0 95px rgba(45, 212, 191, 0.16), inset 0 0 55px rgba(168, 85, 247, 0.12)'
      },
      backgroundImage: {
        'sacred-radial': 'radial-gradient(circle at 50% 20%, rgba(168,85,247,0.24), transparent 30%), radial-gradient(circle at 80% 10%, rgba(20,184,166,0.16), transparent 24%), linear-gradient(135deg, #050816 0%, #0d1024 48%, #05030a 100%)'
      }
    }
  },
  plugins: []
};

export default config;
