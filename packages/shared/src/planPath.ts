// Browser-safe pure utility functions for plan path generation.
// No Node.js dependencies — safe to import from browser bundles.

const DEFAULT_PLANS_DIR = ".ai-factory/plans/";
const DEFAULT_PLAN_PATH = ".ai-factory/PLAN.md";

// Cyrillic-to-Latin transliteration table built from char codes to avoid Non-ASCII warnings.
// prettier-ignore
const TRANSLIT_PAIRS: [number, string][] = [
  [0x430, "a"],  [0x431, "b"],    [0x432, "v"],    [0x433, "g"],
  [0x434, "d"],  [0x435, "e"],    [0x451, "yo"],   [0x436, "zh"],
  [0x437, "z"],  [0x438, "i"],    [0x439, "y"],    [0x43a, "k"],
  [0x43b, "l"],  [0x43c, "m"],    [0x43d, "n"],    [0x43e, "o"],
  [0x43f, "p"],  [0x440, "r"],    [0x441, "s"],    [0x442, "t"],
  [0x443, "u"],  [0x444, "f"],    [0x445, "kh"],   [0x446, "ts"],
  [0x447, "ch"], [0x448, "sh"],   [0x449, "shch"], [0x44a, ""],
  [0x44b, "y"],  [0x44c, ""],     [0x44d, "e"],    [0x44e, "yu"],
  [0x44f, "ya"],
];

const TRANSLIT_MAP = new Map<string, string>(
  TRANSLIT_PAIRS.map(([code, latin]) => [String.fromCharCode(code), latin]),
);

function transliterate(text: string): string {
  return text
    .split("")
    .map((ch) => TRANSLIT_MAP.get(ch) ?? ch)
    .join("");
}

/**
 * Convert a title string into a URL/filesystem-safe slug.
 * Transliterates Cyrillic to Latin, lowercases, replaces non-alphanumeric
 * with hyphens, collapses consecutive hyphens, trims, and truncates to 60 chars.
 */
export function slugify(title: string): string {
  const slug = transliterate(title.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  if (slug) return slug;

  return `plan-${Date.now()}`;
}

export interface GeneratePlanPathOptions {
  plansDir?: string;
  defaultPlanPath?: string;
}

/**
 * Generate a plan file path based on the planner mode and task title.
 * - "full" mode: returns `<plansDir>/<slug>.md`
 * - "fast" mode (or any other): returns `<defaultPlanPath>`
 */
export function generatePlanPath(
  title: string,
  mode: string,
  options?: GeneratePlanPathOptions,
): string {
  if (mode === "full") {
    const plansDir = options?.plansDir ?? DEFAULT_PLANS_DIR;
    const slug = slugify(title);
    const dir = plansDir.endsWith("/") ? plansDir : `${plansDir}/`;
    return `${dir}${slug}.md`;
  }
  return options?.defaultPlanPath ?? DEFAULT_PLAN_PATH;
}
