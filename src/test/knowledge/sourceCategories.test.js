import { describe, it, expect } from "vitest";
import { resolveSourceCategory } from "@/lib/sourceCategories";
import { DEMO_CATEGORY_LIBRARY_SOURCES } from "@/data/documentLibrary";

function filterByCategory(docs, category) {
  if (category === "all") return docs;
  return docs.filter((d) => resolveSourceCategory(d) === category);
}

describe("resolveSourceCategory", () => {
  it("classifies demo library rows into files, dbs, and apis", () => {
    const counts = { files: 0, dbs: 0, apis: 0 };
    for (const doc of DEMO_CATEGORY_LIBRARY_SOURCES) {
      counts[resolveSourceCategory(doc)] += 1;
    }
    expect(counts.files).toBeGreaterThan(0);
    expect(counts.dbs).toBeGreaterThan(0);
    expect(counts.apis).toBeGreaterThan(0);
    expect(counts.files + counts.dbs + counts.apis).toBe(
      DEMO_CATEGORY_LIBRARY_SOURCES.length,
    );
  });

  it("updates filtered counts when category changes", () => {
    const all = DEMO_CATEGORY_LIBRARY_SOURCES.length;
    const files = filterByCategory(DEMO_CATEGORY_LIBRARY_SOURCES, "files").length;
    const dbs = filterByCategory(DEMO_CATEGORY_LIBRARY_SOURCES, "dbs").length;
    const apis = filterByCategory(DEMO_CATEGORY_LIBRARY_SOURCES, "apis").length;

    expect(filterByCategory(DEMO_CATEGORY_LIBRARY_SOURCES, "all").length).toBe(all);
    expect(files + dbs + apis).toBe(all);
    expect(files).toBeLessThan(all);
    expect(dbs).toBeLessThan(all);
    expect(apis).toBeLessThan(all);
  });
});
