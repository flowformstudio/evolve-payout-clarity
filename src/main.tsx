import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import V2App from './v2/V2App.tsx'
import V3App from './v3/V3App.tsx'
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
  useEffect(() => {
    document.documentElement.classList.toggle('is-v2', v2 || v3)
  }, [v2, v3])
  return (
    <>
      {v3 ? <V3App /> : v2 ? <V2App /> : <App />}
      <OptionSwitcher current={v3 ? 3 : v2 ? 2 : 1} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
