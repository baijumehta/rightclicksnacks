import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ALL_CATEGORIES, type Category } from "./categories.ts";
import { guessCategory } from "./categorize.ts";
import { claudeClient } from "./anthropic-client.ts";

/**
 * Settle on a category for an item.
 *
 * Keyword rules first, because they are free, instant and cover almost
 * everything somebody types. Claude only sees the names the rules could not
 * place -- which keeps this off the critical path for the common case and
 * costs a fraction of a cent for the rest.
 *
 * Returns "other" only when both give up, so "other" once again means
 * genuinely unclassifiable rather than "nobody picked from the menu".
 */

const Answer = z.object({
  category: z.enum(ALL_CATEGORIES),
  confident: z
    .boolean()
    .describe("False if this is a guess you would not stand behind."),
});

export async function classifyItem(
  name: string,
  brand?: string | null,
  packSize?: string | null,
): Promise<Category> {
  const local = guessCategory(name, brand, packSize);
  if (local) return local;

  const client = claudeClient();
  if (!client) return "other";

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 500,
      output_config: { effort: "low", format: zodOutputFormat(Answer) },
      system:
        "You put a single grocery item on the right shelf. " +
        "Paper towels, napkins, cups, cutlery and cleaning products are supplies, not food.",
      messages: [
        {
          role: "user",
          content: [name, brand, packSize].filter(Boolean).join(" · "),
        },
      ],
    });
    const answer = response.parsed_output;
    if (!answer || !answer.confident) return "other";
    return answer.category;
  } catch {
    // Categorising is a convenience; never let it block saving an item.
    return "other";
  }
}
