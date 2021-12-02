module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  mode: 'jit',
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'briq': "#EB5600",
        'briq-dark': "#CA5010",
        'briq-light': "#F7894A",
        'deep-blue': '#0D0845',
      },
    },
    fontFamily: {
      'sans': ["Poppins", "ui-sans-serif", "system-ui"],
//-       'mono': ['ui-monospace', 'SFMono-Regular', ...],
//+       'display': ['Oswald', ...],
//+       'body': ['"Open Sans"', ...],
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
