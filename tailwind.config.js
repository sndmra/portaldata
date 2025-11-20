/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#d9ab6c', // IKN Gold
                secondary: '#c99a5a', // Darker gold for hover
                background: '#F5F7FA', // Light gray background
                card: '#FFFFFF',
                border: '#E2E8F0',
                text: '#1E293B',
                muted: '#64748B',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
