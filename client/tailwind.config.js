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
                'xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
                'sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],
                'base': ['clamp(0.875rem, 0.85rem + 0.25vw, 1rem)', { lineHeight: '1.6' }],
                'lg': ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.6' }],
                'xl': ['clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)', { lineHeight: '1.5' }],
                '2xl': ['clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)', { lineHeight: '1.4' }],
                '3xl': ['clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)', { lineHeight: '1.3' }],
                '4xl': ['clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)', { lineHeight: '1.2' }],
                '5xl': ['clamp(2.25rem, 1.95rem + 1.5vw, 3rem)', { lineHeight: '1.1' }],
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
