import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth.ts";
import { entraConfig } from "@/lib/entra.ts";
import { signIn } from "../actions/auth.ts";
import { Card, Notice, buttonStyles } from "@/components/ui.tsx";

const MESSAGES: Record<string, string> = {
  NOT_INVITED:
    "That Microsoft account is not on the list. Ask whoever runs the snack order to add you.",
  ACCOUNT_DISABLED: "That account has been switched off.",
  STALE_SIGN_IN: "That sign-in link had gone stale. Try again.",
  ENTRA_NOT_CONFIGURED: "Microsoft sign-in is not set up on this deployment yet.",
  missing_code: "Microsoft sent us back without a sign-in code. Try again.",
  sign_in_failed: "Sign-in did not go through. Try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/");

  const { error, next } = await searchParams;
  const configured = Boolean(entraConfig());

  return (
    <div className="mx-auto max-w-md pt-10">
      <Card className="p-6">
        <h1 className="text-xl font-semibold tracking-tight">Office snacks</h1>
        <p className="mt-1 text-sm text-muted">
          Put snacks forward, vote on what we buy, and see what it costs against the budget.
        </p>

        {error ? (
          <div className="mt-4">
            <Notice tone="bad">{MESSAGES[error] ?? MESSAGES.sign_in_failed}</Notice>
          </div>
        ) : null}

        {configured ? (
          <form action={signIn} className="mt-5">
            <input type="hidden" name="redirectTo" value={next ?? "/"} />
            <button type="submit" className={`${buttonStyles.primary} w-full`}>
              Sign in with Microsoft
            </button>
          </form>
        ) : (
          <div className="mt-5">
            <Notice tone="warn">
              Microsoft sign-in is not configured. Set <code>ENTRA_TENANT_ID</code>,{" "}
              <code>ENTRA_CLIENT_ID</code> and <code>ENTRA_CLIENT_SECRET</code>, then reload.
            </Notice>
          </div>
        )}
      </Card>
    </div>
  );
}
