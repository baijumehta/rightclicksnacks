import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { settings, type Settings } from "@/db/schema.ts";

/** The settings row, created with defaults on first read. */
export async function getSettings(): Promise<Settings> {
  const existing = await db.query.settings.findFirst({ where: eq(settings.id, 1) });
  if (existing) return existing;

  const [created] = await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Another request created it between the read and the insert.
  const row = await db.query.settings.findFirst({ where: eq(settings.id, 1) });
  if (!row) throw new Error("Could not create the settings row");
  return row;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db
    .update(settings)
    .set({ ...patch, id: 1, updatedAt: new Date() })
    .where(eq(settings.id, 1));
}

/** The office's timezone, used to decide which calendar day it is. */
export const OFFICE_TIMEZONE = process.env.OFFICE_TIMEZONE ?? "America/Los_Angeles";
