import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2e2a91",     
          light: "#4f46e5",      
          inputBg: "#f9fafb",     
          softBlue: "#eff6ff",    
        },
      },
    },
  },
  plugins: [],
};
export default config;