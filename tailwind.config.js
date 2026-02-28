/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f6fbf7',
          100: '#eaf7ef',
          200: '#d5f0dc',
          300: '#bde8c2',
          400: '#93d59a',
          500: '#62c06a',
          600: '#45a852',
          700: '#2f7b3a',
          800: '#245c2d',
          900: '#163d1b'
        },
        cream: '#FBF9F6',
        pastel: {
          50: '#fbfdf9',
          100: '#f6fbf4',
          200: '#e6f7e6',
        },
        coral: {
          400: '#ffb4a2',
          500: '#ff8666',
          600: '#ff5f3f'
        },
        amber: {
          400: '#ffd580',
          500: '#ffc04d',
          600: '#ffac1f'
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f1724'
        }
      },
      fontFamily: {
        heading: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(16,24,40,0.06)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.02)'
      }
    },
  },
  plugins: [],
}