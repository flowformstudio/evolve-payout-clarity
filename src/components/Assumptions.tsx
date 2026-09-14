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
          <h3>Option 2 additions</h3>
          <ul>
            <li>
              <strong>Nightly rate calendar.</strong> Prices on days outside this booking come from a simple seasonal model for the listing (weeknight base by month, Friday and Saturday 25% higher). Nights of other bookings show that booking’s derived rate. All of it lives in <code>src/v2/prototype-additions.ts</code> and none of it is in the dataset.
            </li>
            <li>
              <strong>Two example discounts.</strong> A 10% midweek discount on Tuesday and Wednesday nights for stays of 5+ nights, and a 10% weekly discount for 7+ nights. Illustrative only. The nights still sum to the file’s base amount exactly.
            </li>
            <li>
              <strong>One property.</strong> Jordan owns one listing, so Option 2 has no property switcher. Scaling to more listings is a data-shape question (owner → listing → bookings), not a UI control.
            </li>
          </ul>
          <h3>Final option</h3>
          <ul>
            <li>
              <strong>Interactive rate calendar.</strong> Hover any night for the reason behind its price (rate type, season, discount, your share after the 15% fee). Click to keep the card open. Rates on nights outside this booking use the same seasonal model as Option 2.
            </li>
            <li>
              <strong>One guest persona in the demo states.</strong> The Pending, Paid, Scheduled and Canceled demo states are four different bookings in the file (guests Adaeze Okafor, Tobias Ackerman, Olivia Trent and Booker Mathis). To keep the demo readable they are all shown as Adaeze Okafor. Booking IDs, dates, channels and every dollar amount are the file’s own.
            </li>
            <li>
              <strong>Payout timing copy.</strong> Follows the README and the dataset’s <code>payoutTimingNote</code>: processed about 2 business days after check-in, landing 5 to 9 business days after check-in. The file’s own deposit dates are used as-is.
            </li>
            <li>
              <strong>Canceled bookings.</strong> The file records a $0 payout and $0 fee. The refund wording is an assumption; the file does not say what the guest was charged or returned.
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
