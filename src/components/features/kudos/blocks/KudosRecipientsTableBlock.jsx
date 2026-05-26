export default function KudosRecipientsTableBlock({
  recipients = [],
  emailTo = [],
  emailCc = [],
}) {
  const toRecipients = recipients.filter((r) => emailTo.includes(r.email));
  const ccRecipients = recipients.filter((r) => emailCc.includes(r.email));

  const toEmails = toRecipients.map((r) => r.email).join(", ");
  const ccEmails = ccRecipients.map((r) => r.email).join(", ");

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden bg-card">
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr className="border-b border-border">
            <td className="text-left px-4 py-3 font-semibold text-foreground bg-muted min-w-fit">TO</td>
            <td className="text-left px-4 py-3 text-foreground break-words">
              {toEmails || <span className="text-muted-foreground italic">—</span>}
            </td>
          </tr>
          {emailCc.length > 0 && (
            <tr>
              <td className="text-left px-4 py-3 font-semibold text-foreground bg-muted min-w-fit">CC</td>
              <td className="text-left px-4 py-3 text-foreground break-words">
                {ccEmails || <span className="text-muted-foreground italic">—</span>}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
