// tailwind.config.ts
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: [
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
],
  theme: {
    extend: {
      fontFamily: {
  sans: ["var(--font-heebo)", "sans-serif"],
},
    },
  },
  plugins: [typography],
} satisfies Config
