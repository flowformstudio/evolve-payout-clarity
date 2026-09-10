import { FlaskConical } from 'lucide-react'
import type { Booking } from '../../lib/types'

export interface DemoState {
  key: string
  label: string
  id: string
}

/** Discreet demo control: switch between representative payout states. Prototype only. */
export function BookingStateSwitcher({ states, current, onSelect }: { states: DemoState[]; current: Booking; onSelect: (id: string) => void }) {
  return (
    <div className="demo" aria-label="Demo states">
      <span className="demo-label">
        <FlaskConical size={12} aria-hidden /> Demo states
      </span>
      {states.map((s) => (
        <button key={s.key} className={`demo-btn ${current.id === s.id ? 'is-active' : ''}`} onClick={() => onSelect(s.id)} aria-pressed={current.id === s.id}>
          {s.label}
        </button>
      ))}
    </div>
  )
}
