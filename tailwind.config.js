module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  mode: 'jit',
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'briq': "#ee7722",
        'briq-light': "#FFB078",
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
