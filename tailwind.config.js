module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'briq': "#EB5600",
        'briq-dark': "#C94A00",
        'briq-darker': '#9B3803',
        'briq-darkest': '#752900',
        'briq-light': "#F7894A",
        'deep-blue': '#0D0845',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
    fontFamily: {
      'display': ["Raleway", "Helvetica", "ui-sans-serif", "system-ui"],
      'sans': ["Source Sans Pro", "ui-sans-serif", "system-ui"],
      'mono': ["Source Code Pro", "monospace", "system-ui"],
    }
  },
  plugins: [],
};
