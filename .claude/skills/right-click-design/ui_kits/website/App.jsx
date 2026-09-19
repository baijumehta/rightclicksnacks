/* global React */
const { useState } = React;

function ConsultModal({ open, onClose }) {
  window.useLucide();
  const Icon = window.Icon;
  const [sent, setSent] = useState(false);
  if (!open) return null;
  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div className="rc-modal" onClick={e => e.stopPropagation()}>
        <button className="rc-modal-close" onClick={onClose}><Icon name="x" size={20} /></button>
        {!sent ? (
          <>
            <span className="rc-label blue">Get IT support</span>
            <h3>Talk to a real engineer</h3>
            <p className="rc-small">Tell us a little about your business. We'll reach out within one business day, usually much sooner.</p>
            <form className="rc-form" onSubmit={e => { e.preventDefault(); setSent(true); }}>
              <div className="rc-form-row">
                <label>Name<input required placeholder="Jordan Reyes" /></label>
                <label>Company<input required placeholder="Acme Engineering" /></label>
              </div>
              <div className="rc-form-row">
                <label>Work email<input required type="email" placeholder="you@company.com" /></label>
                <label>Phone<input placeholder="(714) 555-0100" /></label>
              </div>
              <label>How can we help?
                <select defaultValue="">
                  <option value="" disabled>Choose a practice…</option>
                  <option>Managed IT (Fully Managed or Co-Managed)</option>
                  <option>Cybersecurity</option>
                  <option>Managed Compliance (CMMC / HIPAA)</option>
                  <option>AI Consulting & Transformation</option>
                  <option>Something else</option>
                </select>
              </label>
              <button className="rc-btn rc-btn-primary rc-btn-lg" type="submit" style={{ width: "100%", justifyContent: "center" }}>
                Request consultation <Icon name="arrow-right" size={18} />
              </button>
              <p className="rc-form-fine"><Icon name="lock" size={13} /> Your information stays private. No spam, ever.</p>
            </form>
          </>
        ) : (
          <div className="rc-form-success">
            <span className="rc-success-ic"><Icon name="check" size={30} /></span>
            <h3>Request received</h3>
            <p className="rc-small">Thanks. A Right Click engineer will be in touch within one business day. For anything urgent, call (714) 790-9412.</p>
            <button className="rc-btn rc-btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = useState("Services");
  const [modal, setModal] = useState(false);

  const scrollTo = (name) => {
    setActive(name);
    const map = { Services: "services", Squad: "squad", Industries: "industries", About: "about", Process: "process", Contact: null };
    if (name === "Contact") { setModal(true); return; }
    const id = map[name];
    const el = id && document.getElementById(id);
    const root = document.querySelector(".rc-scroll");
    if (el && root) root.scrollTo({ top: el.offsetTop - 72, behavior: "smooth" });
  };

  return (
    <>
      <div className="rc-scroll">
        <window.Header active={active} onNav={scrollTo} onCTA={() => setModal(true)} />
        <main>
          <window.Hero onCTA={() => setModal(true)} />
          <window.Services onPick={() => setModal(true)} />
          <window.Stats />
          <window.Squad />
          <window.Industries />
          <window.Process />
          <window.Testimonial />
          <window.CTASection onCTA={() => setModal(true)} />
          <window.Footer />
        </main>
      </div>
      <ConsultModal open={modal} onClose={() => setModal(false)} />
    </>
  );
}

window.App = App;
