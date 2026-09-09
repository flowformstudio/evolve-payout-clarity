export function Assumptions({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="asm-title" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2 id="asm-title">Assumptions and dataset notes</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal-body">
          <p>
            The prototype reads <code>payouts-dataset.json</code> unchanged. Every payout amount, fee, tax and date shown comes straight from the file. Where the brief asked for more than the data holds, the gap is filled in code and marked here.
          </p>
          <h3>Derived, not in the dataset</h3>
          <ul>
            <li>
              <strong>Per-night rates.</strong> The file has one “Rate for N nights” line per booking. It is split into nightly rates with Friday and Saturday nights priced 25% above weeknights. Nights always add back up to the file’s base amount to the cent.
            </li>
            <li>
              <strong>Discounts.</strong> None exist in the file, so three are inferred from booking facts: a 10% weekly discount on stays of 7+ nights, a 12% last-minute rate when booked 3 days or less before check-in, and a 5% returning-guest discount. Nightly rates are grossed up so the discounted total still equals the file’s base amount. Payout math is never changed.
            </li>
            <li>
              <strong>“Why these rates”.</strong> Season labels are Austin-specific and month-based (SXSW in March, ACL in October, holidays, summer). The “vs. your average” comparison uses the average nightly rate across all non-canceled bookings in the file.
            </li>
            <li>
              <strong>Year-to-date strip.</strong> Sums paid deposits dated in 2026, plus pending and scheduled payouts.
            </li>
          </ul>
          <h3>Judgement calls</h3>
          <ul>
            <li>Deposit dates in the file land two days after check-in, not the 5 to 9 business days the README describes. The prototype trusts the file’s dates.</li>
            <li>One booking (Reza Farahani, May 14 to 16) is marked paid with a deposit date of May 18, one day after “today”. It is shown as paid, as the file says.</li>
            <li>For the canceled booking the original quote is shown greyed out so the owner can see what the stay was worth, with a clear $0 payout.</li>
            <li>Owner blocks get a minimal page: there is no money to explain, so the page says so and offers to unblock.</li>
            <li>Buttons like “Download statement”, “Ask about this payout” and “Rate settings” are placeholders for flows outside this exercise.</li>
          </ul>
          <h3>Scaling to many owners and properties</h3>
          <p>
            The property switcher in the top bar and the bookings rail are driven entirely by the dataset shape (owner → listing → bookings). A second listing is another entry in the switcher; a second owner is another dataset. Deep links use <code>#/bookings/:id</code> so email and push notifications can land directly on a booking.
          </p>
        </div>
      </div>
    </div>
  )
}
