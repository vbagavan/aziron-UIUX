import { useState, useRef, useEffect, useCallback } from "react";
import {
  DEFAULT_CARD_CONTENT,
  DEFAULT_COMPOSE,
  DEFAULT_RECIPIENTS,
  APPROVAL_KEYWORDS,
  APPROVAL_STATUS,
  SUBMIT_APPROVAL_COMMAND,
  TEMPLATES,
} from "./constants";
import {
  extractAppreciationMessageFromPrompt,
  extractEmailsFromText,
  getActiveMention,
  mergeRecipientSources,
  parseMentionNames,
} from "@/lib/kudosEmailUtils";
import { fetchTemplatesFromOneDrive, recommendTemplate } from "@/services/oneDriveTemplates";
import { parseTemplateStylePrompt } from "@/lib/kudosStylePrompt";
import { hasCustomCardStyles } from "@/lib/kudosPreviewUtils";
import {
  buildKudosGenerationBlocks,
  buildComposeGuidanceBlocks,
  buildTemplateSelectBlocks,
  buildPreviewResultBlocks,
  buildStyleReplyBlocks,
  buildApprovalSubmittedBlocks,
  KUDOS_STYLE_TIMELINE_STEPS,
} from "./kudosConversation";

function cloneContent(content) {
  return { ...content };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useKudosWorkflow() {
  const [stage, setStage] = useState("idle");
  const [inputValue, setInputValue] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [compose, setCompose] = useState(DEFAULT_COMPOSE);
  const [selectedRecipients, setSelectedRecipients] = useState(DEFAULT_RECIPIENTS);
  const [onedriveTemplates, setOnedriveTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [recommendedTemplateId, setRecommendedTemplateId] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState("gold-classic");
  const [templateContent, setTemplateContent] = useState(DEFAULT_CARD_CONTENT);
  const [baselineTemplateContent, setBaselineTemplateContent] = useState(DEFAULT_CARD_CONTENT);
  const [approvals, setApprovals] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastNotificationChannels, setLastNotificationChannels] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [styleHistory, setStyleHistory] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const timersRef = useRef([]);
  const generationMsgIdRef = useRef(null);
  const styleReplyMsgIdRef = useRef(null);
  const [chatScrollEpoch, setChatScrollEpoch] = useState(0);

  const requestChatScroll = useCallback(() => {
    setChatScrollEpoch((n) => n + 1);
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const updateCompose = (partial) => setCompose((prev) => ({ ...prev, ...partial }));

  const appendChatMessages = useCallback((...messages) => {
    setChatMessages((prev) => [...prev, ...messages]);
  }, []);

  const patchChatMessage = useCallback((id, patch) => {
    setChatMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const syncRecipientsFromCompose = useCallback(
    (emailOverride) => {
      const emails = emailOverride ?? compose.emailTo;
      const merged = mergeRecipientSources({
        emails,
        mentions: parseMentionNames(compose.message),
        existing: selectedRecipients,
      });
      if (merged.length) setSelectedRecipients(merged);
      return merged;
    },
    [compose.emailTo, compose.message, selectedRecipients],
  );

  useEffect(() => {
    const mention = getActiveMention(inputValue);
    const canMention = ["idle", "compose", "empty", "preview"].includes(stage);
    if (mention && canMention) {
      setShowPicker(true);
      setPickerQuery(mention.query);
    } else {
      setShowPicker(false);
    }
  }, [inputValue, stage]);

  useEffect(() => {
    if (!["idle", "compose"].includes(stage)) return;
    const text = [compose.message, inputValue].filter(Boolean).join(" ");
    const found = extractEmailsFromText(text);
    if (found.length === 0) return;
    const missing = found.filter((e) => !compose.emailTo.includes(e));
    if (missing.length) updateCompose({ emailTo: [...compose.emailTo, ...missing] });
  }, [inputValue, compose.message, stage]);

  useEffect(() => {
    if (stage === "loading-templates") setLiveStatus("Loading templates from OneDrive");
    else if (stage === "generating") setLiveStatus("Generating your appreciation card");
    else if (stage === "preview") setLiveStatus("Preview ready for review");
    else setLiveStatus("");
  }, [stage]);

  useEffect(() => {
    const id = generationMsgIdRef.current;
    if (!id) return;

    if (stage === "loading-templates" || stage === "generating") {
      patchChatMessage(id, { blocks: buildKudosGenerationBlocks(stage) });
      return;
    }

    if (stage === "preview") {
      patchChatMessage(id, {
        kind: "assistant",
        blocks: [
          ...buildKudosGenerationBlocks("preview"),
          ...buildPreviewResultBlocks({
            selectedRecipients,
            compose,
            activeTemplate,
            onedriveTemplates,
            recommendedTemplateId,
          }),
        ],
      });
      generationMsgIdRef.current = null;
      requestChatScroll();
    }
  }, [
    stage,
    selectedRecipients,
    compose,
    activeTemplate,
    onedriveTemplates,
    recommendedTemplateId,
    patchChatMessage,
    requestChatScroll,
  ]);

  const selectTemplate = useCallback(
    (templateId) => {
      if (templateId === activeTemplate) return;
      setActiveTemplate(templateId);
      if (stage !== "preview") return;

      const catalog = onedriveTemplates.length > 0 ? onedriveTemplates : TEMPLATES;
      const label = catalog.find((t) => t.id === templateId)?.label ?? templateId;

      appendChatMessages({
        id: `a-tpl-${Date.now()}`,
        role: "assistant",
        blocks: buildTemplateSelectBlocks(label),
      });
      requestChatScroll();
    },
    [activeTemplate, stage, onedriveTemplates, appendChatMessages, requestChatScroll],
  );

  const handleSelectUser = (user) => {
    const mention = getActiveMention(inputValue);
    const before = mention ? inputValue.slice(0, mention.atIdx) : inputValue;
    const newValue = before + "@" + user.name + " ";
    setInputValue(newValue);
    setShowPicker(false);
    updateCompose({
      emailTo: compose.emailTo.includes(user.email)
        ? compose.emailTo
        : [...compose.emailTo, user.email],
      message: compose.message || newValue.replace(/^\/kudos\s*/i, "").trim(),
    });
    setSelectedRecipients((prev) => {
      if (prev.find((r) => r.name === user.name)) return prev;
      return [...prev, { name: user.name, color: user.color, email: user.email }];
    });
  };

  const updateTemplateContent = (partial) => {
    setTemplateContent((prev) => {
      const next = { ...prev, ...partial };
      return next;
    });
  };

  const applyStyleChange = (contentPatch, summary) => {
    setStyleHistory((hist) => [...hist, cloneContent(templateContent)]);
    updateTemplateContent(contentPatch);
    return summary;
  };

  const resetTemplateStyles = () => {
    setStyleHistory((hist) => [...hist, cloneContent(templateContent)]);
    setTemplateContent(cloneContent(baselineTemplateContent));
    return "Restored template colors to defaults for this card.";
  };

  const undoLastStyleChange = () => {
    let summary = "Nothing to undo yet.";
    let isHint = true;
    let restoredContent = templateContent;
    setStyleHistory((hist) => {
      if (hist.length === 0) return hist;
      const prev = hist[hist.length - 1];
      restoredContent = cloneContent(prev);
      setTemplateContent(restoredContent);
      summary = "Reverted the last style change.";
      isHint = false;
      return hist.slice(0, -1);
    });
    return { summary, isHint, restoredContent };
  };

  const loadTemplatesAndGenerate = async (messageText, { emailTo: emailToOverride } = {}) => {
    const emailTo = emailToOverride ?? compose.emailTo;
    const recipients = syncRecipientsFromCompose(emailTo);
    const recipientCount = Math.max(recipients.length, emailTo.length, 1);

    const appreciationText = (messageText || compose.message || "").trim();
    if (emailTo.length === 0) {
      setStage("idle");
      generationMsgIdRef.current = null;
      return { error: "Include at least one recipient — use @Name or an email like name@company.com." };
    }
    if (!appreciationText || appreciationText.length < 8) {
      setStage("idle");
      generationMsgIdRef.current = null;
      return {
        error:
          "Add your appreciation message — a sentence or two about who you are recognizing and why.",
      };
    }

    setTemplatesLoading(true);
    setStage("loading-templates");

    try {
      const templates = await fetchTemplatesFromOneDrive();
      setOnedriveTemplates(templates);

      const recommended = recommendTemplate(templates, {
        recipientCount,
        category: compose.category,
        recognitionType:
          compose.recognitionType === "team" || recipientCount >= 3 ? "team" : "individual",
      });
      setRecommendedTemplateId(recommended);
      setActiveTemplate(recommended);

      const nextContent = {
        ...DEFAULT_CARD_CONTENT,
        message: appreciationText || DEFAULT_CARD_CONTENT.message,
      };
      setTemplateContent(nextContent);
      setBaselineTemplateContent(cloneContent(nextContent));
      setStyleHistory([]);

      setStage("generating");
      const t2 = setTimeout(() => setStage("preview"), 1800);
      timersRef.current = [t2];
      return { ok: true };
    } finally {
      setTemplatesLoading(false);
    }
  };

  const dispatchPspNotifications = (approvalId) => {
    const channels = {
      push: { sent: true, at: new Date().toISOString(), audience: "PSP Mobile App" },
      teams: { sent: true, at: new Date().toISOString(), channel: "#psp-kudos-approvals" },
      email: {
        sent: true,
        at: new Date().toISOString(),
        to: ["psp-approvals@aziro.com", "kudos-review@aziro.com"],
      },
    };
    setLastNotificationChannels(channels);
    setApprovals((prev) =>
      prev.map((a) => (a.id === approvalId ? { ...a, notifications: channels } : a)),
    );
    return channels;
  };

  const handleRequestApproval = (userMessage = SUBMIT_APPROVAL_COMMAND) => {
    const recipients = syncRecipientsFromCompose();
    const newApproval = {
      id: Date.now().toString(),
      status: APPROVAL_STATUS.PENDING,
      template: activeTemplate,
      templateContent: { ...templateContent },
      compose: { ...compose },
      recipients,
      userMessage,
      emailTo: [...compose.emailTo],
      emailCc: [...compose.emailCc],
      submittedAt: new Date().toISOString(),
      pspComment: "",
      reviewHistory: [{ at: new Date().toISOString(), action: "submitted", by: "Requester" }],
    };
    setApprovals((prev) => [...prev, newApproval]);
    dispatchPspNotifications(newApproval.id);
    setNotifOpen(true);
    setInputValue("");
    setShowPicker(false);
    setLiveStatus("Submitted for approval");
    appendChatMessages({
      id: `a-approval-${newApproval.id}`,
      role: "assistant",
      blocks: buildApprovalSubmittedBlocks(),
    });
    requestChatScroll();
  };

  const runPreviewCommand = async (command) => {
    const raw = command.trim();
    const assistantId = `a-style-${Date.now()}`;

    const finishStyleReply = (summary, { isHint = false, isError = false, showsStyledPreview = false } = {}) => {
      patchChatMessage(assistantId, {
        kind: "assistant",
        blocks: [
          { type: "timeline", duration: "1.2s", steps: KUDOS_STYLE_TIMELINE_STEPS },
          ...buildStyleReplyBlocks({ summary, isHint, isError, showsStyledPreview }),
        ],
      });
      styleReplyMsgIdRef.current = null;
      requestChatScroll();
    };

    requestChatScroll();
    appendChatMessages(
      { id: `u-style-${Date.now()}`, role: "user", content: raw },
      {
        id: assistantId,
        role: "assistant",
        kind: "style-pending",
        blocks: [
          { type: "thinking", duration: "1.0s" },
          { type: "timeline", duration: "1.2s", steps: KUDOS_STYLE_TIMELINE_STEPS },
        ],
      },
    );
    styleReplyMsgIdRef.current = assistantId;

    await delay(900);

    if (raw === "__reset_styles__") {
      const summary = resetTemplateStyles();
      finishStyleReply(summary, { showsStyledPreview: false });
      return;
    }
    if (raw === "__undo_style__") {
      const { summary, isHint, restoredContent } = undoLastStyleChange();
      finishStyleReply(summary, {
        isHint,
        showsStyledPreview:
          !isHint && hasCustomCardStyles(restoredContent, baselineTemplateContent),
      });
      return;
    }
    if (APPROVAL_KEYWORDS.test(raw)) {
      setChatMessages((prev) => prev.filter((m) => m.id !== assistantId));
      styleReplyMsgIdRef.current = null;
      handleRequestApproval(raw);
      return;
    }
    const styleResult = parseTemplateStylePrompt(raw);
    if (styleResult) {
      if (styleResult.templateId) setActiveTemplate(styleResult.templateId);
      applyStyleChange(styleResult.content, styleResult.summary);
      finishStyleReply(styleResult.summary, { showsStyledPreview: true });
      return;
    }
    finishStyleReply(
      'Try "blue background", "dark theme", or tap Submit for approval when you are done.',
      { isHint: true },
    );
  };

  const handleSend = async () => {
    const raw = inputValue.trim();
    if (!raw && stage !== "compose") return;

    if (stage === "preview") {
      setIsSending(true);
      try {
        await runPreviewCommand(raw);
        setInputValue("");
        setShowPicker(false);
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (stage === "generating" || stage === "loading-templates") return;

    if (["idle", "compose", "empty"].includes(stage)) {
      const emailsInChat = extractEmailsFromText(raw);
      const mentions = parseMentionNames(raw);
      const emailTo = [
        ...new Set([
          ...compose.emailTo,
          ...emailsInChat,
          ...mentions.map((m) => m.email).filter(Boolean),
        ]),
      ];
      const message = extractAppreciationMessageFromPrompt(raw);
      const missingEmail = emailTo.length === 0;
      const missingMessage = !message || message.length < 8;

      setIsSending(true);
      requestChatScroll();
      setInputValue("");
      setShowPicker(false);

      if (missingEmail || missingMessage) {
        updateCompose({ emailTo, message: message || compose.message });
        appendChatMessages(
          { id: `u-${Date.now()}`, role: "user", content: raw },
          {
            id: `a-guide-${Date.now()}`,
            role: "assistant",
            blocks: buildComposeGuidanceBlocks({ missingEmail, missingMessage }),
          },
        );
        setIsSending(false);
        return;
      }

      const assistantId = `a-gen-${Date.now()}`;
      generationMsgIdRef.current = assistantId;
      setStage("loading-templates");

      appendChatMessages(
        { id: `u-${Date.now()}`, role: "user", content: raw },
        {
          id: assistantId,
          role: "assistant",
          kind: "generation",
          blocks: buildKudosGenerationBlocks("loading-templates"),
        },
      );

      updateCompose({ emailTo, message });

      try {
        const result = await loadTemplatesAndGenerate(message, { emailTo });
        if (result?.error) {
          generationMsgIdRef.current = null;
          patchChatMessage(assistantId, {
            kind: "assistant",
            blocks: [
              {
                type: "alert",
                variant: "error",
                title: "Could not generate card",
                description: result.error,
              },
            ],
          });
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleApprove = (approvalId, comment = "") => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: APPROVAL_STATUS.APPROVED,
              pspComment: comment,
              reviewHistory: [
                ...(a.reviewHistory ?? []),
                { at: new Date().toISOString(), action: "approved", by: "PSP Team", comment },
              ],
            }
          : a,
      ),
    );
    return "Appreciation approved.";
  };

  const handleReject = (approvalId, comment = "") => {
    if (!comment?.trim()) return null;
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: APPROVAL_STATUS.REJECTED,
              pspComment: comment,
              reviewHistory: [
                ...(a.reviewHistory ?? []),
                { at: new Date().toISOString(), action: "rejected", by: "PSP Team", comment },
              ],
            }
          : a,
      ),
    );
    return "Appreciation rejected.";
  };

  const handleRequestChanges = (approvalId, comment) => {
    if (!comment?.trim()) return null;
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: APPROVAL_STATUS.CHANGES_REQUESTED,
              pspComment: comment,
              reviewHistory: [
                ...(a.reviewHistory ?? []),
                {
                  at: new Date().toISOString(),
                  action: "changes_requested",
                  by: "PSP Team",
                  comment,
                },
              ],
            }
          : a,
      ),
    );
    return "Change request sent to the requester.";
  };

  const handleUpdateApproval = (approvalId, updates) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === approvalId ? { ...a, ...updates } : a)),
    );
  };

  const reset = () => {
    clearTimers();
    setStage("idle");
    setInputValue("");
    setShowPicker(false);
    setPickerQuery("");
    setCompose(DEFAULT_COMPOSE);
    setSelectedRecipients(DEFAULT_RECIPIENTS);
    setOnedriveTemplates([]);
    setTemplatesLoading(false);
    setRecommendedTemplateId(null);
    setActiveTemplate("gold-classic");
    setTemplateContent(DEFAULT_CARD_CONTENT);
    setBaselineTemplateContent(DEFAULT_CARD_CONTENT);
    setApprovals([]);
    setNotifOpen(false);
    setLastNotificationChannels(null);
    setChatMessages([]);
    generationMsgIdRef.current = null;
    styleReplyMsgIdRef.current = null;
    setStyleHistory([]);
    setIsSending(false);
    setLiveStatus("");
    setChatScrollEpoch(0);
  };

  return {
    stage,
    inputValue,
    setInputValue,
    showPicker,
    pickerQuery,
    compose,
    updateCompose,
    selectedRecipients,
    setSelectedRecipients,
    onedriveTemplates,
    templatesLoading,
    recommendedTemplateId,
    activeTemplate,
    setActiveTemplate,
    selectTemplate,
    templateContent,
    updateTemplateContent,
    chatMessages,
    chatScrollEpoch,
    requestChatScroll,
    baselineTemplateContent,
    reset,
    approvals,
    notifOpen,
    setNotifOpen,
    lastNotificationChannels,
    isSending,
    liveStatus,
    handleSelectUser,
    handleSend,
    runPreviewCommand,
    handleApprove,
    handleReject,
    handleRequestChanges,
    handleRequestApproval,
    handleUpdateApproval,
  };
}
