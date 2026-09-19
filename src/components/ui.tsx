import type { ReactNode } from "react";
import { formatCents, percentOf } from "@/lib/money.ts";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-surface shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <div className="mt-0.5 text-sm text-muted">{subtitle}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children ? (
        <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>
      ) : null}
    </div>
  );
}

type Tone = "neutral" | "accent" | "good" | "warn" | "bad";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
};

export function Badge({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * The budget bar. Turns amber as the list approaches the limit and red once
 * it is over, because "how close are we" is the question people actually have.
 */
export function BudgetBar({
  spentCents,
  budgetCents,
  label,
}: {
  spentCents: number;
  budgetCents: number;
  label?: string;
}) {
  const pct = percentOf(spentCents, budgetCents);
  const over = spentCents > budgetCents;
  const tight = !over && pct >= 85;
  const fill = over ? "bg-bad" : tight ? "bg-warn" : "bg-good";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label ?? "Budget"}</span>
        <span className="tnum font-medium">
          {formatCents(spentCents)}{" "}
          <span className="font-normal text-muted">of {formatCents(budgetCents)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${fill}`}
          style={{ width: `${Math.max(pct, spentCents > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {over
          ? `${formatCents(spentCents - budgetCents)} over`
          : `${formatCents(budgetCents - spentCents)} left`}
      </p>
    </div>
  );
}

/*
 * Buttons follow the design system's Button component: 8px radius, weight
 * 600, a 1.5px border on the outlined variants, and hover that changes the
 * fill rather than fading it.
 */
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export const buttonStyles = {
  primary: `${BUTTON_BASE} border-[1.5px] border-transparent bg-accent-fill text-on-accent hover:bg-accent-hover`,
  secondary: `${BUTTON_BASE} border-[1.5px] border-line bg-surface text-ink hover:bg-canvas`,
  ghost: `${BUTTON_BASE} border-[1.5px] border-transparent text-accent hover:bg-accent-soft`,
  amber: `${BUTTON_BASE} border-[1.5px] border-transparent bg-highlight text-ink hover:opacity-90`,
  danger: `${BUTTON_BASE} border-[1.5px] border-line text-bad hover:bg-bad-soft`,
};

export const inputStyles =
  "w-full rounded-lg border-[1.5px] border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

/** Inline result of a server action, rendered above the form that produced it. */
export function Notice({ tone, children }: { tone: "good" | "bad" | "warn"; children: ReactNode }) {
  const styles = {
    good: "border-good/30 bg-good-soft text-good",
    bad: "border-bad/30 bg-bad-soft text-bad",
    warn: "border-warn/30 bg-warn-soft text-warn",
  } as const;
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles[tone]}`}>{children}</div>
  );
}

export function StoreBadge({ store }: { store: string }) {
  if (store === "costco") return <Badge tone="accent">Costco</Badge>;
  if (store === "target") return <Badge tone="bad">Target</Badge>;
  return <Badge>Other</Badge>;
}

/** Marks a line that is paid for outside the food budget. */
export function SupplyBadge() {
  return (
    <Badge tone="neutral" title="A supply: always bought, not from the food budget">
      Supply
    </Badge>
  );
}
