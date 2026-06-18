import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { WizardStepIndicator } from "@/components/features/knowledge/source-intake/WizardStepIndicator";

const STEPS = [
  { id: 1, label: KNOWLEDGE_TERMS.createHubStepAddSources },
  { id: 2, label: KNOWLEDGE_TERMS.createHubStepNameHub },
];

export function CreateHubStepIndicator({ currentStep }) {
  return (
    <WizardStepIndicator
      steps={STEPS}
      currentStep={currentStep}
      ariaLabel="Create knowledge hub progress"
    />
  );
}
