// drizzle-kit and the standalone scripts do not read .env.local on their own,
// and that is where the connection string lives, so load it as Next.js would.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
