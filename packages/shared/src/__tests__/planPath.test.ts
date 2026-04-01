import { describe, it, expect } from "vitest";
import { slugify, generatePlanPath } from "../planPath.js";

describe("slugify", () => {
  it("converts latin text to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("transliterates cyrillic to latin", () => {
    expect(slugify("Привет мир")).toBe("privet-mir");
  });

  it("handles mixed cyrillic and latin", () => {
    expect(slugify("Фича v2 — новый дизайн")).toBe("ficha-v2-novyy-dizayn");
  });

  it("transliterates ё correctly", () => {
    expect(slugify("Ёжик в тумане")).toBe("yozhik-v-tumane");
  });

  it("transliterates щ, ч, ш, ж, ц, ю, я", () => {
    expect(slugify("щука чаша шар жук цирк юла яма")).toBe(
      "shchuka-chasha-shar-zhuk-tsirk-yula-yama",
    );
  });

  it("removes ъ and ь (hard/soft signs)", () => {
    expect(slugify("объём подъезд")).toBe("obyom-podezd");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(60);
  });

  it("returns fallback for non-alphanumeric-only input", () => {
    const result = slugify("!!!");
    expect(result).toMatch(/^plan-\d+$/);
  });

  it("returns fallback for empty string", () => {
    const result = slugify("");
    expect(result).toMatch(/^plan-\d+$/);
  });

  it("preserves digits", () => {
    expect(slugify("task 123")).toBe("task-123");
  });

  it("handles cyrillic digits mix", () => {
    expect(slugify("Задача 42")).toBe("zadacha-42");
  });
});

describe("generatePlanPath", () => {
  it("returns slug-based path for full mode", () => {
    expect(generatePlanPath("Hello World", "full")).toBe(".ai-factory/plans/hello-world.md");
  });

  it("returns default plan path for fast mode", () => {
    expect(generatePlanPath("Hello World", "fast")).toBe(".ai-factory/PLAN.md");
  });

  it("uses custom plansDir when provided", () => {
    expect(generatePlanPath("Test", "full", { plansDir: "custom/plans/" })).toBe(
      "custom/plans/test.md",
    );
  });

  it("uses custom defaultPlanPath for fast mode", () => {
    expect(generatePlanPath("Test", "fast", { defaultPlanPath: "custom/PLAN.md" })).toBe(
      "custom/PLAN.md",
    );
  });

  it("appends trailing slash to plansDir if missing", () => {
    expect(generatePlanPath("Test", "full", { plansDir: "plans" })).toBe("plans/test.md");
  });

  it("generates transliterated path for cyrillic titles in full mode", () => {
    expect(generatePlanPath("Привет мир", "full")).toBe(".ai-factory/plans/privet-mir.md");
  });

  it("uses custom plansDir with cyrillic title", () => {
    expect(generatePlanPath("Новая фича", "full", { plansDir: ".plans/" })).toBe(
      ".plans/novaya-ficha.md",
    );
  });
});
