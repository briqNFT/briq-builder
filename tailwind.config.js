module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  mode: 'jit',
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'briq': "#EB5600",
        'briq-dark': "#C94A00",
        'briq-light': "#F7894A",
        'deep-blue': '#0D0845',
      },
    },
    fontFamily: {
      'display': ["Raleway", "Helvetica", "ui-sans-serif", "system-ui"],
      'sans': ["Source Sans Pro", "ui-sans-serif", "system-ui"],
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
