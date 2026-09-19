import * as React from "react";

const SIZES = {
  md: { padding: "11px 20px", fontSize: 15, radius: 8 },
  lg: { padding: "14px 26px", fontSize: 16, radius: 10 },
};

const VARIANTS = {
  primary:   { background: "var(--blue-500)", color: "#fff", border: "1.5px solid transparent", hover: "var(--blue-600)" },
  secondary: { background: "#fff", color: "var(--navy-900)", border: "1.5px solid var(--gray-300)", hover: "var(--gray-50)" },
  navy:      { background: "var(--navy-900)", color: "#fff", border: "1.5px solid transparent", hover: "var(--navy-800)" },
  ghost:     { background: "transparent", color: "var(--blue-600)", border: "1.5px solid transparent", hover: "var(--blue-100)" },
  amber:     { background: "var(--rc-amber)", color: "var(--navy-900)", border: "1.5px solid transparent", hover: "var(--rc-amber-soft)" },
  ondark:    { background: "#fff", color: "var(--navy-900)", border: "1.5px solid #fff", hover: "var(--gray-50)" },
};

export function Button({ variant = "primary", size = "md", children, icon, disabled = false, onClick }) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;

  const iconRef = React.useRef(null);
  React.useEffect(() => {
    if (icon && window.lucide) window.lucide.createIcons({ nodes: iconRef.current ? [iconRef.current] : undefined });
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
    whiteSpace: "nowrap",
  };

  return (
    <button
      style={style}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {icon ? <i ref={iconRef} data-lucide={icon} style={{ width: s.fontSize + 2, height: s.fontSize + 2 }}></i> : null}
    </button>
  );
}
