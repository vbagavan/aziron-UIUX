import { KUDOS_BODY, KUDOS_CAPTION, KUDOS_FIELD_LABEL } from "../kudosTypography";
import { cn } from "@/lib/utils";

function formatRecipientLine(recipient) {
  if (!recipient?.email) return recipient?.name ?? "";
  if (!recipient?.name) return recipient.email;
  return `${recipient.name} (${recipient.email})`;
}

function buildEmailLines(emails, recipients) {
  return (emails ?? []).map((email) => {
    const match = recipients.find((r) => r.email === email);
    return match ? formatRecipientLine(match) : email;
  });
}

function RecipientReviewRow({ field, lines, isLast = false }) {
  return (
    <tr className={cn(!isLast && "border-b border-border")}>
      <th
        scope="row"
        className={cn(
          "w-11 shrink-0 bg-muted px-3 py-2 text-left align-top",
          KUDOS_FIELD_LABEL,
          "font-semibold uppercase tracking-wide text-muted-foreground",
        )}
      >
        {field}
      </th>
      <td className="min-w-0 px-3 py-2 text-left align-top text-foreground">
        {lines.length > 0 ? (
          <ul className="list-none space-y-0.5">
            {lines.map((line) => (
              <li key={`${field}-${line}`} className={cn(KUDOS_BODY, "break-words")}>
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <span className={cn(KUDOS_BODY, "italic text-muted-foreground")}>—</span>
        )}
      </td>
    </tr>
  );
}

export default function KudosRecipientsTableBlock({
  recipients = [],
  emailTo = [],
  emailCc = [],
  emailBcc = [],
}) {
  const toLines = buildEmailLines(emailTo, recipients);
  const ccLines = buildEmailLines(emailCc, recipients);
  const bccLines = buildEmailLines(emailBcc, recipients);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-muted/80 px-3 py-2">
        <p className={cn(KUDOS_FIELD_LABEL, "font-semibold text-foreground")}>
          Email recipients
        </p>
        <p className={cn(KUDOS_CAPTION, "mt-0.5 text-muted-foreground")}>
          Verify To, Cc, and Bcc before submitting for approval.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th
                scope="col"
                className={cn(
                  "w-11 px-3 py-1.5 text-left",
                  KUDOS_CAPTION,
                  "font-semibold uppercase tracking-wide text-muted-foreground",
                )}
              >
                Field
              </th>
              <th
                scope="col"
                className={cn(
                  "px-3 py-1.5 text-left",
                  KUDOS_CAPTION,
                  "font-semibold uppercase tracking-wide text-muted-foreground",
                )}
              >
                Recipients
              </th>
            </tr>
          </thead>
          <tbody>
            <RecipientReviewRow field="To" lines={toLines} />
            <RecipientReviewRow field="Cc" lines={ccLines} />
            <RecipientReviewRow field="Bcc" lines={bccLines} isLast />
          </tbody>
        </table>
      </div>
    </div>
  );
}
