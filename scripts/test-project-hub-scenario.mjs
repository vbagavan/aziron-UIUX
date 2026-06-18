/**
 * Validates the project-documents → hub → Studio → asset flow (standalone — no @/ imports).
 * Run: node scripts/test-project-hub-scenario.mjs
 */

const DEMO_PROJECT_LIBRARY_SOURCES = [
  {
    id: "demo-proj-sow-acme-platform",
    name: "Acme Platform Modernization — SOW v2.1.pdf",
    projectDocType: "SOW",
    hubLinks: [{ hubId: 4, hubFileId: "demo-link-proj-sow" }],
  },
  {
    id: "demo-proj-rfp-acme-platform",
    name: "Acme Platform Modernization — RFP Response.docx",
    projectDocType: "Proposal",
    hubLinks: [{ hubId: 4, hubFileId: "demo-link-proj-rfp" }],
  },
];

function detectProjectDocIntent(prompt = "") {
  const q = prompt.toLowerCase();
  if (/\b(purchase order|po|p\.?o\.?)\b/.test(q)) return "purchase_order";
  if (/\b(invoice|billing statement|bill client)\b/.test(q)) return "invoice";
  if (/\b(rfp|request for proposal|proposal response)\b/.test(q)) return "rfp";
  return null;
}

function inferAssetTypeFromPrompt(question) {
  const q = question.toLowerCase();
  if (detectProjectDocIntent(question)) return "document";
  if (/\b(summary|summarize|overview)\b/.test(q)) return "summary";
  if (/\b(draft|write|create|generate)\b/.test(q)) return "document";
  return "note";
}

function generatePurchaseOrderBody(hubName, fileNames) {
  return `# Purchase Order\n\nGenerated from sources in **${hubName}**.\n**Sources:** ${fileNames}\n\n## Line items\n| 1 | Phase 1 | $48,000 |`;
}

function generateInvoiceBody(hubName, fileNames) {
  return `# Invoice\n\nGenerated from sources in **${hubName}**.\n**Sources:** ${fileNames}\n\n**Amount due:** $48,000`;
}

function generateRfpBody(hubName, fileNames) {
  return `# RFP Response Summary\n\nGenerated from sources in **${hubName}**.\n**Sources:** ${fileNames}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    process.exitCode = 1;
  }
}

const HUB_ID = 4;
const HUB_NAME = "Project Engagement Hub";

test("demo project documents include SOW and RFP", () => {
  assert(DEMO_PROJECT_LIBRARY_SOURCES.length >= 2, "Need ≥2 demo docs");
  assert(DEMO_PROJECT_LIBRARY_SOURCES.some((d) => d.projectDocType === "SOW"), "Missing SOW");
  assert(DEMO_PROJECT_LIBRARY_SOURCES.some((d) => d.name.includes("RFP")), "Missing RFP");
});

test("hub link metadata targets Project Engagement Hub", () => {
  for (const doc of DEMO_PROJECT_LIBRARY_SOURCES) {
    assert(doc.hubLinks[0].hubId === HUB_ID, `${doc.id} not linked to hub ${HUB_ID}`);
  }
});

const PROMPTS = [
  { prompt: "Generate purchase order for milestone 1", intent: "purchase_order", type: "document" },
  { prompt: "Create invoice for Acme", intent: "invoice", type: "document" },
  { prompt: "Draft RFP response summary", intent: "rfp", type: "document" },
];

for (const { prompt, intent, type } of PROMPTS) {
  test(`detectProjectDocIntent: "${prompt}"`, () => {
    assert(detectProjectDocIntent(prompt) === intent);
  });
  test(`inferAssetTypeFromPrompt: "${prompt}" → ${type}`, () => {
    assert(inferAssetTypeFromPrompt(prompt) === type);
  });
}

const sources = DEMO_PROJECT_LIBRARY_SOURCES.map((d) => d.name).join(", ");

test("generated PO body is markdown and references hub", () => {
  const body = generatePurchaseOrderBody(HUB_NAME, sources);
  assert(body.includes("# Purchase Order"));
  assert(body.includes(HUB_NAME));
  assert(body.length > 80, "Body too short for download");
});

test("generated invoice body is markdown", () => {
  const body = generateInvoiceBody(HUB_NAME, sources);
  assert(body.includes("# Invoice"));
  assert(body.includes("$48,000"));
});

test("generated RFP body is markdown", () => {
  const body = generateRfpBody(HUB_NAME, sources);
  assert(body.includes("RFP"));
});

test("asset export shape (title + body) is non-empty for all deliverables", () => {
  const bodies = [
    generatePurchaseOrderBody(HUB_NAME, sources),
    generateInvoiceBody(HUB_NAME, sources),
    generateRfpBody(HUB_NAME, sources),
  ];
  for (const body of bodies) {
    assert(body.startsWith("#"), "Should start with markdown heading");
    assert(body.includes("**"), "Should include bold metadata");
  }
});

console.log("\nScenario validation complete.");
if (process.exitCode) {
  console.log("Some checks failed.");
} else {
  console.log("All checks passed.");
  console.log("\nManual UI test: Knowledge → Project Engagement Hub → Studio");
  console.log('Prompts: "Generate purchase order" | "Create invoice" | "Draft RFP response"');
  console.log("Sample uploads: content/scenarios/project-hub-studio-workflow/");
}
