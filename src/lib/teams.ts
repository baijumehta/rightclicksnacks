import "server-only";

/**
 * Posting reminders into Teams.
 *
 * The app POSTs to a Power Automate flow, which posts into the group chat.
 * That URL carries its own signature, so it IS a credential: anyone holding
 * it can post to the chat as whoever owns the flow.
 *
 * Nothing here throws. A reminder failing is a nuisance; a reminder failing
 * and taking the nightly cycle roll down with it would mean voting never
 * opened, which is a real problem. So every path returns a result instead.
 */

export type ReminderKind = "voting_open" | "countdown" | "last_call";

export interface TeamsMessage {
  kind: ReminderKind;
  title: string;
  text: string;
  url: string;
  /**
   * The whole post, ready to go, so the Power Automate flow needs exactly one
   * field in its Message box instead of three composed by hand. Wording then
   * lives here, where changing it is an edit rather than a trip through a web
   * form. HTML because that is what the Teams action renders.
   */
  message: string;
}

export type SendResult =
  | { sent: true }
  | { sent: false; reason: string };

const TIMEOUT_MS = 10_000;

export const teamsConfigured = () => Boolean(process.env.TEAMS_WEBHOOK_URL?.trim());

/**
 * Where a message would go, for the dry run to print. Only ever the host and
 * the path's shape -- the signature in the query string stays out of logs.
 */
export function teamsTarget(): string | null {
  const raw = process.env.TEAMS_WEBHOOK_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return `${url.host}${url.pathname.slice(0, 40)}…`;
  } catch {
    return "(unparseable URL)";
  }
}

export async function notifyTeams(message: TeamsMessage): Promise<SendResult> {
  const endpoint = process.env.TEAMS_WEBHOOK_URL?.trim();
  if (!endpoint) return { sent: false, reason: "TEAMS_WEBHOOK_URL is not set" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      /*
       * Newer Power Platform environments hand out a "direct API" URL that
       * wants a bearer token, rather than the classic signed logic.azure.com
       * one that authenticates itself. The raw message says "OAuth scheme
       * required", which does not hint at the fix: it is a trigger setting,
       * not anything wrong with the request.
       */
      if (response.status === 401 && /DirectApiAuthorization|OAuth/i.test(detail)) {
        return {
          sent: false,
          reason:
            "Power Automate wants an OAuth token for this URL. In the flow's " +
            'HTTP trigger set "Who Can Trigger The Flow?" to "Anyone", save, and ' +
            "copy the new URL -- it should be a logic.azure.com one ending in a sig= parameter.",
        };
      }
      return { sent: false, reason: `HTTP ${response.status} ${detail.slice(0, 160)}` };
    }
    return { sent: true };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { sent: false, reason: "Power Automate did not answer in time" };
    }
    return { sent: false, reason: error instanceof Error ? error.message : "unknown error" };
  }
}

/* ------------------------------------------------------------------ */
/* Wording                                                             */
/* ------------------------------------------------------------------ */

const APP_URL = "https://snacks.rclick.com";

/** Teams renders these tags; anything else is safer left out. */
const compose = (title: string, text: string) =>
  `<b>${title}</b><br><br>${text}<br><br><a href="${APP_URL}">${APP_URL}</a>`;

export interface ReminderFacts {
  cycleLabel: string;
  /** Whole days until the order goes in. 1 means it closes tomorrow. */
  daysLeft: number;
  votesEach: number;
  capText: string;
  voted: number;
  total: number;
}

/**
 * One post per day of voting, and each one says something different.
 *
 * Repeating the same words three times is how a chat gets muted, so the first
 * post explains the rules, the middle ones report turnout, and the last one
 * is short and pointed. Turnout does more work than any amount of urgency:
 * "9 still to go" is information, "ACT NOW" is noise.
 */
export function reminderMessage(facts: ReminderFacts): TeamsMessage {
  const { cycleLabel, daysLeft, votesEach, capText, voted, total } = facts;
  const missing = Math.max(0, total - voted);
  const turnout =
    total > 0 ? `${voted} of ${total} ${voted === 1 ? "has" : "have"} voted` : "";

  // The first day: nobody has done anything yet, so explain rather than count.
  if (daysLeft >= 3) {
    const title = `🗳️ Voting is open for the ${cycleLabel} snack order`;
    const text =
      `You have ${votesEach} votes, plus one guaranteed pick up to ${capText} ` +
      `that gets bought whether or not anyone else votes for it. ` +
      `Closes in ${daysLeft} days.`;
    return { kind: "voting_open", title, text, url: APP_URL, message: compose(title, text) };
  }

  if (daysLeft === 2) {
    const title = `🗳️ ${cycleLabel} snack order — voting closes in 2 days`;
    const text =
      missing === 0
        ? `${turnout}. Nothing left to do.`
        : `${turnout}, so ${missing} still to go. ` +
          `An unused guaranteed pick is a wasted one.`;
    return { kind: "countdown", title, text, url: APP_URL, message: compose(title, text) };
  }

  const title = `⏰ Last call — ${cycleLabel} snack order closes tomorrow`;
  const text =
    missing === 0
      ? `${turnout}. Nothing to do — the order goes in tomorrow.`
      : `${turnout}. Last chance for the other ${missing}: about a minute, ` +
        `and it decides what turns up on the shelf.`;
  return { kind: "last_call", title, text, url: APP_URL, message: compose(title, text) };
}
