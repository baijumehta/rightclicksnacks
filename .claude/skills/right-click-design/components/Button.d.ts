import * as React from "react";

export interface ButtonProps {
  /** Visual style. */
  variant?: "primary" | "secondary" | "navy" | "ghost" | "amber" | "ondark";
  /** Size. */
  size?: "md" | "lg";
  /** Button label / content. */
  children?: React.ReactNode;
  /** Optional Lucide icon name rendered after the label (e.g. "arrow-right"). */
  icon?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/** Right Click branded button. Flat, clean, token-driven. */
export function Button(props: ButtonProps): JSX.Element;
