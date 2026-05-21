/** Shared microcopy for fork / add-flow readiness flows */

export function getReadinessCopy(kind, { forkChain = false } = {}) {
  if (kind === "agent") {
    return {
      readinessTitle: "Check before you fork",
      readinessDescription: (name) =>
        `We'll verify model configuration, knowledge hubs, tools, vault variables, and access for ${name} in your workspace.`,
      proceedLabel: "Continue to fork",
      stepCurrent: 1,
      stepTotal: 2,
      passedTitle: "Ready to fork",
      passedBody:
        "All prerequisites are satisfied. Continue to name your copy and finish forking.",
      blockedTitle: "Fix these items to continue",
      blockedBody: (n) =>
        `Resolve ${n} required item${n === 1 ? "" : "s"} below, or apply suggested fixes.`,
      entityLabel: "agent",
      checkingTitle: "Validating dependencies",
    };
  }

  const stepTotal = forkChain ? 2 : 1;

  return {
    readinessTitle: forkChain ? "Check before you fork" : "Check before you add this flow",
    readinessDescription: (name) =>
      forkChain
        ? `We'll verify model configuration, knowledge hubs, tools, vault variables, and access for ${name} before you fork it.`
        : `We'll verify model configuration, knowledge hubs, tools, vault variables, and access for ${name} before adding it to your workspace.`,
    proceedLabel: forkChain ? "Continue to fork" : "Add to my flows",
    stepCurrent: 1,
    stepTotal,
    passedTitle: forkChain ? "Ready to fork" : "Ready to add",
    passedBody: forkChain
      ? "Dependencies look good. Continue to name your copy and finish forking."
      : "Dependencies look good. This flow will be added to your catalog so you can edit and run it.",
    blockedTitle: "Fix these items to continue",
    blockedBody: (n) =>
      `Resolve ${n} required item${n === 1 ? "" : "s"} below, or apply suggested fixes.`,
    entityLabel: "flow",
    checkingTitle: "Validating dependencies",
  };
}
