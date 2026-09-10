import { useEffect, useId, useRef, useState } from 'react'
import { Info as InfoIcon } from 'lucide-react'

/** Small "i" affordance that opens a plain-language explanation. Click or keyboard. */
export function Info({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span className="info" ref={ref}>
      <button
        type="button"
        className="info-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <InfoIcon size={14} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <span className="info-pop" role="dialog" id={id}>
          {children}
        </span>
      ) : null}
    </span>
  )
}
