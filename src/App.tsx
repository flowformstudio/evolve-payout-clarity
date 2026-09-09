import { useEffect, useMemo, useState } from 'react'
import raw from './data/payouts-dataset.json'
import type { Dataset } from './lib/types'
import { buildView, listingAverageNightly, summarize } from './lib/derive'
import { fmtDate, moneyWhole } from './lib/format'
import { BookingList } from './components/BookingList'
import { BookingDetail } from './components/BookingDetail'
import { Assumptions } from './components/Assumptions'

const ds = raw as unknown as Dataset

/** The booking Jordan most likely came to see: the most recent payout that has landed. */
function defaultBookingId(): string {
  const today = ds.meta.todayForExercise
  const past = ds.bookings
    .filter((b) => b.payout?.status === 'paid' && (b.payout.depositedDate ?? '') <= today)
    .sort((a, b) => (a.payout!.depositedDate! < b.payout!.depositedDate! ? 1 : -1))
  return past[0]?.id ?? ds.bookings[0].id
}

function idFromHash(): string | null {
  const m = location.hash.match(/#\/bookings\/([^/?]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function App() {
  const [id, setId] = useState<string>(() => idFromHash() ?? defaultBookingId())
  const [showAssumptions, setShowAssumptions] = useState(false)

  useEffect(() => {
    const onHash = () => {
      const h = idFromHash()
      if (h && ds.bookings.some((b) => b.id === h)) setId(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const select = (next: string) => {
    setId(next)
    history.replaceState(null, '', `#/bookings/${encodeURIComponent(next)}`)
    document.querySelector('.main')?.scrollTo({ top: 0 })
  }

  const listingAvg = useMemo(() => listingAverageNightly(ds), [])
  const booking = ds.bookings.find((b) => b.id === id) ?? ds.bookings[0]
  const view = useMemo(() => buildView(ds, booking, listingAvg), [booking, listingAvg])
  const totals = useMemo(() => summarize(ds), [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span>Owner portal</span>
        </div>
        <nav className="topnav" aria-label="Primary">
          <a href="#" onClick={(e) => e.preventDefault()}>
            Overview
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            Calendar
          </a>
          <a href="#/bookings" className="is-active" onClick={(e) => e.preventDefault()}>
            Bookings
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            Earnings
          </a>
        </nav>
        <div className="topbar-right">
          <label className="switcher">
            <span className="sr-only">Property</span>
            <select defaultValue={ds.listing.id}>
              <option value={ds.listing.id}>
                {ds.listing.name} · {ds.listing.city}, {ds.listing.state}
              </option>
              <option disabled>Add another property…</option>
            </select>
          </label>
          <span className="today" title="The exercise treats this as the current date">
            Today {fmtDate(ds.meta.todayForExercise)}
          </span>
          <button className="btn btn-ghost" onClick={() => setShowAssumptions(true)}>
            Assumptions
          </button>
          <span className="avatar" aria-label={ds.owner.displayName}>
            {ds.owner.displayName
              .split(' ')
              .map((w) => w[0])
              .join('')}
          </span>
        </div>
      </header>

      <div className="layout">
        <aside className="rail">
          <div className="rail-summary">
            <div className="stat">
              <span className="stat-label">Paid in {totals.year}</span>
              <span className="stat-value">{moneyWhole(totals.paidYtd)}</span>
              <span className="stat-sub">{totals.nightsYtd} nights</span>
            </div>
            <div className="stat">
              <span className="stat-label">On its way</span>
              <span className="stat-value">{moneyWhole(totals.pending)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Scheduled</span>
              <span className="stat-value">{moneyWhole(totals.scheduled)}</span>
            </div>
          </div>
          <BookingList ds={ds} selectedId={booking.id} onSelect={select} />
        </aside>
        <main className="main">
          <BookingDetail ds={ds} view={view} />
        </main>
      </div>

      {showAssumptions ? <Assumptions onClose={() => setShowAssumptions(false)} /> : null}
    </div>
  )
}
