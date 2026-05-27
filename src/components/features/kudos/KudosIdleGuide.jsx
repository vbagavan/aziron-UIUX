import { SparkLogo } from "./kudosPrimitives";
import { KUDOS_BADGE, KUDOS_BODY, KUDOS_CAPTION, KUDOS_GUIDE_TITLE } from "./kudosTypography";
import { cn } from "@/lib/utils";

const STEPS = [
  "In the chat, describe who you are recognizing and why — include @Name or an email.",
  "Press Enter — watch the chat for progress steps and template options.",
  "Pick a template in chat, adjust styles with chips, then Submit for approval.",
];

export default function KudosIdleGuide() {
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-6 bg-muted p-8">
      <SparkLogo size={28} />
      <div className="max-w-md text-center space-y-2">
        <h2 className={KUDOS_GUIDE_TITLE}>Customer Appreciation</h2>
        <p className={cn(KUDOS_CAPTION, "leading-6")}>
          Your card preview will appear here after you send a message in the chat panel.
        </p>
      </div>
      <ol className="max-w-sm w-full space-y-3 text-left">
        {STEPS.map((step, i) => (
          <li key={i} className={cn("flex gap-3", KUDOS_BODY)}>
            <span className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground",
              KUDOS_BADGE,
            )}>
              {i + 1}
            </span>
            <span className="leading-6 pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
