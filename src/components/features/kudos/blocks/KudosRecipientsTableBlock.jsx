function formatRecipientLine(recipient) {
  if (!recipient?.email) return recipient?.name ?? "";
  if (!recipient?.name) return recipient.email;
  return `${recipient.name} (${recipient.email})`;
}

export default function KudosRecipientsTableBlock({
  recipients = [],
  emailTo = [],
  emailCc = [],
}) {
  const toRecipients = recipients.filter((r) => emailTo.includes(r.email));
  const ccRecipients = recipients.filter((r) => emailCc.includes(r.email));

  const toLines = emailTo.map((email) => {
    const match = toRecipients.find((r) => r.email === email);
    return match ? formatRecipientLine(match) : email;
  });

  const ccLines = emailCc.map((email) => {
    const match = ccRecipients.find((r) => r.email === email);
    return match ? formatRecipientLine(match) : email;
  });

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden bg-card">
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr className="border-b border-border">
            <th
              scope="row"
              className="text-left px-4 py-3 font-semibold text-foreground bg-muted min-w-fit align-top"
            >
              To
            </th>
            <td className="text-left px-4 py-3 text-foreground break-words align-top">
              {toLines.length > 0 ? (
                <ul className="list-none space-y-1">
                  {toLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground italic">—</span>
              )}
            </td>
          </tr>
          {emailCc.length > 0 && (
            <tr>
              <th
                scope="row"
                className="text-left px-4 py-3 font-semibold text-foreground bg-muted min-w-fit align-top"
              >
                Cc
              </th>
              <td className="text-left px-4 py-3 text-foreground break-words align-top">
                {ccLines.length > 0 ? (
                  <ul className="list-none space-y-1">
                    {ccLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground italic">—</span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
