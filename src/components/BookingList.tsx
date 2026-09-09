import { useEffect } from 'react'
import type { Booking, Dataset } from '../lib/types'
import { phaseOf, type Phase } from '../lib/derive'
import { fmtRange, money } from '../lib/format'
import { SiteMark } from './SiteMark'

const PHASE_LABEL: Record<Phase, string> = {
  in_progress: 'In progress',
  upcoming: 'Upcoming',
  completed: 'Completed',
  canceled: 'Canceled',
  blocked: 'Blocked',
}

interface Props {
  ds: Dataset
  selectedId: string
  onSelect: (id: string) => void
}

export function BookingList({ ds, selectedId, onSelect }: Props) {
  const today = ds.meta.todayForExercise
  useEffect(() => {
    // Scroll only the rail, never the page.
    const rail = document.querySelector<HTMLElement>('.rail')
    const el = document.querySelector<HTMLElement>('.list-item.is-selected')
    if (!rail || !el) return
    const r = rail.getBoundingClientRect()
    const e = el.getBoundingClientRect()
    if (e.top < r.top + 80 || e.bottom > r.bottom - 40) {
      rail.scrollTop += e.top - r.top - r.height / 2 + e.height / 2
    }
  }, [selectedId])
  const sorted = [...ds.bookings].sort((a, b) => (a.stay.checkIn < b.stay.checkIn ? 1 : -1))

  const groups: { title: string; items: Booking[] }[] = [
    { title: 'Now', items: sorted.filter((b) => phaseOf(b) === 'in_progress') },
    { title: 'Upcoming', items: sorted.filter((b) => b.stay.checkIn > today && phaseOf(b) !== 'in_progress').reverse() },
    { title: 'Past', items: sorted.filter((b) => b.stay.checkIn <= today && phaseOf(b) !== 'in_progress') },
  ]

  return (
    <nav className="list" aria-label="Bookings">
      {groups.map((g) =>
        g.items.length ? (
          <section key={g.title} className="list-group">
            <h3 className="list-group-title">{g.title}</h3>
            {g.items.map((b) => {
              const phase = phaseOf(b)
              const selected = b.id === selectedId
              const payout = b.payout
              return (
                <button
                  key={b.id}
                  className={`list-item phase-${phase} ${selected ? 'is-selected' : ''}`}
                  onClick={() => onSelect(b.id)}
                  aria-current={selected ? 'page' : undefined}
                >
                  <div className="list-item-main">
                    <div className="list-item-title">
                      {phase === 'blocked' ? (
                        <span className="muted">Owner block</span>
                      ) : (
                        <>
                          <SiteMark site={b.bookingSite} />
                          <span>{b.guest?.name ?? 'Guest'}</span>
                        </>
                      )}
                    </div>
                    <div className="list-item-sub">
                      {fmtRange(b.stay.checkIn, b.stay.checkOut)} · {b.stay.nights}n
                    </div>
                  </div>
                  <div className="list-item-side">
                    {payout ? (
                      <div className={`list-amount ${payout.status === 'canceled' ? 'muted' : ''}`}>
                        {payout.status === 'canceled' ? '$0' : money(payout.amount)}
                      </div>
                    ) : (
                      <div className="list-amount muted">—</div>
                    )}
                    <div className={`pill pill-${payout?.status ?? phase}`}>
                      {payout ? payoutLabel(payout.status) : PHASE_LABEL[phase]}
                    </div>
                  </div>
                </button>
              )
            })}
          </section>
        ) : null,
      )}
    </nav>
  )
}

export function payoutLabel(s: string) {
  switch (s) {
    case 'paid':
      return 'Paid'
    case 'pending':
      return 'On its way'
    case 'scheduled':
      return 'Scheduled'
    case 'canceled':
      return 'Canceled'
    default:
      return s
  }
}
