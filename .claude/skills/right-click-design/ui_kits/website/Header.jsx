/* global React, lucide */
const { useEffect, useRef } = React;

// Re-render Lucide icons after every paint
function useLucide() {
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
}

function Icon({ name, size, cls, style }) {
  return <i data-lucide={name} className={cls} style={{ width: size || 20, height: size || 20, ...(style||{}) }}></i>;
}

const NAV = ["Services", "Squad", "Industries", "Process", "Contact"];

function Header({ active, onNav, onCTA }) {
  useLucide();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  useEffect(() => {
    const root = document.querySelector(".rc-scroll");
    const el = root || window;
    const onScroll = () => setScrolled((root ? root.scrollTop : window.scrollY) > 12);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={"rc-header" + (scrolled ? " is-scrolled" : "")}>
      <div className="rc-container rc-header-inner">
        <a className="rc-logo" onClick={() => onNav("Services")}>
          <img className="rc-logo-lockup" src={(window.__resources && window.__resources.logoLockup) || "../../assets/right-click-lockup.png"} alt="Right Click" />
        </a>
        <nav className="rc-nav">
          {NAV.map(n => (
            <a key={n} className={active === n ? "active" : ""} onClick={() => onNav(n)}>{n}</a>
          ))}
        </nav>
        <div className="rc-header-actions">
          <a className="rc-phone"><Icon name="phone" size={16} /> (714) 790-9412</a>
          <button className="rc-btn rc-btn-primary" onClick={onCTA}>Get IT Support</button>
        </div>
        <button className="rc-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <Icon name={open ? "x" : "menu"} size={24} />
        </button>
      </div>
      {open && (
        <div className="rc-mobile-nav">
          {NAV.map(n => (
            <a key={n} className={active === n ? "active" : ""} onClick={() => { onNav(n); setOpen(false); }}>{n}</a>
          ))}
          <button className="rc-btn rc-btn-primary" onClick={() => { onCTA(); setOpen(false); }}>Get IT Support</button>
        </div>
      )}
    </header>
  );
}

window.Icon = Icon;
window.useLucide = useLucide;
window.Header = Header;
