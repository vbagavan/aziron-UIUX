import { KUDOS_DEFAULT_BCC_RECIPIENTS } from "@/components/features/kudos/constants";

/** Default appreciation send date: next calendar day (ISO date). */
export function defaultScheduledDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function formatScheduledDateDisplay(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? "";
}

function uniqueEmails(emails, exclude = []) {
  const excludeSet = new Set(exclude.map(normalizeEmail));
  const seen = new Set();
  const result = [];
  for (const raw of emails ?? []) {
    const email = raw?.trim();
    if (!email) continue;
    const key = normalizeEmail(email);
    if (excludeSet.has(key) || seen.has(key)) continue;
    seen.add(key);
    result.push(email);
  }
  return result;
}

/**
 * Merge Keka managers into CC and append default BCC distribution list.
 * @param {Object} params
 * @param {string[]} params.emailTo
 * @param {string[]} [params.emailCc]
 * @param {string[]} [params.emailBcc]
 * @param {string} [params.scheduledDate]
 * @param {Array<{ email: string }>} [params.hierarchyManagers]
 */
export function planKudosRecipients({
  emailTo = [],
  emailCc = [],
  emailBcc = [],
  scheduledDate,
  hierarchyManagers = [],
}) {
  const toList = uniqueEmails(emailTo);
  const toKeys = toList.map(normalizeEmail);

  const managerEmails = hierarchyManagers
    .map((m) => m.email)
    .filter((email) => !toKeys.includes(normalizeEmail(email)));

  const ccList = uniqueEmails([...emailCc, ...managerEmails], toList);
  const bccList = uniqueEmails([...emailBcc, ...KUDOS_DEFAULT_BCC_RECIPIENTS], [
    ...toList,
    ...ccList,
  ]);

  return {
    emailTo: toList,
    emailCc: ccList,
    emailBcc: bccList,
    scheduledDate: scheduledDate || defaultScheduledDateIso(),
    hierarchyManagers,
  };
}

/** @param {Array<{ name?: string, email: string, color?: string }>} existing */
export function mergeHierarchyIntoRecipients(existing, hierarchyManagers) {
  const byEmail = new Map((existing ?? []).map((r) => [normalizeEmail(r.email), r]));
  for (const manager of hierarchyManagers ?? []) {
    const key = normalizeEmail(manager.email);
    if (!key || byEmail.has(key)) continue;
    byEmail.set(key, {
      name: manager.name,
      email: manager.email,
      color: "var(--muted-foreground)",
    });
  }
  return Array.from(byEmail.values());
}
