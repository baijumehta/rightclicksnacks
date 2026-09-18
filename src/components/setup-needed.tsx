import { Card, Notice } from "./ui.tsx";

/**
 * Shown instead of a stack trace when the database is missing or unmigrated,
 * which on a fresh clone is the first thing that happens.
 */
export function SetupNeeded({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  const missingUrl = message.includes("DATABASE_URL");
  const missingTables = /relation .* does not exist|does not exist/i.test(message);

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold tracking-tight">Almost there</h1>
      <p className="mt-1 text-sm text-muted">
        The app is running but cannot reach its data yet.
      </p>

      <ol className="mt-5 space-y-4 text-sm">
        <li>
          <p className="font-medium">
            1. Point it at a database{" "}
            {missingUrl ? <span className="text-bad">— this is the current problem</span> : null}
          </p>
          <p className="mt-1 text-muted">
            Copy <code>.env.example</code> to <code>.env.local</code> and fill in{" "}
            <code>DATABASE_URL</code>.
          </p>
        </li>
        <li>
          <p className="font-medium">
            2. Create the tables{" "}
            {missingTables && !missingUrl ? (
              <span className="text-bad">— this is the current problem</span>
            ) : null}
          </p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 text-xs">
            npm run db:push
          </pre>
        </li>
        <li>
          <p className="font-medium">3. Add a starter catalog and the first cycle</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 text-xs">
            npm run db:seed
          </pre>
        </li>
        <li>
          <p className="font-medium">4. Set up Microsoft sign-in</p>
          <p className="mt-1 text-muted">
            Fill in the <code>ENTRA_*</code> values. The README walks through the app
            registration.
          </p>
        </li>
      </ol>

      <div className="mt-5">
        <Notice tone="warn">
          <span className="font-medium">What the database said:</span>{" "}
          <span className="break-words">{message.slice(0, 400)}</span>
        </Notice>
      </div>
    </Card>
  );
}
