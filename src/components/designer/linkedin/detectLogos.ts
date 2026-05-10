import { listAssets, type DesignAsset } from "@/lib/designer-queries";

/**
 * Known tool keywords (matches the canvas TOOL_REGISTRY) plus common variants.
 * Returns the canonical tool name when matched.
 */
const TOOL_KEYWORDS: { name: string; matchers: RegExp }[] = [
  { name: "Clay", matchers: /\bclay(\.com)?\b/i },
  { name: "n8n", matchers: /\bn8n\b/i },
  { name: "Claude", matchers: /\bclaude(\s+code)?\b/i },
  { name: "ChatGPT", matchers: /\bchat\s*gpt\b|\bchatgpt\b/i },
  { name: "OpenAI", matchers: /\bopenai\b/i },
  { name: "HubSpot", matchers: /\bhub\s*spot\b|\bhubspot\b/i },
  { name: "Apollo", matchers: /\bapollo\b/i },
  { name: "Smartlead", matchers: /\bsmart\s*lead\b|\bsmartlead\b/i },
  { name: "Instantly", matchers: /\binstantly\b/i },
  { name: "ZoomInfo", matchers: /\bzoom\s*info\b|\bzoominfo\b/i },
  { name: "FindyMail", matchers: /\bfindy\s*mail\b|\bfindymail\b/i },
  { name: "BetterContact", matchers: /\bbetter\s*contact\b|\bbettercontact\b/i },
  { name: "LinkedIn", matchers: /\blinked\s*in\b|\blinkedin\b/i },
  { name: "Sales Navigator", matchers: /\bsales\s*nav(igator)?\b/i },
  { name: "Google", matchers: /\bgoogle\b/i },
  { name: "Microsoft", matchers: /\bmicrosoft\b/i },
  { name: "Make", matchers: /\bmake(\.com)?\b/i },
  { name: "Zapier", matchers: /\bzapier\b/i },
  { name: "Slack", matchers: /\bslack\b/i },
  { name: "Notion", matchers: /\bnotion\b/i },
  { name: "Airtable", matchers: /\bairtable\b/i },
  { name: "Segment", matchers: /\bsegment(\.com)?\b/i },
  { name: "MCP", matchers: /\bmcp\b/i },
];

export type DetectedLogo = {
  name: string;
  asset?: DesignAsset;
  hasAsset: boolean;
};

/**
 * Scan a body of text for tool/brand mentions, then look them up in the
 * user's Asset Library. Returns one entry per detected name with a possible
 * matched asset (if the user has uploaded a logo for it).
 */
export async function detectMentionedLogos(text: string): Promise<DetectedLogo[]> {
  const found = new Map<string, true>();
  for (const t of TOOL_KEYWORDS) {
    if (t.matchers.test(text)) found.set(t.name, true);
  }
  if (found.size === 0) return [];

  // Fetch user assets once and match by name (case-insensitive substring).
  const assets = await listAssets().catch(() => [] as DesignAsset[]);
  const out: DetectedLogo[] = [];
  for (const name of found.keys()) {
    const needle = name.toLowerCase();
    const asset = assets.find((a) =>
      [(a as any).name, a.prompt, a.storage_path]
        .filter(Boolean)
        .some((s: string) => s.toLowerCase().includes(needle)),
    );
    out.push({ name, asset, hasAsset: !!asset });
  }
  return out;
}

/** Convert a tool name to the chip format the canvas uses ("Name :: Mono :: #bg :: #fg"). */
export function toolNameToChip(name: string): string {
  return name; // The canvas's TOOL_REGISTRY already covers these names.
}
