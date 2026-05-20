import { useState, useRef, useEffect, useCallback } from "react";
import {
  DEFAULT_CARD_CONTENT,
  DEFAULT_COMPOSE,
  DEFAULT_RECIPIENTS,
  APPROVAL_KEYWORDS,
  APPROVAL_STATUS,
  SUBMIT_APPROVAL_COMMAND,
} from "./constants";
import {
  extractEmailsFromText,
  mergeRecipientSources,
  parseMentionNames,
} from "@/lib/kudosEmailUtils";
import { fetchTemplatesFromOneDrive, recommendTemplate } from "@/services/oneDriveTemplates";
import { parseTemplateStylePrompt } from "@/lib/kudosStylePrompt";

function cloneContent(content) {
  return { ...content };
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
  const [promptEvents, setPromptEvents] = useState([]);
  const [styleHistory, setStyleHistory] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const pushPromptEvent = useCallback((event) => {
    setPromptEvents((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, ...event }]);
  }, []);

  const updateCompose = (partial) => setCompose((prev) => ({ ...prev, ...partial }));

  const syncRecipientsFromCompose = useCallback(() => {
    const merged = mergeRecipientSources({
      emails: compose.emailTo,
      mentions: parseMentionNames(compose.message),
      existing: selectedRecipients,
    });
    if (merged.length) setSelectedRecipients(merged);
    return merged;
  }, [compose.emailTo, compose.message, selectedRecipients]);

  useEffect(() => {
    const hasKudos = inputValue.includes("/kudos") || ["idle", "compose", "empty"].includes(stage);
    const atIdx = inputValue.lastIndexOf("@");
    if (hasKudos && atIdx !== -1 && ["idle", "compose", "empty"].includes(stage)) {
      const query = inputValue.slice(atIdx + 1);
      const hasSpaceAfterAt = query.includes(" ") && query.trim().split(" ").length > 1;
      if (!hasSpaceAfterAt || query.trim() === "") {
        setShowPicker(true);
        setPickerQuery(query.trim());
      } else {
        setShowPicker(false);
      }
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

  const handleSelectUser = (user) => {
    const atIdx = inputValue.lastIndexOf("@");
    const before = atIdx >= 0 ? inputValue.slice(0, atIdx) : inputValue;
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

  const applyStyleChange = (contentPatch, summary, userText) => {
    setStyleHistory((hist) => [...hist, cloneContent(templateContent)]);
    updateTemplateContent(contentPatch);
    pushPromptEvent({ userText, summary, isHint: false });
  };

  const resetTemplateStyles = () => {
    setStyleHistory((hist) => [...hist, cloneContent(templateContent)]);
    setTemplateContent(cloneContent(baselineTemplateContent));
    pushPromptEvent({
      userText: "Reset styles",
      summary: "Restored template colors to defaults for this card.",
      isHint: false,
    });
  };

  const undoLastStyleChange = () => {
    setStyleHistory((hist) => {
      if (hist.length === 0) {
        pushPromptEvent({
          userText: "Undo last style",
          summary: "Nothing to undo yet.",
          isHint: true,
        });
        return hist;
      }
      const prev = hist[hist.length - 1];
      setTemplateContent(cloneContent(prev));
      pushPromptEvent({
        userText: "Undo last style",
        summary: "Reverted the last style change.",
        isHint: false,
      });
      return hist.slice(0, -1);
    });
  };

  const loadTemplatesAndGenerate = async (messageText, { emailTo: emailToOverride } = {}) => {
    const emailTo = emailToOverride ?? compose.emailTo;
    const recipients = syncRecipientsFromCompose();
    const recipientCount = Math.max(recipients.length, emailTo.length, 1);

    if (emailTo.length === 0) {
      setStage("idle");
      return { error: "Include at least one recipient email in your message (e.g. name@company.com)." };
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
        message: messageText || compose.message || DEFAULT_CARD_CONTENT.message,
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
    pushPromptEvent({
      userText: userMessage,
      summary: "Submitted for PSP team review. You will be notified when they decide.",
      isHint: false,
    });
    setLiveStatus("Submitted for PSP review");
  };

  const runPreviewCommand = (command) => {
    const raw = command.trim();
    if (raw === "__reset_styles__") {
      resetTemplateStyles();
      return;
    }
    if (raw === "__undo_style__") {
      undoLastStyleChange();
      return;
    }
    if (APPROVAL_KEYWORDS.test(raw)) {
      handleRequestApproval(raw);
      return;
    }
    const styleResult = parseTemplateStylePrompt(raw);
    if (styleResult) {
      if (styleResult.templateId) setActiveTemplate(styleResult.templateId);
      applyStyleChange(styleResult.content, styleResult.summary, raw);
      return;
    }
    pushPromptEvent({
      userText: raw,
      summary:
        'Try "change background to blue", "dark theme", or use Submit for approval when ready.',
      isHint: true,
    });
  };

  const handleSend = async () => {
    const raw = inputValue.trim();
    if (!raw && stage !== "compose") return;

    if (stage === "preview") {
      setIsSending(true);
      try {
        runPreviewCommand(raw);
        setInputValue("");
        setShowPicker(false);
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (stage === "generating" || stage === "loading-templates") return;

    const messageFromChat = raw.replace(/^\/kudos\s*/i, "").trim();

    if (["idle", "compose", "empty"].includes(stage)) {
      setIsSending(true);
      try {
        const emailsInChat = extractEmailsFromText(raw);
        const mentions = parseMentionNames(raw);
        const emailTo = [
          ...new Set([
            ...compose.emailTo,
            ...emailsInChat,
            ...mentions.map((m) => m.email).filter(Boolean),
          ]),
        ];
        const message = messageFromChat || compose.message;

        updateCompose({
          emailTo,
          message: message || compose.message,
        });

        const result = await loadTemplatesAndGenerate(message || compose.message, { emailTo });
        if (result?.error) {
          pushPromptEvent({ userText: raw, summary: result.error, isHint: true, isError: true });
          return;
        }
        setInputValue("");
        setShowPicker(false);
      } finally {
        setIsSending(false);
      }
    }
  };

  const submitComposeForm = async () => {
    await loadTemplatesAndGenerate(compose.message);
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
    setPromptEvents([]);
    setStyleHistory([]);
    setIsSending(false);
    setLiveStatus("");
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
    templateContent,
    updateTemplateContent,
    promptEvents,
    styleUpdates: promptEvents,
    approvals,
    notifOpen,
    setNotifOpen,
    lastNotificationChannels,
    isSending,
    liveStatus,
    handleSelectUser,
    handleSend,
    runPreviewCommand,
    submitComposeForm,
    handleApprove,
    handleReject,
    handleRequestChanges,
    handleRequestApproval,
    handleUpdateApproval,
    reset,
  };
}
