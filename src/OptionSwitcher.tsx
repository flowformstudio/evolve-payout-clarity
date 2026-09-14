/** Floating pill to move between the design options in this repo. Prototype navigation only. */
const OPTIONS: { key: 'final' | 1 | 2 | 3 | 4 | 5; href: string; label: string }[] = [
  { key: 'final', href: '#/final', label: 'Final' },
  { key: 1, href: '#/', label: '1' },
  { key: 2, href: '#/v2', label: '2' },
  { key: 3, href: '#/v3', label: '3' },
  { key: 4, href: '#/v4', label: '4' },
  { key: 5, href: '#/v5', label: '5' },
]

export function OptionSwitcher({ current }: { current: 'final' | 1 | 2 | 3 | 4 | 5 }) {
  return (
    <nav className="optsw" aria-label="Design options">
      {OPTIONS.map((o) => (
        <a key={String(o.key)} href={o.href} className={current === o.key ? 'is-active' : ''} aria-current={current === o.key ? 'page' : undefined}>
          {o.label}
        </a>
      ))}
    </nav>
  )
}
