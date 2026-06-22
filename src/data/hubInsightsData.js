/** Demo synthesized insights keyed by hub id (mirrors AZIRON-PROTO knowledge.html). */

export const HUB_INSIGHTS_BY_ID = {
  4: {
    summary:
      "Q3 Report, Design Spec, and MSA-2026 reveal a consistent pattern: feature delivery is ahead of schedule (+12%) but contractual milestones have misaligned timelines. A contract review is recommended before Q4 kick-off.",
    themes: [
      { label: "Schedule Alignment", score: 0.87, note: "4 of 5 documents reference Q4 deadlines; Q3 Report shows 12% ahead-of-schedule." },
      { label: "Budget Variance", score: 0.64, note: "Design spec cost estimates differ from MSA caps by ~8%." },
      { label: "Risk Register Gaps", score: 0.41, note: "Contract and onboarding guide list different risk owners for the same workstream." },
    ],
    gaps: [
      { title: "No escalation policy", desc: "MSA-2026 references an escalation matrix that is not present in any linked source.", searchQuery: "escalation" },
      { title: "Stakeholder sign-off missing", desc: "Design spec v2 is awaiting approval — not reflected in Q3 status summary.", searchQuery: "design spec" },
    ],
    questions: [
      "What are the key contractual milestones?",
      "How does the design spec cost compare to the MSA cap?",
      "Which risk owners are listed in the contract?",
    ],
  },
  1: {
    summary:
      "Six documents cover onboarding, contracts, design, and financial reporting. Brand Guidelines and the onboarding guide are mutually consistent; however, the contract references a 2024 rate card not present in the library.",
    themes: [
      { label: "Onboarding Coverage", score: 0.92, note: "Onboarding guide and brand guidelines share 80% of core terminology." },
      { label: "Pricing Consistency", score: 0.38, note: "Contract references a 2024 rate card — document not found in current library." },
      { label: "Brand Alignment", score: 0.76, note: "Brand Guidelines cited in design-spec but version mismatch detected." },
    ],
    gaps: [
      { title: "2024 Rate Card missing", desc: "Referenced in contract.docx but not present as a source in this hub.", searchQuery: "rate card" },
    ],
    questions: [
      "What onboarding steps require manager approval?",
      "Are brand guidelines current with the latest product updates?",
    ],
  },
  2: {
    summary:
      "Orders, Users DB, and Analytics are highly complementary. Cross-joining users and orders yields a 94% customer coverage rate. The analytics schema is 3 versions ahead of the orders schema — a migration gap exists.",
    themes: [
      { label: "Customer Coverage", score: 0.94, note: "users-db and orders tables share a primary user_id key with 94% match rate." },
      { label: "Schema Version Drift", score: 0.71, note: "Analytics schema v5 vs orders schema v2 — potential join failures." },
      { label: "Data Volume Imbalance", score: 0.53, note: "Analytics holds 3.1M rows vs 12k orders — event fan-out of ~258×." },
    ],
    gaps: [
      { title: "Schema migration pending", desc: "Analytics events table references order_id v3 format; orders DB still uses v2." },
    ],
    questions: [
      "Which users have placed orders in the last 30 days?",
      "How many analytics events have no matching order record?",
    ],
  },
  3: {
    summary:
      "ACME Tickets, CRM Webhook, and Stripe Charges form a payment + CRM loop. Stripe webhook events are not currently mirrored to the CRM, creating a 12% gap in event coverage.",
    themes: [
      { label: "Event Coverage", score: 0.78, note: "Stripe fires ~240 charge events/month; CRM only receives 211 via webhook." },
      { label: "Auth Consistency", score: 0.55, note: "ACME and Stripe use different token formats (JWT vs API key)." },
      { label: "Latency Variance", score: 0.43, note: "CRM webhook p99 latency is 3× higher than ACME REST endpoint." },
    ],
    gaps: [
      { title: "Stripe → CRM event gap", desc: "~29 Stripe charge events/month are not forwarded to crm-events-webhook." },
    ],
    questions: [
      "Which Stripe charge events are missing from the CRM?",
      "How does ACME ticket volume correlate with Stripe charge frequency?",
    ],
  },
};

export function getHubInsights(hubId) {
  if (hubId == null || hubId === "" || hubId === "all") return null;
  return HUB_INSIGHTS_BY_ID[Number(hubId)] ?? HUB_INSIGHTS_BY_ID[String(hubId)] ?? null;
}
