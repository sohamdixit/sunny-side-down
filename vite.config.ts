import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Android 10 shipped WebView ~Chrome 77. WebView updates independently of
    // the OS so most devices are far newer, but a phone that never updated
    // would hit a syntax error on ??= (Chrome 85) and show a blank screen.
    target: 'chrome77',
  },
  plugins: [react()],
})
