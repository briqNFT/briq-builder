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
                background: withOpacityValue('--color-background'),
                primary: withOpacityValue('--color-primary'),
                'primary-darker': withOpacityValue('--color-primary-darker'),
                'primary-lighter': withOpacityValue('--color-primary-lighter'),
                'primary-lightest': withOpacityValue('--color-primary-lightest'),
                'grad-darkest': withOpacityValue('--color-grad-darkest'),
                'grad-darker': withOpacityValue('--color-grad-darker'),
                'grad-dark': withOpacityValue('--color-grad-dark'),
                'grad-light': withOpacityValue('--color-grad-light'),
                'grad-lighter': withOpacityValue('--color-grad-lighter'),
                'grad-lightest': withOpacityValue('--color-grad-lightest'),
                'info-info': withOpacityValue('--color-info-info'),
                'info-warning': withOpacityValue('--color-info-warning'),
                'info-error': withOpacityValue('--color-info-error'),
                'info-success': withOpacityValue('--color-info-success'),
                'text-on-background': withOpacityValue('--color-text-on-background'),
                'text-on-primary': withOpacityValue('--color-text-on-primary'),
            },
            keyframes: {
                'text-loop': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'text-loop': 'text-loop 10s linear infinite',
            },
            screens: {
                '2xl': '1440px',
                'tall-sm': { 'raw': '(min-height: 640px)' },
                'tall-md': { 'raw': '(min-height: 768px)' },
                'tall-lg': { 'raw': '(min-height: 900px)' },
            },
            lineHeight: {
                'figma': '1.15',
            },
        },
        container: {
            padding: {
                DEFAULT: '1rem',
                sm: '0.5rem',
                lg: '1rem',
                xl: '1.5rem',
                '2xl': '2rem',
            },
        },
        fontSize: {
            xs: '.75rem',
            sm: '.875rem',
            copy:'.875rem',
            base: '1rem',
            md: '1rem',
            lg: '1.25rem',
            xl: '1.5rem',
            '2xl': '2rem',
            max: '2.5rem',
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
