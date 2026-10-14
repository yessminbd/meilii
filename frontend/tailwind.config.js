/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#242426",
                primaryLight: "#FFFFFF",
                secondary: "#2E2F31",
                tertiary: "#E80B4A",
                gray: {
                    10: "#EEEEEE",
                    20: "#A2A2A2",
                    30: "#7B7B7B",
                    50: "#585858",
                    90: "#141414",
                },
            },
            screens: {
                xs: "400px",
                "3xl": "1680px",
                "4xl": "2200px",
            },
        },
    },
    plugins: [],
}