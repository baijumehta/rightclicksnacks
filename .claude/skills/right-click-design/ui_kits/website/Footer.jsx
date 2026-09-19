/* global React */
function CTASection({ onCTA }) {
  window.useLucide();
  const Icon = window.Icon;
  return (
    <section className="rc-cta">
      <div className="rc-container rc-cta-inner">
        <div>
          <h2>The best time to get your IT right was five years ago.</h2>
          <p className="rc-body-lg">The second best time is now. Talk to a real engineer about your systems, security, and compliance, with no call-center runaround.</p>
        </div>
        <button className="rc-btn rc-btn-amber rc-btn-lg" onClick={onCTA}>Book a consultation <Icon name="arrow-right" size={18} /></button>
      </div>
    </section>
  );
}

function Footer() {
  window.useLucide();
  const Icon = window.Icon;
  const cols = [
    ["Practices", ["Managed IT", "Cybersecurity", "Managed Compliance", "AI Consulting & Transformation"]],
    ["Industries", ["Architecture & Engineering", "Healthcare", "Aerospace & Defense", "& other industries"]],
    ["Company", ["About us", "Our Squad model", "Our process", "Client stories", "Contact"]],
  ];
  return (
    <footer className="rc-footer">
      <div className="rc-container rc-footer-inner">
        <div className="rc-footer-brand">
          <div className="rc-logo">
            <img className="rc-logo-lockup" src={(window.__resources && window.__resources.logoLockupWhite) || "../../assets/right-click-lockup-white.png"} alt="Right Click" />
          </div>
          <p>A full-service Managed IT and AI consulting firm. Responsive, hands-on, and 100% independent since 1997.</p>
          <div className="rc-footer-contact">
            <span><Icon name="map-pin" size={15} /> 20 Corporate Park, Suite 400, Irvine, CA 92606</span>
            <span><Icon name="phone" size={15} /> (714) 790-9412</span>
            <span><Icon name="mail" size={15} /> sales@rclick.com</span>
          </div>
        </div>
        <div className="rc-footer-cols">
          {cols.map(([h, items]) => (
            <div key={h}>
              <h5>{h}</h5>
              {items.map(it => <a key={it}>{it}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div className="rc-footer-bar">
        <div className="rc-container rc-footer-bar-inner">
          <span>© 1997–2026 Right Click, Inc. All rights reserved.</span>
          <span className="rc-footer-badges">
            <span className="rc-pill-mini"><svg width="15" height="15" viewBox="0 0 23 23" style={{display:"block",flex:"none"}}><path fill="#f35325" d="M1 1h10v10H1z"></path><path fill="#81bc06" d="M12 1h10v10H12z"></path><path fill="#05a6f0" d="M1 12h10v10H1z"></path><path fill="#ffba08" d="M12 12h10v10H12z"></path></svg> Microsoft Solutions Partner</span>
            <span className="rc-pill-mini"><svg width="15" height="15" viewBox="0 0 100 100" fill="#D97757" style={{display:"block",flex:"none"}}><path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z"></path></svg> Anthropic Certified Partner</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

window.CTASection = CTASection;
window.Footer = Footer;
