/**
 * Full-size preview using the OneDrive template sample image.
 * Updates when the user picks a different thumbnail in the chat panel.
 */
export default function KudosOneDriveTemplatePreview({ template }) {
  if (!template?.thumbSrc) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      style={{ width: 700, minHeight: 500 }}
    >
      <img
        key={template.id}
        src={template.thumbSrc}
        alt={template.label}
        className="block h-full w-full object-cover object-top"
        style={{ minHeight: 500 }}
        draggable={false}
      />
    </div>
  );
}
