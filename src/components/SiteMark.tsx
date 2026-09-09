const COLORS: Record<string, string> = {
  Airbnb: '#ff385c',
  VRBO: '#245abc',
  Evolve: '#1e7a5a',
  Expedia: '#fbcc33',
  'Booking.com': '#003580',
  Hopper: '#ff6a2c',
}

export function SiteMark({ site, withLabel = false }: { site: string | null; withLabel?: boolean }) {
  if (!site) return null
  const color = COLORS[site] ?? '#8a8f98'
  return (
    <span className="sitemark" title={site}>
      <span className="sitemark-dot" style={{ background: color }} aria-hidden />
      {withLabel ? <span>{site === 'Evolve' ? 'Evolve direct' : site}</span> : <span className="sr-only">{site}</span>}
    </span>
  )
}
