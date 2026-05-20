import { Mail, Users, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { APPRECIATION_CATEGORIES, RECOGNITION_TYPES } from "./constants";

function EmailChipInput({ label, required, tags, inputValue, onInputChange, onAdd, onRemove, placeholder }) {
  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      const email = inputValue.trim().replace(/,$/, "");
      if (email) onAdd(email);
      onInputChange("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="rounded-lg border border-border bg-card px-2 py-2 min-h-[40px]">
        <div className="flex flex-wrap gap-1.5 items-center">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-xs text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="text-primary/70 hover:text-primary"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Add another…"}
            className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}

export default function KudosComposeStep({ workflow, onContinue }) {
  const { compose, updateCompose, templatesLoading, stage } = workflow;
  const needsEmail = compose.emailTo.length === 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-start gap-2">
        <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Start your appreciation</p>
          <p className="text-xs text-muted-foreground leading-4 mt-0.5">
            Enter the message and recipient emails. We&apos;ll extract addresses from the
            conversation when possible, or you can add them below.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="compose-message" className="text-xs font-medium text-foreground">
          Appreciation message <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="compose-message"
          value={compose.message}
          onChange={(e) => updateCompose({ message: e.target.value })}
          placeholder="Describe the appreciation — outstanding service, milestone, etc."
          rows={4}
          className="text-sm resize-none"
        />
      </div>

      <EmailChipInput
        label="To"
        required
        tags={compose.emailTo}
        inputValue={compose.toInput}
        onInputChange={(v) => updateCompose({ toInput: v })}
        onAdd={(e) =>
          updateCompose({
            emailTo: compose.emailTo.includes(e) ? compose.emailTo : [...compose.emailTo, e],
            toInput: "",
          })
        }
        onRemove={(e) => updateCompose({ emailTo: compose.emailTo.filter((x) => x !== e) })}
        placeholder="name@company.com"
      />

      {needsEmail && (
        <p className="text-xs text-warning flex items-center gap-1.5 bg-warning/10 border border-warning-ring rounded-md px-2 py-1.5">
          <Mail size={12} />
          No To recipients detected yet — add emails above or mention colleagues with @Name in chat.
        </p>
      )}

      <EmailChipInput
        label="CC"
        tags={compose.emailCc}
        inputValue={compose.ccInput}
        onInputChange={(v) => updateCompose({ ccInput: v })}
        onAdd={(e) =>
          updateCompose({
            emailCc: compose.emailCc.includes(e) ? compose.emailCc : [...compose.emailCc, e],
            ccInput: "",
          })
        }
        onRemove={(e) => updateCompose({ emailCc: compose.emailCc.filter((x) => x !== e) })}
        placeholder="Optional CC recipients"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Category</label>
          <select
            value={compose.category}
            onChange={(e) => updateCompose({ category: e.target.value })}
            className="h-8 rounded-md border border-border bg-card px-2 text-xs"
          >
            {APPRECIATION_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Recognition type</label>
          <select
            value={compose.recognitionType}
            onChange={(e) => updateCompose({ recognitionType: e.target.value })}
            className="h-8 rounded-md border border-border bg-card px-2 text-xs"
          >
            {RECOGNITION_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="compose-occasion" className="text-xs font-medium text-foreground">
          Occasion / campaign (optional)
        </label>
        <input
          id="compose-occasion"
          value={compose.occasion}
          onChange={(e) => updateCompose({ occasion: e.target.value })}
          placeholder="e.g. Q1 Customer Excellence"
          className="h-8 rounded-md border border-border bg-card px-2 text-sm"
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2"
        disabled={!compose.message.trim() || compose.emailTo.length === 0 || templatesLoading}
        onClick={onContinue}
      >
        {templatesLoading || stage === "loading-templates" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Loading templates from OneDrive…
          </>
        ) : (
          <>
            <Users size={14} />
            Load templates & generate preview
          </>
        )}
      </Button>
    </div>
  );
}
