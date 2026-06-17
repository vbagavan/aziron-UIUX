import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Add content" },
  { id: 2, label: "Attached files" },
  { id: 3, label: "Name your hub" },
];

export function CreateHubStepIndicator({ currentStep }) {
  return (
    <nav aria-label="Create knowledge hub progress" className="mb-4">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      active && "bg-primary text-primary-foreground",
                      done && "bg-primary/20 text-primary",
                      !active && !done && "bg-muted text-muted-foreground",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? "✓" : step.id}
                  </span>
                  <span
                    className={cn(
                      "truncate text-xs font-medium",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                <div
                  className={cn(
                    "h-0.5 w-full rounded-full",
                    done || active ? "bg-primary" : "bg-muted",
                  )}
                  aria-hidden
                />
              </div>
              {index < STEPS.length - 1 && (
                <span className="sr-only">then</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
