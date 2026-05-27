import { SparkLogo } from "./kudosUi";

const STEPS = [
  "In the chat, describe who you are recognizing and why — include @Name or an email.",
  "Press Enter — watch the chat for thinking, timeline, and template thumbnails (like New Chat).",
  "Pick a template in chat, adjust styles with chips, then submit for approval.",
];

export default function KudosIdleGuide() {
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-6 bg-muted p-8">
      <SparkLogo size={28} />
      <div className="max-w-md text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Customer appreciation</h2>
        <p className="text-sm text-muted-foreground leading-6">
          Your certificate preview will appear here after you send a message in the chat panel.
        </p>
      </div>
      <ol className="max-w-sm w-full space-y-3 text-left">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {i + 1}
            </span>
            <span className="leading-6 pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
