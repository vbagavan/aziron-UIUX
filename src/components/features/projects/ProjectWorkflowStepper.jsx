import { Check } from "lucide-react";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { PROJECT_WORKFLOW_STEPS } from "@/data/projectWorkflowFlow";

/**
 * @param {{ currentStep: number, maxReachableStep?: number, onStepClick?: (step: number) => void }} props
 */
export function ProjectWorkflowStepper({ currentStep, maxReachableStep = currentStep, onStepClick }) {
  return (
    <Stepper
      value={currentStep}
      indicators={{ completed: <Check /> }}
      className="w-full"
    >
      <StepperNav className="flex w-full items-center">
        {PROJECT_WORKFLOW_STEPS.map((step, index) => {
          const canNavigate = onStepClick && step.id <= maxReachableStep && step.id !== currentStep;
          return (
            <StepperItem
              key={step.key}
              step={step.id}
              completed={step.id < currentStep}
              loading={step.key === "extract" && currentStep === 2}
              className="flex flex-1 items-center last:flex-none"
            >
              <StepperTrigger
                className="flex w-full min-w-0 flex-col items-center gap-1 px-1"
                disabled={!canNavigate}
                onClick={() => canNavigate && onStepClick(step.id)}
              >
                <StepperIndicator className="size-8 text-xs font-semibold data-[step-state=active]:ring-4 data-[step-state=active]:ring-primary/25">
                  {step.id}
                </StepperIndicator>
                <StepperTitle className="text-center text-[11px] font-medium leading-tight">
                  {step.label}
                </StepperTitle>
                <span className="hidden text-center text-[10px] text-muted-foreground sm:block">
                  {step.description}
                </span>
              </StepperTrigger>
              {index < PROJECT_WORKFLOW_STEPS.length - 1 ? (
                <StepperSeparator className="mx-1 mb-5 h-px min-w-4 flex-1" />
              ) : null}
            </StepperItem>
          );
        })}
      </StepperNav>
    </Stepper>
  );
}
