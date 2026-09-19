/* @ds-bundle: {"format":4,"namespace":"RightClickDesignSystem_e28aa0","components":[{"name":"Button","sourcePath":"components/Button.jsx"}],"sourceHashes":{"components/Button.jsx":"32b9f564452e","ui_kits/website/App.jsx":"fde11cc33646","ui_kits/website/Footer.jsx":"b57846e77b13","ui_kits/website/Header.jsx":"dc2d3ed4d08b","ui_kits/website/Hero.jsx":"8e8943a59aca","ui_kits/website/Sections.jsx":"c578664bba84","ui_kits/website/image-slot.js":"cf5f1791dd04"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.RightClickDesignSystem_e28aa0 = window.RightClickDesignSystem_e28aa0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/Button.jsx
try { (() => {
const SIZES = {
  md: {
    padding: "11px 20px",
    fontSize: 15,
    radius: 8
  },
  lg: {
    padding: "14px 26px",
    fontSize: 16,
    radius: 10
  }
};
const VARIANTS = {
  primary: {
    background: "var(--blue-500)",
    color: "#fff",
    border: "1.5px solid transparent",
    hover: "var(--blue-600)"
  },
  secondary: {
    background: "#fff",
    color: "var(--navy-900)",
    border: "1.5px solid var(--gray-300)",
    hover: "var(--gray-50)"
  },
  navy: {
    background: "var(--navy-900)",
    color: "#fff",
    border: "1.5px solid transparent",
    hover: "var(--navy-800)"
  },
  ghost: {
    background: "transparent",
    color: "var(--blue-600)",
    border: "1.5px solid transparent",
    hover: "var(--blue-100)"
  },
  amber: {
    background: "var(--rc-amber)",
    color: "var(--navy-900)",
    border: "1.5px solid transparent",
    hover: "var(--rc-amber-soft)"
  },
  ondark: {
    background: "#fff",
    color: "var(--navy-900)",
    border: "1.5px solid #fff",
    hover: "var(--gray-50)"
  }
};
function Button({
  variant = "primary",
  size = "md",
  children,
  icon,
  disabled = false,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const iconRef = React.useRef(null);
  React.useEffect(() => {
    if (icon && window.lucide) window.lucide.createIcons({
      nodes: iconRef.current ? [iconRef.current] : undefined
    });
  }, [icon, children]);
  const style = {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: s.fontSize,
    lineHeight: 1,
    padding: s.padding,
    borderRadius: s.radius,
    border: v.border,
    background: hover && !disabled ? v.hover : v.background,
    color: v.color,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "background 160ms cubic-bezier(0.22,1,0.36,1), border-color 160ms, color 160ms",
    whiteSpace: "nowrap"
  };
  return /*#__PURE__*/React.createElement("button", {
    style: style,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, children, icon ? /*#__PURE__*/React.createElement("i", {
    ref: iconRef,
    "data-lucide": icon,
    style: {
      width: s.fontSize + 2,
      height: s.fontSize + 2
    }
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Button.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/App.jsx
try { (() => {
/* global React */
const {
  useState
} = React;
function ConsultModal({
  open,
  onClose
}) {
  window.useLucide();
  const Icon = window.Icon;
  const [sent, setSent] = useState(false);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "rc-modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "rc-modal-close",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 20
  })), !sent ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "rc-label blue"
  }, "Get IT support"), /*#__PURE__*/React.createElement("h3", null, "Talk to a real engineer"), /*#__PURE__*/React.createElement("p", {
    className: "rc-small"
  }, "Tell us a little about your business. We'll reach out within one business day, usually much sooner."), /*#__PURE__*/React.createElement("form", {
    className: "rc-form",
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    required: true,
    placeholder: "Jordan Reyes"
  })), /*#__PURE__*/React.createElement("label", null, "Company", /*#__PURE__*/React.createElement("input", {
    required: true,
    placeholder: "Acme Engineering"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "rc-form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Work email", /*#__PURE__*/React.createElement("input", {
    required: true,
    type: "email",
    placeholder: "you@company.com"
  })), /*#__PURE__*/React.createElement("label", null, "Phone", /*#__PURE__*/React.createElement("input", {
    placeholder: "(714) 555-0100"
  }))), /*#__PURE__*/React.createElement("label", null, "How can we help?", /*#__PURE__*/React.createElement("select", {
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Choose a practice\u2026"), /*#__PURE__*/React.createElement("option", null, "Managed IT (Fully Managed or Co-Managed)"), /*#__PURE__*/React.createElement("option", null, "Cybersecurity"), /*#__PURE__*/React.createElement("option", null, "Managed Compliance (CMMC / HIPAA)"), /*#__PURE__*/React.createElement("option", null, "AI Consulting & Transformation"), /*#__PURE__*/React.createElement("option", null, "Something else"))), /*#__PURE__*/React.createElement("button", {
    className: "rc-btn rc-btn-primary rc-btn-lg",
    type: "submit",
    style: {
      width: "100%",
      justifyContent: "center"
    }
  }, "Request consultation ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 18
  })), /*#__PURE__*/React.createElement("p", {
    className: "rc-form-fine"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 13
  }), " Your information stays private. No spam, ever."))) : /*#__PURE__*/React.createElement("div", {
    className: "rc-form-success"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-success-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 30
  })), /*#__PURE__*/React.createElement("h3", null, "Request received"), /*#__PURE__*/React.createElement("p", {
    className: "rc-small"
  }, "Thanks. A Right Click engineer will be in touch within one business day. For anything urgent, call (714) 790-9412."), /*#__PURE__*/React.createElement("button", {
    className: "rc-btn rc-btn-primary",
    onClick: onClose
  }, "Done"))));
}
function App() {
  const [active, setActive] = useState("Services");
  const [modal, setModal] = useState(false);
  const scrollTo = name => {
    setActive(name);
    const map = {
      Services: "services",
      Squad: "squad",
      Industries: "industries",
      About: "about",
      Process: "process",
      Contact: null
    };
    if (name === "Contact") {
      setModal(true);
      return;
    }
    const id = map[name];
    const el = id && document.getElementById(id);
    const root = document.querySelector(".rc-scroll");
    if (el && root) root.scrollTo({
      top: el.offsetTop - 72,
      behavior: "smooth"
    });
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "rc-scroll"
  }, /*#__PURE__*/React.createElement(window.Header, {
    active: active,
    onNav: scrollTo,
    onCTA: () => setModal(true)
  }), /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(window.Hero, {
    onCTA: () => setModal(true)
  }), /*#__PURE__*/React.createElement(window.Services, {
    onPick: () => setModal(true)
  }), /*#__PURE__*/React.createElement(window.Stats, null), /*#__PURE__*/React.createElement(window.Squad, null), /*#__PURE__*/React.createElement(window.Industries, null), /*#__PURE__*/React.createElement(window.Process, null), /*#__PURE__*/React.createElement(window.Testimonial, null), /*#__PURE__*/React.createElement(window.CTASection, {
    onCTA: () => setModal(true)
  }), /*#__PURE__*/React.createElement(window.Footer, null))), /*#__PURE__*/React.createElement(ConsultModal, {
    open: modal,
    onClose: () => setModal(false)
  }));
}
window.App = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Footer.jsx
try { (() => {
/* global React */
function CTASection({
  onCTA
}) {
  window.useLucide();
  const Icon = window.Icon;
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-cta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-cta-inner"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "The best time to get your IT right was five years ago."), /*#__PURE__*/React.createElement("p", {
    className: "rc-body-lg"
  }, "The second best time is now. Talk to a real engineer about your systems, security, and compliance, with no call-center runaround.")), /*#__PURE__*/React.createElement("button", {
    className: "rc-btn rc-btn-amber rc-btn-lg",
    onClick: onCTA
  }, "Book a consultation ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 18
  }))));
}
function Footer() {
  window.useLucide();
  const Icon = window.Icon;
  const cols = [["Practices", ["Managed IT", "Cybersecurity", "Managed Compliance", "AI Consulting & Transformation"]], ["Industries", ["Architecture & Engineering", "Healthcare", "Aerospace & Defense", "& other industries"]], ["Company", ["About us", "Our Squad model", "Our process", "Client stories", "Contact"]]];
  return /*#__PURE__*/React.createElement("footer", {
    className: "rc-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-footer-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-footer-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-logo"
  }, /*#__PURE__*/React.createElement("img", {
    className: "rc-logo-lockup",
    src: window.__resources && window.__resources.logoLockupWhite || "../../assets/right-click-lockup-white.png",
    alt: "Right Click"
  })), /*#__PURE__*/React.createElement("p", null, "A full-service Managed IT and AI consulting firm. Responsive, hands-on, and 100% independent since 1997."), /*#__PURE__*/React.createElement("div", {
    className: "rc-footer-contact"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 15
  }), " 20 Corporate Park, Suite 400, Irvine, CA 92606"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 15
  }), " (714) 790-9412"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 15
  }), " sales@rclick.com"))), /*#__PURE__*/React.createElement("div", {
    className: "rc-footer-cols"
  }, cols.map(([h, items]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("h5", null, h), items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it
  }, it)))))), /*#__PURE__*/React.createElement("div", {
    className: "rc-footer-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-footer-bar-inner"
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 1997\u20132026 Right Click, Inc. All rights reserved."), /*#__PURE__*/React.createElement("span", {
    className: "rc-footer-badges"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-pill-mini"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 23 23",
    style: {
      display: "block",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    fill: "#f35325",
    d: "M1 1h10v10H1z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#81bc06",
    d: "M12 1h10v10H12z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#05a6f0",
    d: "M1 12h10v10H1z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#ffba08",
    d: "M12 12h10v10H12z"
  })), " Microsoft Solutions Partner"), /*#__PURE__*/React.createElement("span", {
    className: "rc-pill-mini"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 100 100",
    fill: "#D97757",
    style: {
      display: "block",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z"
  })), " Anthropic Certified Partner")))));
}
window.CTASection = CTASection;
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Header.jsx
try { (() => {
/* global React, lucide */
const {
  useEffect,
  useRef
} = React;

// Re-render Lucide icons after every paint
function useLucide() {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}
function Icon({
  name,
  size,
  cls,
  style
}) {
  return /*#__PURE__*/React.createElement("i", {
    "data-lucide": name,
    className: cls,
    style: {
      width: size || 20,
      height: size || 20,
      ...(style || {})
    }
  });
}
const NAV = ["Services", "Squad", "Industries", "Process", "Contact"];
function Header({
  active,
  onNav,
  onCTA
}) {
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
  return /*#__PURE__*/React.createElement("header", {
    className: "rc-header" + (scrolled ? " is-scrolled" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-header-inner"
  }, /*#__PURE__*/React.createElement("a", {
    className: "rc-logo",
    onClick: () => onNav("Services")
  }, /*#__PURE__*/React.createElement("img", {
    className: "rc-logo-lockup",
    src: window.__resources && window.__resources.logoLockup || "../../assets/right-click-lockup.png",
    alt: "Right Click"
  })), /*#__PURE__*/React.createElement("nav", {
    className: "rc-nav"
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    className: active === n ? "active" : "",
    onClick: () => onNav(n)
  }, n))), /*#__PURE__*/React.createElement("div", {
    className: "rc-header-actions"
  }, /*#__PURE__*/React.createElement("a", {
    className: "rc-phone"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 16
  }), " (714) 790-9412"), /*#__PURE__*/React.createElement("button", {
    className: "rc-btn rc-btn-primary",
    onClick: onCTA
  }, "Get IT Support")), /*#__PURE__*/React.createElement("button", {
    className: "rc-burger",
    onClick: () => setOpen(o => !o),
    "aria-label": "Menu"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: open ? "x" : "menu",
    size: 24
  }))), open && /*#__PURE__*/React.createElement("div", {
    className: "rc-mobile-nav"
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    className: active === n ? "active" : "",
    onClick: () => {
      onNav(n);
      setOpen(false);
    }
  }, n)), /*#__PURE__*/React.createElement("button", {
    className: "rc-btn rc-btn-primary",
    onClick: () => {
      onCTA();
      setOpen(false);
    }
  }, "Get IT Support")));
}
window.Icon = Icon;
window.useLucide = useLucide;
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Hero.jsx
try { (() => {
/* global React */
function Hero({
  onCTA
}) {
  window.useLucide();
  const Icon = window.Icon;
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-hero rc-hero-dark"
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "rc-hero-photo",
    className: "rc-hero-photo",
    shape: "rect",
    fit: "cover",
    placeholder: "Drop a hero photo (e.g. city skyline)"
  }), /*#__PURE__*/React.createElement("div", {
    className: "rc-hero-overlay"
  }), /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-hero-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-hero-copy"
  }, /*#__PURE__*/React.createElement("h1", null, "Is your IT company there to help ", /*#__PURE__*/React.createElement("span", {
    className: "rc-hl"
  }, "when you really need it"), "?"), /*#__PURE__*/React.createElement("p", {
    className: "rc-body-lg"
  }, "Right Click delivers high-touch Managed IT and AI consulting, with 24/7 support, onsite service, and personal relationships that help businesses modernize, scale, and succeed."), /*#__PURE__*/React.createElement("div", {
    className: "rc-hero-cta"
  }, /*#__PURE__*/React.createElement("button", {
    className: "rc-btn rc-btn-primary rc-btn-lg",
    onClick: onCTA
  }, "Get IT Support ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    className: "rc-btn rc-btn-ondark rc-btn-lg"
  }, "See our process")), /*#__PURE__*/React.createElement("div", {
    className: "rc-hero-trust"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 16
  }), " CMMC L2 \xB7 HIPAA"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16
  }), " Local to Irvine, CA"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "badge-check",
    size: 16
  }), " 100% independent since 1997"))), /*#__PURE__*/React.createElement("div", {
    className: "rc-hero-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-statuscard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-statuscard-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-statuscard-dot"
  }), " All systems monitored", /*#__PURE__*/React.createElement("span", {
    className: "rc-statuscard-time"
  }, "Live")), [["server", "Network & servers", "Healthy", "ok"], ["shield", "Endpoint security", "Protected", "ok"], ["cloud", "Microsoft 365 backup", "Synced 2m ago", "ok"], ["alert-triangle", "Patch updates", "3 scheduled", "warn"]].map(([ic, label, val, st]) => /*#__PURE__*/React.createElement("div", {
    className: "rc-statusrow",
    key: label
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-statusrow-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    className: "rc-statusrow-label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "rc-statusrow-val " + st
  }, val))), /*#__PURE__*/React.createElement("div", {
    className: "rc-statuscard-foot"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "headphones",
    size: 15
  }), " Avg. response time ", /*#__PURE__*/React.createElement("b", null, "< 12 min"))))), /*#__PURE__*/React.createElement("div", {
    className: "rc-trustbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-trustbar-inner"
  }, /*#__PURE__*/React.createElement("span", null, "Trusted since 1997 by teams in"), /*#__PURE__*/React.createElement("b", null, "Architecture & Engineering"), /*#__PURE__*/React.createElement("i", null, "\xB7"), /*#__PURE__*/React.createElement("b", null, "Aerospace & Defense"), /*#__PURE__*/React.createElement("i", null, "\xB7"), /*#__PURE__*/React.createElement("b", null, "Healthcare"), /*#__PURE__*/React.createElement("i", null, "\xB7"), /*#__PURE__*/React.createElement("b", null, "Commercial Real Estate"))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Sections.jsx
try { (() => {
/* global React */
const PILLARS = [["server-cog", "Managed IT", "The day-to-day foundation that keeps your business running and protected, with proactive support, 24/7 helpdesk, and vCTO strategy.", "Fully Managed or Co-Managed"], ["shield-check", "Cybersecurity", "EDR/XDR with SOC-backed response, email & identity security, dark-web monitoring, and tested backup & disaster recovery.", "Built into everything"], ["clipboard-check", "Managed Compliance", "Audit-ready programs with a dedicated CMMC Level 2 practice for A&D, plus HIPAA & BAA for healthcare.", "CMMC L2 · HIPAA"], ["sparkles", "AI Consulting & Transformation", "Practical AI that automates real work: custom solutions, agent deployment, and governance guardrails.", "12-Month AI Program"]];
function Services({
  onPick
}) {
  window.useLucide();
  const Icon = window.Icon;
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-section",
    id: "services"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "What we do: Managed IT, cybersecurity, compliance, and AI"), /*#__PURE__*/React.createElement("p", {
    className: "rc-body-lg"
  }, "Four practices, one accountable team, so there are no gaps between vendors and no \"that's not in our scope.\"")), /*#__PURE__*/React.createElement("div", {
    className: "rc-grid-4"
  }, PILLARS.map(([ic, t, d, tag]) => /*#__PURE__*/React.createElement("button", {
    className: "rc-service",
    key: t,
    onClick: () => onPick && onPick(t)
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-service-tile"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 24
  })), /*#__PURE__*/React.createElement("h4", null, t), /*#__PURE__*/React.createElement("p", null, d), /*#__PURE__*/React.createElement("span", {
    className: "rc-service-tag"
  }, tag))))));
}
const SQUAD = [["user-round-cog", "Squad Leader", "Your relationship owner and point of escalation. Owns roadmapping, Quarterly Business Reviews, and budget planning."], ["headset", "Helpdesk Engineers", "Your dedicated remote support team. Tickets and day-to-day requests handled by people who already know your environment."], ["wrench", "Onsite Engineers", "Hands-on support when you need a physical presence: deskside visits, hardware installs, and network work."]];
const DEPTH = [["arrow-up-right", "Escalation Squad"], ["clock", "24/7 TAC"], ["layers-3", "PSG"], ["truck", "Logistics Team"]];
function Squad() {
  window.useLucide();
  const Icon = window.Icon;
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-section rc-section-tint",
    id: "squad"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "How we're different: one dedicated Squad, always yours"), /*#__PURE__*/React.createElement("p", {
    className: "rc-body-lg"
  }, "Most IT companies route your call to whoever's available. We assign you a ", /*#__PURE__*/React.createElement("span", {
    className: "rc-hl"
  }, "Dedicated Squad"), ", a small team that knows your environment, your people, and your priorities. No re-explaining your setup to a stranger.")), /*#__PURE__*/React.createElement("div", {
    className: "rc-grid-3"
  }, SQUAD.map(([ic, t, d]) => /*#__PURE__*/React.createElement("div", {
    className: "rc-service",
    key: t,
    style: {
      cursor: "default"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-service-tile"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 24
  })), /*#__PURE__*/React.createElement("h4", null, t), /*#__PURE__*/React.createElement("p", null, d)))), /*#__PURE__*/React.createElement("div", {
    className: "rc-depth"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-depth-label"
  }, "Backed by the full org"), /*#__PURE__*/React.createElement("div", {
    className: "rc-depth-chips"
  }, DEPTH.map(([ic, t]) => /*#__PURE__*/React.createElement("span", {
    className: "rc-depth-chip",
    key: t
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 16
  }), " ", t))))));
}
const INDUSTRIES = [["building-2", "Architecture & Engineering", "Revit, AutoCAD & BIM workflows, large-file infrastructure, and multi-site connectivity, fully supported."], ["heart-pulse", "Healthcare", "HIPAA, PHI, and signed BAAs. Privacy-by-design with the controls patient data requires."], ["badge-check", "Aerospace & Defense", "A dedicated CMMC Level 2 program covering DFARS, CUI scoping, SSP/POA&M, and C3PAO-ready evidence."]];
function Industries() {
  window.useLucide();
  const Icon = window.Icon;
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-section",
    id: "industries"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Industry fluency: we don't do generic IT"), /*#__PURE__*/React.createElement("p", {
    className: "rc-body-lg"
  }, "Deepest in the three most demanding verticals, and we serve growing companies across many industries.")), /*#__PURE__*/React.createElement("div", {
    className: "rc-grid-3"
  }, INDUSTRIES.map(([ic, t, d]) => /*#__PURE__*/React.createElement("div", {
    className: "rc-industry",
    key: t
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-industry-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, t), /*#__PURE__*/React.createElement("p", null, d)))))));
}
function Stats() {
  const STATS = [["250+", "Clients supported"], ["1997", "Independent, same leadership"], [">98%", "EDR coverage"], ["4.8/5", "Average CSAT"]];
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-stats-inner"
  }, STATS.map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    className: "rc-stat",
    key: l
  }, /*#__PURE__*/React.createElement("b", null, n), /*#__PURE__*/React.createElement("span", {
    className: "rc-stat-underline"
  }), /*#__PURE__*/React.createElement("span", {
    className: "rc-stat-label"
  }, l)))));
}
const STEPS = [["search", "Discovery Call", "We listen first: your environment, frustrations, goals, and compliance needs. A real conversation, never a checklist."], ["clipboard-list", "Assessment & Proposal", "A tailored plan: what we found, what we recommend, what it costs. No surprises."], ["file-signature", "Agreement", "Scope, pricing, and terms finalized. Simple and transparent, with no pressure to sign on the spot."], ["users", "Kickoff Meeting", "You meet your Squad by name. We align on priorities, communication, and Day 1 actions."], ["rocket", "You're Onboarded", "Monitoring is live, helpdesk is active, and your Squad is already working, typically 2-4 weeks in."]];
function Process() {
  window.useLucide();
  const Icon = window.Icon;
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-section rc-section-tint",
    id: "process"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Our process, from first call to onboarded in 2\u20134 weeks"), /*#__PURE__*/React.createElement("p", {
    className: "rc-body-lg"
  }, "Five steps, no ambiguity, and a clear path forward at every stage.")), /*#__PURE__*/React.createElement("div", {
    className: "rc-steps"
  }, STEPS.map(([ic, t, d], i) => /*#__PURE__*/React.createElement("div", {
    className: "rc-step",
    key: t
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-step-num"
  }, String(i + 1).padStart(2, "0")), /*#__PURE__*/React.createElement("span", {
    className: "rc-step-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 20
  })), /*#__PURE__*/React.createElement("h4", null, t), /*#__PURE__*/React.createElement("p", null, d))))));
}
function Testimonial() {
  window.useLucide();
  const Icon = window.Icon;
  return /*#__PURE__*/React.createElement("section", {
    className: "rc-section rc-section-navy",
    id: "about"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-container rc-quote"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "quote",
    size: 40,
    cls: "rc-quote-mark"
  }), /*#__PURE__*/React.createElement("blockquote", null, "I can make a map before the old app would even open."), /*#__PURE__*/React.createElement("p", {
    className: "rc-quote-sub"
  }, "When a critical mapping workflow was being discontinued, we built a custom AI replacement from scratch, cutting a report from ", /*#__PURE__*/React.createElement("span", {
    className: "rc-hl"
  }, "1 to 2 hours down to 5 to 15 minutes"), "."), /*#__PURE__*/React.createElement("div", {
    className: "rc-quote-by"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-quote-client"
  }, "Featured client"), "          ", /*#__PURE__*/React.createElement("span", {
    className: "rc-quote-logo"
  }, /*#__PURE__*/React.createElement("img", {
    src: window.__resources && window.__resources.concordLogo || "../../assets/concord-group.png",
    alt: "The Concord Group"
  })))));
}
window.Services = Services;
window.Squad = Squad;
window.Industries = Industries;
window.Stats = Stats;
window.Process = Process;
window.Testimonial = Testimonial;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/image-slot.js
try { (() => {
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/image-slot.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

})();
