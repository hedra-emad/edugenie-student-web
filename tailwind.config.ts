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
          primary: "#3B1892",     
          light: "#5B3DB8",      
          inputBg: "#f9fafb",     
          softBlue: "#eff6ff",    
        },
      },
    },
  },
  plugins: [],
};
export default config;