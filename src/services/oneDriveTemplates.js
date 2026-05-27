/**
 * Mock Microsoft OneDrive template catalog.
 * Replace with Graph API (/me/drive/items) in production.
 */
import { TEMPLATES } from "@/components/features/kudos/constants";

const ONEDRIVE_META = {
  "gold-classic": {
    driveItemId: "01GOLDCLASSIC",
    path: "/KudosTemplates/GoldClassic.pptx",
    tags: ["individual", "executive", "quarterly", "customer-service"],
    maxRecipients: 2,
    minRecipients: 1,
    teamFriendly: false,
  },
  "blue-morden": {
    driveItemId: "01BLUEMODERN",
    path: "/KudosTemplates/BlueModern.pptx",
    tags: ["team", "milestone", "launch", "corporate"],
    maxRecipients: 8,
    minRecipients: 2,
    teamFriendly: true,
  },
  green: {
    driveItemId: "01GREENNATURE",
    path: "/KudosTemplates/GreenNature.pptx",
    tags: ["team", "wellness", "individual", "sustainability"],
    maxRecipients: 4,
    minRecipients: 1,
    teamFriendly: true,
  },
  "purple-elegant": {
    driveItemId: "01PURPLEELEGANT",
    path: "/KudosTemplates/PurpleElegant.pptx",
    tags: ["individual", "client-champion", "campaign", "premium"],
    maxRecipients: 3,
    minRecipients: 1,
    teamFriendly: false,
  },
  "blue-modern-team": {
    driveItemId: "01BLUEMODERNTEAM",
    path: "/KudosTemplates/BlueModernTeam.pptx",
    tags: ["team", "milestone", "launch", "corporate"],
    maxRecipients: 8,
    minRecipients: 3,
    teamFriendly: true,
  },
  "green-nature": {
    driveItemId: "01GREENNATURECLS",
    path: "/KudosTemplates/GreenNatureClassic.pptx",
    tags: ["team", "wellness", "individual", "sustainability"],
    maxRecipients: 4,
    minRecipients: 1,
    teamFriendly: true,
  },
  "gold-celebration": {
    driveItemId: "01GOLDCELEBRATION",
    path: "/KudosTemplates/GoldCelebration.pptx",
    tags: ["individual", "executive", "quarterly", "customer-service"],
    maxRecipients: 4,
    minRecipients: 1,
    teamFriendly: false,
  },
};

export async function fetchTemplatesFromOneDrive() {
  await new Promise((r) => setTimeout(r, 900));
  return TEMPLATES.map((t) => ({
    ...t,
    source: "onedrive",
    ...ONEDRIVE_META[t.id],
  }));
}

export function recommendTemplate(templates, { recipientCount, category, recognitionType }) {
  if (!templates.length) return null;

  const scored = templates.map((tpl) => {
    let score = 0;
    const isTeam = recognitionType === "team" || recipientCount >= 3;
    if (isTeam && tpl.teamFriendly) score += 3;
    if (!isTeam && !tpl.teamFriendly) score += 2;
    if (recipientCount >= tpl.minRecipients && recipientCount <= tpl.maxRecipients) score += 2;
    if (tpl.tags.includes(category)) score += 4;
    if (recipientCount === 1 && tpl.tags.includes("individual")) score += 2;
    if (recipientCount >= 3 && tpl.tags.includes("team")) score += 2;
    return { tpl, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.tpl?.id ?? templates[0].id;
}
