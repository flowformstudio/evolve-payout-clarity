/** Floating pill to move between the design options in this repo. Prototype navigation only. */
export function OptionSwitcher({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav className="optsw" aria-label="Design options">
      <a href="#/" className={current === 1 ? 'is-active' : ''} aria-current={current === 1 ? 'page' : undefined}>
        Option 1
      </a>
      <a href="#/v2" className={current === 2 ? 'is-active' : ''} aria-current={current === 2 ? 'page' : undefined}>
        Option 2
      </a>
      <a href="#/v3" className={current === 3 ? 'is-active' : ''} aria-current={current === 3 ? 'page' : undefined}>
        Option 3
      </a>
    </nav>
  )
}
