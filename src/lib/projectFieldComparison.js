import { PROJECT_FIELD_LABELS } from "@/data/projectMetadataSchema";
import { formatMetadataFieldValue } from "@/data/projectMetadataSchema";

function norm(value) {
  return String(value ?? "").trim();
}

/**
 * @param {Record<string, string>} base
 * @param {Record<string, string>} extracted
 * @param {string[]} [fieldKeys] — when set, only count diffs for these keys
 */
export function countMetadataDifferences(base, extracted, fieldKeys) {
  const keys = fieldKeys?.length ? fieldKeys : Object.keys(PROJECT_FIELD_LABELS);
  let count = 0;
  for (const key of keys) {
    if (!PROJECT_FIELD_LABELS[key]) continue;
    const next = norm(extracted[key]);
    if (!next) continue;
    if (next !== norm(base[key])) count += 1;
  }
  return count;
}

/** @param {string} key @param {Record<string, string>} base @param {Record<string, string>} extracted */
export function fieldDiffersFromBase(key, base, extracted) {
  const next = norm(extracted[key]);
  if (!next) return false;
  return next !== norm(base[key]);
}

/** @param {object} field schema field @param {Record<string, string>} base */
export function formatBaseValueForField(field, base) {
  const raw = base[field.key] ?? "";
  if (!norm(raw)) return "—";
  return formatMetadataFieldValue(field, raw);
}
