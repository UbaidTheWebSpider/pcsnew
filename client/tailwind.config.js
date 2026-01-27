/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontSize: {
                'xs': ['0.625rem', { lineHeight: '1.5' }],    /* 10px */
                'sm': ['0.625rem', { lineHeight: '1.5' }],    /* 10px */
                'base': ['0.6875rem', { lineHeight: '1.5' }], /* 11px */
                'lg': ['0.6875rem', { lineHeight: '1.5' }],   /* 11px */
                'xl': ['0.75rem', { lineHeight: '1.5' }],     /* 12px */
                '2xl': ['0.8125rem', { lineHeight: '1.4' }],  /* 13px */
                '3xl': ['0.875rem', { lineHeight: '1.3' }],   /* 14px */
                '4xl': ['0.9375rem', { lineHeight: '1.2' }],  /* 15px */
                '5xl': ['1rem', { lineHeight: '1.1' }],       /* 16px */
            },
            spacing: {
                'icon-xs': 'var(--icon-size-xs)',
                'icon-sm': 'var(--icon-size-sm)',
                'icon-md': 'var(--icon-size-md)',
                'icon-lg': 'var(--icon-size-lg)',
                'icon-xl': 'var(--icon-size-xl)',
            }
        },
    },
    plugins: [],
}
