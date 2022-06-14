function withOpacityValue(variable) {
    return ({ opacityValue }) => {
        if (opacityValue === undefined)
            return `rgb(var(${variable}))`;

        return `rgb(var(${variable}) / ${opacityValue})`;
    };
}

module.exports = {
    // Enable important for util classes to work around speficity issues.
    important: '#app',
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                body: withOpacityValue('--color-body'),

                base: withOpacityValue('--color-base'),
                accent: withOpacityValue('--color-accent'),
                'light-accent': withOpacityValue('--color-light-accent'),
                darker: withOpacityValue('--color-darker'),
                dark: withOpacityValue('--color-dark'),

                text: withOpacityValue('--color-text'),
                'text-on-accent': withOpacityValue('--color-text-on-accent'),
                'deep-blue': '#0D0845',
            },
            keyframes: {
                'text-loop': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'text-loop': 'text-loop 5s linear infinite',
            },
            screens: {
                '2xl': '1440px',
            },
        },
        fontSize: {
            xs: '.75rem',
            sm: '.875rem',
            copy:'.875rem',
            base: '1rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '4xl': '2rem',
            '5xl': '3rem',
            max: '4.5rem',
        },
        fontFamily: {
            logo: ['Raleway', 'Work Sans', 'ui-sans-serif', 'system-ui'],
            display: ['Work Sans', 'ui-sans-serif', 'system-ui'],
            sans: ['Work Sans', 'ui-sans-serif', 'system-ui'],
            mono: ['Source Code Pro', 'monospace', 'system-ui'],
        },
        borderRadius: {
            'none': '0',
            'sm': '0.25rem',
            DEFAULT: '0.5rem',
            'md': '0.75rem',
            'lg': '1.0rem',
            'xl': '1.5rem',
            'full': '9999px',
        },
    },
    plugins: [],
};
