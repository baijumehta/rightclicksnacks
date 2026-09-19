/* global React */
function Hero({ onCTA }) {
  window.useLucide();
  const Icon = window.Icon;
  return (
    <section className="rc-hero rc-hero-dark">
      <image-slot
        id="rc-hero-photo"
        className="rc-hero-photo"
        shape="rect"
        fit="cover"
        placeholder="Drop a hero photo (e.g. city skyline)"
      ></image-slot>
      <div className="rc-hero-overlay"></div>
      <div className="rc-container rc-hero-inner">
        <div className="rc-hero-copy">
          <h1>Is your IT company there to help <span className="rc-hl">when you really need it</span>?</h1>
          <p className="rc-body-lg">
            Right Click delivers high-touch Managed IT and AI consulting, with 24/7 support, onsite
            service, and personal relationships that help businesses modernize, scale, and succeed.
          </p>
          <div className="rc-hero-cta">
            <button className="rc-btn rc-btn-primary rc-btn-lg" onClick={onCTA}>Get IT Support <Icon name="arrow-right" size={18} /></button>
            <button className="rc-btn rc-btn-ondark rc-btn-lg">See our process</button>
          </div>
          <div className="rc-hero-trust">
            <span><Icon name="shield-check" size={16} /> CMMC L2 · HIPAA</span>
            <span><Icon name="map-pin" size={16} /> Local to Irvine, CA</span>
            <span><Icon name="badge-check" size={16} /> 100% independent since 1997</span>
          </div>
        </div>
        <div className="rc-hero-card">
          <div className="rc-statuscard">
            <div className="rc-statuscard-top">
              <span className="rc-statuscard-dot"></span> All systems monitored
              <span className="rc-statuscard-time">Live</span>
            </div>
            {[
              ["server", "Network & servers", "Healthy", "ok"],
              ["shield", "Endpoint security", "Protected", "ok"],
              ["cloud", "Microsoft 365 backup", "Synced 2m ago", "ok"],
              ["alert-triangle", "Patch updates", "3 scheduled", "warn"],
            ].map(([ic, label, val, st]) => (
              <div className="rc-statusrow" key={label}>
                <span className="rc-statusrow-ic"><Icon name={ic} size={18} /></span>
                <span className="rc-statusrow-label">{label}</span>
                <span className={"rc-statusrow-val " + st}>{val}</span>
              </div>
            ))}
            <div className="rc-statuscard-foot">
              <Icon name="headphones" size={15} /> Avg. response time <b>&lt; 12 min</b>
            </div>
          </div>
        </div>
      </div>
      <div className="rc-trustbar">
        <div className="rc-container rc-trustbar-inner">
          <span>Trusted since 1997 by teams in</span>
          <b>Architecture &amp; Engineering</b><i>·</i>
          <b>Aerospace &amp; Defense</b><i>·</i>
          <b>Healthcare</b><i>·</i>
          <b>Commercial Real Estate</b>
        </div>
      </div>
    </section>
  );
}
window.Hero = Hero;
