/**
 * Send one reminder to Teams on demand, to check the Power Automate flow
 * before anything is automated.
 *
 *   npx tsx --conditions=react-server scripts/teams-test.ts
 *   npx tsx --conditions=react-server scripts/teams-test.ts last-call
 *
 * Reads TEAMS_WEBHOOK_URL from .env.local, so while that variable exists
 * ONLY on this machine, this script is the only thing that can post. The
 * deployed cron stays silent until the same variable is set in Vercel.
 *
 * Point the flow at a chat containing only you until the wording is right.
 */
import "./env.ts";
import {
  lastCallMessage, notifyTeams, teamsConfigured, teamsTarget, votingOpenMessage,
} from "../src/lib/teams.ts";

const which = process.argv[2] === "last-call" ? "last-call" : "voting-open";

if (!teamsConfigured()) {
  console.error(
    "TEAMS_WEBHOOK_URL is not set in .env.local.\n" +
      "Save the flow in Power Automate first, then copy the HTTP POST URL from the trigger.",
  );
  process.exit(1);
}

const message =
  which === "last-call"
    ? lastCallMessage("Oct 1", 6, 15, "tomorrow")
    : votingOpenMessage("Oct 1", 5, "$15.00", "Wednesday");

console.log(`target:  ${teamsTarget()}`);
console.log(`kind:    ${message.kind}\n`);
console.log("this is what the chat will show:\n");
console.log(
  "  " +
    message.message
      .replace(/<br>/g, "\n  ")
      .replace(/<\/?b>/g, "")
      .replace(/<a href="[^"]*">([^<]*)<\/a>/, "$1"),
);
console.log("");

const result = await notifyTeams(message);
if (result.sent) {
  console.log("Sent. Check the chat -- and check it reads well on a phone.");
  process.exit(0);
}
console.error(`Not sent: ${result.reason}`);
process.exit(1);
