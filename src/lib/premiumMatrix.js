/** Premium pricing matrix: age bands (rows) × coverage lakhs (columns) → annual premium (₹). */

/** Default coverage tiers (sum insured in lakhs). */
export const DEFAULT_COVERAGE_LAKHS = [1, 2, 3, 4, 5, 7, 10];

/** Production premium table — age band × sum insured (₹ annual premium). */
const PRODUCTION_PREMIUM_ROWS = [
  { ageFrom: 0, ageTo: 35, premiums: [4852, 9145, 12758, 15915, 19079, 26710, 38157] },
  { ageFrom: 36, ageTo: 45, premiums: [5276, 9937, 13862, 17301, 20736, 29030, 41473] },
  { ageFrom: 46, ageTo: 55, premiums: [7555, 14447, 20569, 26185, 31801, 43862, 63600] },
  { ageFrom: 56, ageTo: 65, premiums: [8601, 16512, 23662, 30295, 36931, 50931, 73863] },
  { ageFrom: 66, ageTo: 70, premiums: [9623, 18555, 26722, 34380, 42037, 58853, 83669] },
  { ageFrom: 71, ageTo: 75, premiums: [10312, 20264, 29450, 38129, 46808, 65532, 93617] },
  { ageFrom: 76, ageTo: 80, premiums: [12760, 22064, 39048, 51300, 63548, 76548, 127096] },
  { ageFrom: 81, ageTo: 100, premiums: [21300, 39300, 47300, 51300, 81300, 95300, 132300] },
];

/** Suggested lakh steps when adding a new coverage column. */
export const SUGGESTED_COVERAGE_LAKHS = DEFAULT_COVERAGE_LAKHS;

export function coverageColumnLabel(lakh) {
  const n = Number(lakh);
  if (!n || Number.isNaN(n)) return "Coverage";
  return `${n}L`;
}

export function coverageColumnHeader(lakh) {
  return `${coverageColumnLabel(lakh)} coverage`;
}

/** Full sum insured for tooltips and secondary labels (e.g. ₹10,00,000). */
export function coverageSumInsuredInr(lakh) {
  const n = Number(lakh);
  if (!n || Number.isNaN(n)) return "";
  return `₹${(n * 100000).toLocaleString("en-IN")}`;
}

/** Short summary for compact UI, e.g. "1L, 2L, 3L … 10L". */
export function coverageColumnsSummary(columns) {
  const labels = (columns ?? [])
    .map((c) => coverageColumnLabel(c.lakh))
    .filter((l) => l !== "Coverage");
  if (!labels.length) return "No coverage tiers";
  if (labels.length <= 4) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} … ${labels[labels.length - 1]}`;
}

/** Parse sum-insured header: lakhs (3), rupees (300000), or "3L". */
export function parseCoverageHeaderToLakh(header) {
  const raw = String(header ?? "").trim().replace(/[₹,\s]/g, "");
  if (!raw) return NaN;
  const lakhSuffix = raw.match(/^(\d+(?:\.\d+)?)\s*l$/i);
  if (lakhSuffix) return Number(lakhSuffix[1]);
  const n = Number(raw);
  if (Number.isNaN(n)) return NaN;
  if (n >= 100000) return n / 100000;
  return n;
}

/** Parse "0-35" or separate from/to cells into an age range. */
export function parseAgeBandCells(cell0, cell1) {
  const combined = String(cell0 ?? "").trim();
  const rangeMatch = combined.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    return { ageFrom: Number(rangeMatch[1]), ageTo: Number(rangeMatch[2]) };
  }
  const ageFrom = Number(cell0);
  const ageTo = cell1 != null && String(cell1).trim() !== "" ? Number(cell1) : ageFrom;
  if (Number.isNaN(ageFrom) || Number.isNaN(ageTo)) return null;
  return { ageFrom, ageTo };
}

export function buildDefaultPremiumMatrix() {
  const coverageColumns = DEFAULT_COVERAGE_LAKHS.map((lakh, i) => ({
    id: i + 1,
    lakh,
  }));
  const ageBands = PRODUCTION_PREMIUM_ROWS.map((row, i) => ({
    id: i + 1,
    ageFrom: row.ageFrom,
    ageTo: row.ageTo,
    premiums: Object.fromEntries(
      coverageColumns.map((col, j) => [col.id, row.premiums[j]]),
    ),
  }));
  return { coverageColumns, ageBands };
}

export const DEFAULT_PREMIUM_MATRIX = buildDefaultPremiumMatrix();

export function ageBandsValidationError(ageBands) {
  const sorted = [...ageBands].sort((a, b) => Number(a.ageFrom) - Number(b.ageFrom));
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const from = Number(s.ageFrom);
    const to = Number(s.ageTo);
    if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
      return `Age band ${s.ageFrom}–${s.ageTo} is invalid. Minimum age must be less than or equal to maximum.`;
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      if (from <= Number(prev.ageTo)) {
        return `Age band ${from}–${to} overlaps with ${prev.ageFrom}–${prev.ageTo}. Adjust the ranges so they don't overlap.`;
      }
      if (from > Number(prev.ageTo) + 1) {
        const missingFrom = Number(prev.ageTo) + 1;
        const missingTo = from - 1;
        if (missingFrom === missingTo) {
          return `Age ${missingFrom} isn't covered. Extend a band or add a new one.`;
        }
        return `Ages ${missingFrom}–${missingTo} aren't covered. Extend a band or add a new one.`;
      }
    }
  }
  return null;
}

export function premiumMatrixValidationError(matrix) {
  const { coverageColumns, ageBands } = matrix ?? {};
  if (!ageBands?.length) return "Add at least one age band.";
  if (!coverageColumns?.length) return "Add at least one coverage column.";

  const ageErr = ageBandsValidationError(ageBands);
  if (ageErr) return ageErr;

  const lakhSet = new Set();
  for (const col of coverageColumns) {
    const lakh = Number(col.lakh);
    if (!lakh || Number.isNaN(lakh) || lakh <= 0) {
      return "Each coverage column needs a valid sum insured (in lakhs).";
    }
    if (lakhSet.has(lakh)) {
      return `Duplicate coverage column: ${coverageColumnLabel(lakh)}.`;
    }
    lakhSet.add(lakh);
  }

  for (const band of ageBands) {
    for (const col of coverageColumns) {
      const amount = Number(band.premiums?.[col.id]);
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return `Enter a premium greater than ₹0 for ${band.ageFrom}–${band.ageTo} at ${coverageColumnLabel(col.lakh)}.`;
      }
    }
  }

  return null;
}

export function nextCoverageLakh(columns) {
  const used = new Set((columns ?? []).map((c) => Number(c.lakh)));
  const next = SUGGESTED_COVERAGE_LAKHS.find((n) => !used.has(n));
  if (next != null) return next;
  const max = Math.max(0, ...[...used].filter((n) => !Number.isNaN(n)));
  return max + 1;
}

export function defaultNewAgeBand(ageBands, coverageColumns) {
  const cols = coverageColumns ?? [];
  const emptyPremiums = Object.fromEntries(cols.map((c) => [c.id, ""]));
  if (!ageBands?.length) {
    return { ageFrom: "0", ageTo: "35", premiums: Object.fromEntries(cols.map((c) => [c.id, "5000"])) };
  }
  const last = ageBands.reduce((a, b) => (a.ageTo >= b.ageTo ? a : b));
  const ageFrom = last.ageTo + 1;
  const ageTo = Math.min(ageFrom + 9, 100);
  if (ageFrom > ageTo) {
    return { ageFrom: "0", ageTo: "35", premiums: { ...emptyPremiums } };
  }
  const premiums = {};
  for (const col of cols) {
    const prev = Number(last.premiums?.[col.id]) || 5000;
    premiums[col.id] = String(Math.round(prev * 1.12));
  }
  return { ageFrom: String(ageFrom), ageTo: String(ageTo), premiums };
}

export function premiumMatrixCsvTemplate(matrix) {
  const cols = matrix.coverageColumns ?? [];
  const header = [
    "Age Band",
    ...cols.map((c) => String(Math.round(Number(c.lakh) * 100000))),
  ].join(",");
  const rows = (matrix.ageBands ?? []).map((b) => {
    const cells = cols.map((c) => b.premiums?.[c.id] ?? "");
    return [`${b.ageFrom}-${b.ageTo}`, ...cells].join(",");
  });
  return [header, ...rows].join("\n");
}

/**
 * Parse CSV/TSV pasted matrix.
 * Supports:
 * - Age From, Age To, then lakh or rupee columns
 * - Age Band, then sum insured in rupees (100000, 200000, …)
 * - Single age column with ranges (0-35)
 */
export function parsePremiumMatrixCsv(text, existingColumnIds) {
  const lines = String(text ?? "")
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { error: "Paste at least a header row and one data row." };
  }

  const splitRow = (line) => line.split(/[,\t]/).map((c) => c.trim());
  const header = splitRow(lines[0]);
  if (header.length < 2) {
    return { error: "Header must include age band(s) and at least one coverage column." };
  }

  const h0 = header[0].toLowerCase();
  const h1 = (header[1] ?? "").toLowerCase();
  const singleAgeColumn =
    h0.includes("age") && !h1.includes("age") && !/^\d+$/.test(header[1] ?? "");
  const dualAgeColumns = h0.includes("age") && h1.includes("age");

  let coverageStartIdx = 2;
  if (singleAgeColumn) coverageStartIdx = 1;
  else if (!dualAgeColumns && !singleAgeColumn) {
    const firstNumeric = header.findIndex((h, i) => i > 0 && !Number.isNaN(parseCoverageHeaderToLakh(h)));
    if (firstNumeric > 0) coverageStartIdx = firstNumeric;
    else return { error: "Could not find coverage columns in the header row." };
  }

  const lakhHeaders = header.slice(coverageStartIdx).map((h) => parseCoverageHeaderToLakh(h));

  if (lakhHeaders.some((n) => !n || Number.isNaN(n))) {
    return { error: "Coverage headers must be sum insured in lakhs (1, 2) or rupees (100000, 200000)." };
  }

  const nextColId = Math.max(0, ...(existingColumnIds ?? [])) + 1;
  let colId = nextColId;
  const coverageColumns = lakhHeaders.map((lakh) => ({ id: colId++, lakh }));
  const ageBands = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    if (cells.length < coverageStartIdx + 1) continue;

    let ageRange;
    if (singleAgeColumn) {
      ageRange = parseAgeBandCells(cells[0], null);
    } else {
      ageRange = parseAgeBandCells(cells[0], cells[1]);
    }
    if (!ageRange) {
      return { error: `Row ${i + 1}: invalid age band (use 0-35 or separate From/To columns).` };
    }

    const premiums = {};
    coverageColumns.forEach((col, idx) => {
      const raw = cells[coverageStartIdx + idx];
      const val = raw === "" || raw == null ? NaN : Number(String(raw).replace(/[₹,\s]/g, ""));
      premiums[col.id] = val;
    });
    ageBands.push({
      id: i,
      ageFrom: ageRange.ageFrom,
      ageTo: ageRange.ageTo,
      premiums,
    });
  }

  if (!ageBands.length) {
    return { error: "No data rows found." };
  }

  const matrix = { coverageColumns, ageBands };
  const err = premiumMatrixValidationError(matrix);
  if (err) return { error: err };

  return { matrix };
}

export const PREMIUM_MATRIX_STORAGE_KEY = "insurance-premium-matrix-v1";

export function clonePremiumMatrix(matrix) {
  return JSON.parse(JSON.stringify(matrix));
}

export function premiumMatricesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function loadPremiumMatrixFromStorage() {
  try {
    const raw = localStorage.getItem(PREMIUM_MATRIX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.coverageColumns?.length || !parsed?.ageBands?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePremiumMatrixToStorage(matrix) {
  try {
    localStorage.setItem(PREMIUM_MATRIX_STORAGE_KEY, JSON.stringify(matrix));
    return true;
  } catch {
    return false;
  }
}

/** Display premium in grid (₹1,27,096). */
export function formatMatrixPremiumInr(amount) {
  const n = Number(amount);
  if (amount === "" || amount == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Parse cell input to integer rupees. */
export function parseMatrixPremiumInput(raw) {
  const cleaned = String(raw ?? "").replace(/[₹,\s]/g, "");
  if (!cleaned) return "";
  const n = Number(cleaned);
  return Number.isNaN(n) ? "" : Math.round(n);
}

/** Employee annual base premium from matrix (before dependent load). */
export function lookupPremiumFromMatrix(matrix, age, coverageLakh) {
  const ageN = Number(age);
  const lakh = Number(coverageLakh);
  if (!matrix || Number.isNaN(ageN) || !lakh || Number.isNaN(lakh)) return null;

  const band = (matrix.ageBands ?? []).find(
    (b) => ageN >= Number(b.ageFrom) && ageN <= Number(b.ageTo),
  );
  if (!band) return null;

  const col = (matrix.coverageColumns ?? []).find((c) => Number(c.lakh) === lakh);
  if (!col) return null;

  const premium = Number(band.premiums?.[col.id]);
  if (!premium || Number.isNaN(premium)) return null;
  return premium;
}

/** @returns {{ ok: boolean, error: string | null }} */
export function getPremiumMatrixStatus(matrix) {
  const error = premiumMatrixValidationError(matrix);
  return { ok: !error, error };
}

export function lakhToRupees(lakh) {
  const n = Number(lakh);
  if (!n || Number.isNaN(n)) return "";
  return String(Math.round(n * 100000));
}

export function rupeesToLakh(rupees) {
  const n = Number(String(rupees ?? "").replace(/[₹,\s]/g, ""));
  if (!n || Number.isNaN(n)) return NaN;
  if (n >= 100000) return n / 100000;
  return n;
}
