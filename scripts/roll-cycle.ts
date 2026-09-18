import "./env.ts";
import { rollCycles } from "../src/lib/cycle-service.ts";

// The same nightly advance the cron route runs, for running by hand.
rollCycles()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
