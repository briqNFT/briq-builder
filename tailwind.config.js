function withOpacityValue(variable) {
    return ({ opacityValue }) => {
        if (opacityValue === undefined) {
            return `rgb(var(${variable}))`
        }
        return `rgb(var(${variable}) / ${opacityValue})`
    }
}

module.exports = {
    theme: {
        colors: {
            primary: withOpacityValue('--color-primary'),
            secondary: withOpacityValue('--color-secondary'),
            // ...
        }
    }
}

module.exports = {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                base: withOpacityValue('--color-base'),
                accent: withOpacityValue('--color-accent'),
                darker:  withOpacityValue('--color-darker'),
                text:  withOpacityValue('--color-text'),
                'text-on-accent':  withOpacityValue('--color-text-on-accent'),
                'deep-blue': '#0D0845',
                // Not recommended:
                'briq': "#EB5600",
                'briq-dark': "#C94A00",
                'briq-darker': '#9B3803',
                'briq-darkest': '#752900',
                'briq-light': "#F7894A",
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            }
        },
        fontSize: {
            'xs': '.75rem',
            'sm': '.875rem',
            'md': '1rem',
            'lg': '1.125rem',
            'xl': '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
            '5xl': '3rem',
            '6xl': '4rem',
            '7xl': '5rem',
        },
        fontFamily: {
            'display': ["Raleway", "Helvetica", "ui-sans-serif", "system-ui"],
            'sans': ["Source Sans Pro", "ui-sans-serif", "system-ui"],
            'mono': ["Source Code Pro", "monospace", "system-ui"],
        }
    },
    plugins: [],
};
