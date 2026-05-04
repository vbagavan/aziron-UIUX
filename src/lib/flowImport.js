/**
 * Parse and validate JSON produced by "Export as JSON" or compatible flow definitions.
 * Returns an array of normalized objects safe to pass to `importFlow` in the catalog.
 * Supports both a single flow object and an array of flow objects.
 */

const VALID_STATUS = new Set(["idle", "inprogress", "completed", "error", "draft"]);
const MAX_FLOWS   = 20;
const MAX_STEPS   = 200;

function normalizeStep(raw, index) {
  if (!raw || typeof raw !== "object") {
    return { label: `Step ${index + 1}`, icon: "Bot", color: "#6366f1", status: "pending" };
  }
  const label = String(raw.label ?? "").trim() || `Step ${index + 1}`;
  const icon = typeof raw.icon === "string" && raw.icon.trim() ? raw.icon.trim() : "Bot";
  const color = typeof raw.color === "string" && raw.color.trim() ? raw.color.trim() : "#6366f1";
  return { ...raw, label, icon, color, status: raw.status ?? "pending" };
}

function sanitizeVersionHistory(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    if (!Array.isArray(e.steps)) continue;
    const label = typeof e.label === "string" && e.label.trim() ? e.label.trim() : "v0.1";
    out.push({
      id: typeof e.id === "string" && e.id.trim() ? e.id.trim() : `ver-${Date.now()}-${out.length}`,
      label,
      savedAt: typeof e.savedAt === "string" ? e.savedAt : new Date().toISOString(),
      stepCount: e.steps.length,
      steps: JSON.parse(JSON.stringify(e.steps)),
      flowName: typeof e.flowName === "string" ? e.flowName : typeof e.name === "string" ? e.name : "",
      flowDescription:
        typeof e.flowDescription === "string"
          ? e.flowDescription
          : typeof e.description === "string"
            ? e.description
            : "",
      date: typeof e.date === "string" ? e.date : undefined,
    });
  }
  return out;
}

function normalizeOneFlow(data, index) {
  if (!data || typeof data !== "object") {
    throw new Error(
      `Item ${index + 1} is not a valid flow object.`,
    );
  }

  const name =
    typeof data.name === "string" && data.name.trim()
      ? data.name.trim().slice(0, 200)
      : "Imported flow";

  const description =
    typeof data.description === "string" ? data.description.slice(0, 5000) : "";

  const version =
    typeof data.version === "string" && data.version.trim()
      ? data.version.trim().slice(0, 40)
      : "v0.1";

  const status = VALID_STATUS.has(data.status) ? data.status : "idle";

  if (!Array.isArray(data.steps)) {
    throw new Error(
      `Flow "${name}": missing or invalid "steps" — expected an array of step objects.`,
    );
  }

  if (data.steps.length > MAX_STEPS) {
    throw new Error(`Flow "${name}": too many steps (${data.steps.length}, max ${MAX_STEPS}).`);
  }

  const steps = data.steps.map((s, i) => normalizeStep(s, i));
  const visibility = data.visibility === "public" ? "public" : "private";
  const versionHistory = sanitizeVersionHistory(data.versionHistory);

  return {
    name,
    description,
    version,
    status,
    steps,
    visibility,
    versionHistory,
    runs:
      typeof data.runs === "number" && Number.isFinite(data.runs)
        ? Math.max(0, Math.floor(data.runs))
        : 0,
    success:
      typeof data.success === "number" && Number.isFinite(data.success)
        ? Math.min(100, Math.max(0, Math.round(data.success)))
        : null,
    lastRun: typeof data.lastRun === "string" ? data.lastRun.slice(0, 80) : "—",
  };
}

/**
 * @param {string} jsonText - raw file contents
 * @returns {{ flows: object[], warnings: string[] }} normalized flows + any soft warnings
 */
export function parseAndValidateFlowImport(jsonText) {
  if (typeof jsonText !== "string" || !jsonText.trim()) {
    throw new Error("The file is empty.");
  }

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON — check that the file is valid UTF-8 JSON.");
  }

  const warnings = [];

  // Normalize to array
  const items = Array.isArray(data) ? data : [data];

  if (items.length === 0) {
    throw new Error("JSON array is empty — expected at least one flow object.");
  }
  if (items.length > MAX_FLOWS) {
    throw new Error(`Too many flows in file (${items.length}). Max allowed per import: ${MAX_FLOWS}.`);
  }

  const flows = items.map((item, i) => normalizeOneFlow(item, i));

  // Soft warnings (non-blocking)
  flows.forEach((f) => {
    if (f.steps.length === 0) {
      warnings.push(`"${f.name}" has no steps — you can add steps in the editor.`);
    }
  });

  return { flows, warnings };
}
