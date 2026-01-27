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
                'xs': ['0.6875rem', { lineHeight: '1.5' }],  /* 11px */
                'sm': ['0.75rem', { lineHeight: '1.5' }],    /* 12px */
                'base': ['0.75rem', { lineHeight: '1.5' }],  /* 12px */
                'lg': ['0.8125rem', { lineHeight: '1.5' }],  /* 13px */
                'xl': ['0.875rem', { lineHeight: '1.5' }],   /* 14px */
                '2xl': ['1rem', { lineHeight: '1.4' }],      /* 16px */
                '3xl': ['1.125rem', { lineHeight: '1.3' }],  /* 18px */
                '4xl': ['1.25rem', { lineHeight: '1.2' }],   /* 20px */
                '5xl': ['1.5rem', { lineHeight: '1.1' }],    /* 24px */
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
