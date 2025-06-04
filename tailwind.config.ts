import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '480px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      // Breakpoints específicos para móviles
      'mobile-s': '320px',
      'mobile-m': '375px',
      'mobile-l': '425px',
      // Breakpoints específicos para tablets
      'tablet-s': '768px',
      'tablet-l': '1024px',
      // Breakpoints específicos para desktop
      'desktop-s': '1280px',
      'desktop-m': '1440px',
      'desktop-l': '1920px',
      'desktop-xl': '2560px',
    },
    extend: {
      // Spacing extremadamente granular
      spacing: {
        '0.25': '0.0625rem',  // 1px
        '0.75': '0.1875rem',  // 3px
        '1.25': '0.3125rem',  // 5px
        '2.25': '0.5625rem',  // 9px
        '3.25': '0.8125rem',  // 13px
        '4.25': '1.0625rem',  // 17px
        '5.25': '1.3125rem',  // 21px
        '6.25': '1.5625rem',  // 25px
        '7.25': '1.8125rem',  // 29px
        '8.25': '2.0625rem',  // 33px
        '9.25': '2.3125rem',  // 37px
        '10.25': '2.5625rem', // 41px
        '11.25': '2.8125rem', // 45px
        '12.25': '3.0625rem', // 49px
        '13': '3.25rem',      // 52px
        '14': '3.5rem',       // 56px
        '15': '3.75rem',      // 60px
        '17': '4.25rem',      // 68px
        '18': '4.5rem',       // 72px
        '19': '4.75rem',      // 76px
        '21': '5.25rem',      // 84px
        '22': '5.5rem',       // 88px
        '23': '5.75rem',      // 92px
        '25': '6.25rem',      // 100px
        '26': '6.5rem',       // 104px
        '27': '6.75rem',      // 108px
        '29': '7.25rem',      // 116px
        '30': '7.5rem',       // 120px
        '31': '7.75rem',      // 124px
        '33': '8.25rem',      // 132px
        '34': '8.5rem',       // 136px
        '35': '8.75rem',      // 140px
        '37': '9.25rem',      // 148px
        '38': '9.5rem',       // 152px
        '39': '9.75rem',      // 156px
        '41': '10.25rem',     // 164px
        '42': '10.5rem',      // 168px
        '43': '10.75rem',     // 172px
        '45': '11.25rem',     // 180px
        '46': '11.5rem',      // 184px
        '47': '11.75rem',     // 188px
        '49': '12.25rem',     // 196px
        '50': '12.5rem',      // 200px
        '75': '18.75rem',     // 300px
        '100': '25rem',       // 400px
        '125': '31.25rem',    // 500px
        '150': '37.5rem',     // 600px
        '200': '50rem',       // 800px
        '250': '62.5rem',     // 1000px
        '300': '75rem',       // 1200px
      },
      // Grid template extremo
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
        '17': 'repeat(17, minmax(0, 1fr))',
        '18': 'repeat(18, minmax(0, 1fr))',
        '19': 'repeat(19, minmax(0, 1fr))',
        '20': 'repeat(20, minmax(0, 1fr))',
        'auto-fit-100': 'repeat(auto-fit, minmax(100px, 1fr))',
        'auto-fit-200': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-300': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fill-100': 'repeat(auto-fill, minmax(100px, 1fr))',
        'auto-fill-200': 'repeat(auto-fill, minmax(200px, 1fr))',
        'auto-fill-300': 'repeat(auto-fill, minmax(300px, 1fr))',
      },
      gridTemplateRows: {
        '7': 'repeat(7, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '11': 'repeat(11, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
      // Z-index extremo
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '1000': '1000',
        '9999': '9999',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "bounce-slow": {
          "0%, 100%": { 
            transform: "translateY(0)"
          },
          "50%": {
            transform: "translateY(-15px)"
          }
        },
        // Animaciones personalizadas para control extremo
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-top': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'rotate-in': {
          '0%': { transform: 'rotate(-180deg)', opacity: '0' },
          '100%': { transform: 'rotate(0deg)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-slow": "bounce-slow 2s infinite ease-in-out",
        'slide-in-left': 'slide-in-left 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'slide-in-top': 'slide-in-top 0.5s ease-out',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'rotate-in': 'rotate-in 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;