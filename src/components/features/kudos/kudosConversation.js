import { TEMPLATES } from "./constants";

export const KUDOS_TIMELINE_STEPS = [
  {
    id: 1,
    kind: "comment",
    text: "Reading your message and identifying recipients for this appreciation card.",
  },
  {
    id: 2,
    kind: "action",
    action: "Read",
    target: "Microsoft OneDrive /KudosTemplates",
    meta: "Listing available certificate layouts",
    code: null,
  },
  {
    id: 3,
    kind: "action",
    action: "Write",
    target: "preview/AppreciationCard",
    meta: "Applying template layout, recipients, and message copy",
    code: [
      { num: 1, text: "import { recommendTemplate } from '@/services/oneDriveTemplates';" },
      { num: 2, text: "const template = recommendTemplate(catalog, { recipientCount, category });" },
      { num: 3, text: "renderKudosTemplate(template.id, recipients, content);" },
    ],
  },
  { id: 4, kind: "pondering" },
];

export const KUDOS_TEMPLATE_SWITCH_STEPS = [
  {
    id: 1,
    kind: "comment",
    text: "Applying your template choice to the certificate preview.",
  },
  {
    id: 2,
    kind: "action",
    action: "Read",
    target: "Microsoft OneDrive /KudosTemplates",
    meta: "Loading layout assets",
    code: null,
  },
  {
    id: 3,
    kind: "action",
    action: "Write",
    target: "preview/AppreciationCard",
    meta: "Updating layout and thumbnail selection",
    code: null,
  },
  { id: 4, kind: "pondering" },
];

export const KUDOS_STYLE_TIMELINE_STEPS = [
  {
    id: 1,
    kind: "comment",
    text: "Applying your style change to the appreciation card.",
  },
  {
    id: 2,
    kind: "action",
    action: "Read",
    target: "preview/AppreciationCard",
    meta: "Current colors and theme",
    code: null,
  },
  {
    id: 3,
    kind: "action",
    action: "Write",
    target: "preview/AppreciationCard",
    meta: "Updating card styles",
    code: null,
  },
  { id: 4, kind: "pondering" },
];

/** Progressive blocks — same pattern as New Chat / Pulse: thinking → generating → timeline. */
export function buildKudosGenerationBlocks(stage, { variant = "compose" } = {}) {
  const blocks = [];
  const timelineSteps =
    variant === "style"
      ? KUDOS_STYLE_TIMELINE_STEPS
      : variant === "template-switch"
        ? KUDOS_TEMPLATE_SWITCH_STEPS
        : KUDOS_TIMELINE_STEPS;

  if (!["loading-templates", "generating", "preview"].includes(stage)) {
    return blocks;
  }

  if (variant === "style") {
    blocks.push({ type: "timeline", duration: "1.2s", steps: timelineSteps });
    return blocks;
  }

  if (variant === "template-switch") {
    blocks.push(
      { type: "thinking", duration: "0.9s" },
      { type: "timeline", duration: "1.4s", steps: timelineSteps },
    );
    return blocks;
  }

  blocks.push({ type: "thinking", duration: "1.4s" });
  blocks.push({ type: "generating" });
  blocks.push({
    type: "timeline",
    duration: "3.1s",
    steps: timelineSteps,
  });

  return blocks;
}

export function buildTemplateSelectBlocks(templateLabel) {
  return [
    ...buildKudosGenerationBlocks("preview", { variant: "template-switch" }),
    {
      type: "text",
      content: `Switched to ${templateLabel}. The preview on the left updates to match.`,
    },
  ];
}

export function buildIntroBlocks() {
  return [
    {
      type: "heading",
      level: 2,
      content: "Send a customer appreciation",
    },
    {
      type: "text",
      content:
        "Describe who you are recognizing and why. Include at least one recipient using @Name or an email address, then press Enter.",
    },
    {
      type: "text",
      content:
        "You will see thinking, a step-by-step timeline, and template thumbnails in this chat — same as New Chat — then pick a layout below.",
    },
    {
      type: "text",
      content:
        "Example: @Zoya Baum — thank you for going above and beyond for our customer this quarter. zbaum@aziro.com",
    },
  ];
}

export function buildComposeGuidanceBlocks({ missingEmail, missingMessage }) {
  let content;
  if (missingEmail && missingMessage) {
    content =
      "I need a recipient and your appreciation message. Mention someone with @Name or include their email, and describe what you are recognizing them for.";
  } else if (missingEmail) {
    content =
      "I have your message but need at least one recipient. Add an email (name@company.com) or @mention a colleague.";
  } else {
    content =
      "I see the recipient(s) but need the appreciation text — a sentence or two about what they did.";
  }
  return [
    { type: "text", content },
    {
      type: "text",
      content:
        "Example: @Zoya Baum — thank you for outstanding service on the Acme renewal. zbaum@aziro.com",
    },
  ];
}

export function buildPreviewResultBlocks({
  selectedRecipients,
  compose,
  activeTemplate,
  onedriveTemplates,
  recommendedTemplateId,
}) {
  const catalog = onedriveTemplates.length ? onedriveTemplates : TEMPLATES;
  const templateLabel = catalog.find((t) => t.id === activeTemplate)?.label ?? "Selected template";

  return [
    {
      type: "heading",
      level: 3,
      content: "Your card is ready to review",
    },
    {
      type: "text",
      content: `Templates are synced from OneDrive. Recommended layout: ${templateLabel}. Confirm recipients and pick a different template if you like.`,
    },
    {
      type: "kudos_recipients_table",
      recipients: selectedRecipients,
      emailTo: compose.emailTo,
      emailCc: compose.emailCc,
    },
    {
      type: "kudos_template_preview",
      templateId: activeTemplate,
      templates: onedriveTemplates.length ? onedriveTemplates : TEMPLATES,
      recommendedTemplateId,
      recommended: activeTemplate === recommendedTemplateId,
    },
    {
      type: "text",
      content:
        "Pick a template below. Color and theme chips update the live card preview on the left when you apply them.",
    },
  ];
}

export function buildStyleReplyBlocks({ summary, isHint, isError, showsStyledPreview = false }) {
  if (isError) {
    return [
      {
        type: "alert",
        variant: "error",
        title: "Could not apply that change",
        description: summary,
      },
    ];
  }
  if (isHint) {
    return [{ type: "text", content: summary }];
  }
  const blocks = [{ type: "text", content: summary }];
  if (showsStyledPreview) {
    blocks.push({
      type: "text",
      content: "The live card preview on the left reflects your style change.",
    });
  } else {
    blocks.push({
      type: "text",
      content:
        "Template layout previews use your OneDrive sample. Color and theme changes apply to the live card preview on the left.",
    });
  }
  blocks.push({
    type: "text",
    content: "Tap Submit for approval when you are ready.",
  });
  return blocks;
}

export function buildApprovalSubmittedBlocks() {
  return [
    {
      type: "text",
      content:
        "Your card is with the approval team. You will be notified when they approve, request changes, or reject.",
    },
  ];
}
