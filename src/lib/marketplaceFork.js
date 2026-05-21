/**
 * Maps marketplace flow cards (step count + metadata) into shapes used by
 * clone dependency checks and catalog import when forking.
 */

const CATEGORY_STEPS = {
  Incident: [
    { label: "Webhook", icon: "Webhook", color: "var(--chart-chart-3)" },
    { label: "Enrich", icon: "Database", color: "var(--primary)" },
    { label: "Score", icon: "Bot", color: "var(--chart-chart-4)" },
    { label: "Ticket", icon: "Mail", color: "var(--info)" },
  ],
  Analytics: [
    { label: "Query", icon: "Database", color: "var(--primary)" },
    { label: "Analyze", icon: "Bot", color: "var(--chart-chart-4)" },
    { label: "Summarize", icon: "FileText", color: "var(--warning)" },
    { label: "Notify", icon: "Mail", color: "var(--success)" },
  ],
  Finance: [
    { label: "Ingest", icon: "FileText", color: "var(--muted-foreground)" },
    { label: "Extract", icon: "Bot", color: "var(--chart-chart-3)" },
    { label: "Validate", icon: "Database", color: "var(--primary)" },
    { label: "ERP sync", icon: "Globe", color: "var(--info)" },
  ],
  CRM: [
    { label: "Collect", icon: "Globe", color: "var(--primary)" },
    { label: "Score", icon: "Bot", color: "var(--chart-chart-4)" },
    { label: "Route", icon: "Zap", color: "var(--warning)" },
    { label: "Outreach", icon: "Mail", color: "var(--success)" },
  ],
};

const DEFAULT_PATTERN = [
  { label: "Trigger", icon: "Webhook", color: "var(--chart-chart-3)" },
  { label: "Process", icon: "Bot", color: "var(--chart-chart-4)" },
  { label: "Transform", icon: "Database", color: "var(--primary)" },
  { label: "Deliver", icon: "Mail", color: "var(--info)" },
];

function patternForCategory(category) {
  return CATEGORY_STEPS[category] ?? DEFAULT_PATTERN;
}

/** Source object for ForkDialog + runCloneDependencyCheck */
export function marketplaceFlowToCheckSource(marketplaceFlow) {
  const steps = marketplaceFlowTemplateSteps(marketplaceFlow);
  return {
    id: `mp-flow-${marketplaceFlow.id}`,
    name: marketplaceFlow.name,
    description: marketplaceFlow.blurb ?? "",
    tags: marketplaceFlow.tags ?? [],
    category: marketplaceFlow.category ?? "General",
    steps,
    version: "v0.1",
  };
}

/** Step definitions written into the catalog on fork */
export function marketplaceFlowTemplateSteps(marketplaceFlow) {
  const target = Math.max(1, Number(marketplaceFlow.steps) || 4);
  const pattern = patternForCategory(marketplaceFlow.category);
  const steps = [];
  for (let i = 0; i < target; i += 1) {
    const template = pattern[i % pattern.length];
    steps.push({ ...template, label: template.label });
  }
  return steps;
}
