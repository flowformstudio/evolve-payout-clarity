import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import V2App from './v2/V2App.tsx'
import V3App from './v3/V3App.tsx'
import V4App from './v4/V4App.tsx'
import V5App from './v5/V5App.tsx'
import { OptionSwitcher } from './OptionSwitcher.tsx'

/** Option routing: "#/v2..." renders Option 2, anything else Option 1. */
function Root() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const v2 = hash.startsWith('#/v2')
  const v3 = hash.startsWith('#/v3')
  const v4 = hash.startsWith('#/v4')
  const v5 = hash.startsWith('#/v5')
  useEffect(() => {
    document.documentElement.classList.toggle('is-v2', v2 || v3 || v4 || v5)
  }, [v2, v3, v4, v5])
  return (
    <>
      {v5 ? <V5App /> : v4 ? <V4App /> : v3 ? <V3App /> : v2 ? <V2App /> : <App />}
      <OptionSwitcher current={v5 ? 5 : v4 ? 4 : v3 ? 3 : v2 ? 2 : 1} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
