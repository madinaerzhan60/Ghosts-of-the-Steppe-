// Self-hosted fonts (OFL, credited in CREDITS.md): Forum for titles and quotes,
// Golos Text for UI, PT Mono for small labels.
import '@fontsource/forum/400.css'
import '@fontsource/golos-text/400.css'
import '@fontsource/pt-mono/400.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { palette } from './theme/palette'

// Expose the palette as CSS variables (--color-uki, ...) so CSS never hard-codes colours.
for (const [name, value] of Object.entries(palette)) {
  document.documentElement.style.setProperty(`--color-${name}`, value)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
