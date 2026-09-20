ALTER TABLE "cycles" ADD COLUMN "voting_open_notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cycles" ADD COLUMN "last_call_notified_at" timestamp with time zone;