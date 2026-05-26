import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ProjectDocumentUploadZone } from "@/components/features/projects/ProjectDocumentUploadZone";
import { ProjectDocumentReviewWorkspace } from "@/components/features/projects/ProjectDocumentReviewWorkspace";
import { usePerDocumentExtraction } from "@/hooks/usePerDocumentExtraction";
import { ProjectWorkflowStepper } from "@/components/features/projects/ProjectWorkflowStepper";
import { ProjectWorkflowConfirmStep } from "@/components/features/projects/ProjectWorkflowConfirmStep";
import { EXTRACTION_SCHEMA_GROUPS } from "@/data/projectWorkflowFlow";
import { projectToMetadataValues } from "@/data/projectMetadataSchema";
import { validateMetadataForm } from "@/data/projectDocuments";

const STEP_UPLOAD = 1;
const STEP_EXTRACT = 2;
const STEP_REVIEW = 3;
const STEP_CONFIRM = 4;

/**
 * Unified create / edit flow: Upload → Extract → Review → Confirm → Submit.
 *
 * @param {{
 *   mode: 'create' | 'edit',
 *   existingProject?: object | null,
 *   onCancel: () => void,
 *   onSubmit: (payload: { formValues: object, uploads: object[] }) => void,
 * }} props
 */
export function ProjectDocumentWorkflow({ mode, existingProject, onCancel, onSubmit }) {
  const [currentStep, setCurrentStep] = useState(STEP_UPLOAD);
  const [maxReachableStep, setMaxReachableStep] = useState(STEP_UPLOAD);
  const [uploads, setUploads] = useState([]);
  const seedMetadata = projectToMetadataValues(existingProject);
  const extraction = usePerDocumentExtraction(seedMetadata);
  const [validation, setValidation] = useState({ errors: [], warnings: [], valid: true });
  const [extractError, setExtractError] = useState(null);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
    setMaxReachableStep((prev) => Math.max(prev, step));
  }, []);

  async function handleStartExtraction() {
    if (uploads.length === 0 && mode === "create") {
      setValidation({
        errors: ["Upload at least one supporting document to continue."],
        warnings: [],
        valid: false,
      });
      return;
    }

    setValidation({ errors: [], warnings: [], valid: true });
    setExtractError(null);
    goToStep(STEP_EXTRACT);
    setExtractionProgress(8);

    const tick = window.setInterval(() => {
      setExtractionProgress((p) => Math.min(p + 10, 92));
    }, 180);

    try {
      if (uploads.length > 0) {
        extraction.setUploads(uploads);
        await new Promise((r) => setTimeout(r, 1200));
      }
      setValidation(validateMetadataForm(extraction.activeFormValues ?? seedMetadata));
      setExtractionProgress(100);
      goToStep(STEP_REVIEW);
    } catch {
      setExtractError("Metadata extraction failed. Try again or continue to review manually.");
      goToStep(STEP_UPLOAD);
    } finally {
      window.clearInterval(tick);
    }
  }

  function handleSkipToReview() {
    setValidation(validateMetadataForm(seedMetadata));
    goToStep(STEP_REVIEW);
  }

  function handleContinueToConfirm() {
    const result = validateMetadataForm(extraction.activeFormValues);
    setValidation(result);
    if (!result.valid) return;
    goToStep(STEP_CONFIRM);
  }

  function handleSubmit() {
    const result = validateMetadataForm(extraction.activeFormValues);
    setValidation(result);
    if (!result.valid) {
      goToStep(STEP_REVIEW);
      return;
    }

    onSubmit({
      formValues: extraction.activeFormValues,
      uploads: extraction.uploads.map((u) => ({
        documentType: u.documentType,
        fileName: u.fileName,
        fileId: u.id,
      })),
    });
  }

  function handleStepperClick(step) {
    if (step === STEP_EXTRACT) return;
    if (step === STEP_CONFIRM) {
      const result = validateMetadataForm(extraction.activeFormValues);
      if (!result.valid) {
        setValidation(result);
        goToStep(STEP_REVIEW);
        return;
      }
    }
    setCurrentStep(step);
  }

  useEffect(() => {
    if (currentStep === STEP_REVIEW && extraction.uploads.length > 0) {
      setValidation(validateMetadataForm(extraction.activeFormValues));
    }
  }, [currentStep, extraction.activeFormValues, extraction.uploads.length]);

  return (
    <div className="flex flex-col gap-6">
      <ProjectWorkflowStepper
        currentStep={currentStep}
        maxReachableStep={maxReachableStep}
        onStepClick={handleStepperClick}
      />

      {currentStep === STEP_UPLOAD && (
        <>
          <Alert>
            <Sparkles className="size-4 shrink-0" aria-hidden />
            <AlertTitle>Step 1 — Document upload</AlertTitle>
            <AlertDescription>
              Upload contractual documents (NDA, PO, MSA, SOW / SWO). Select the document type for each file
              before extraction.
            </AlertDescription>
          </Alert>

          <ProjectDocumentUploadZone uploads={uploads} onUploadsChange={setUploads} />

          {validation.errors.length > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>Cannot continue</AlertTitle>
              <AlertDescription>{validation.errors[0]}</AlertDescription>
            </Alert>
          ) : null}

          {extractError ? (
            <Alert variant="destructive">
              <AlertTitle>Extraction failed</AlertTitle>
              <AlertDescription>{extractError}</AlertDescription>
            </Alert>
          ) : null}

          <WorkflowFooter
            left={
              <Button type="button" variant="ghost" onClick={onCancel}>
                <ArrowLeft data-icon="inline-start" />
                Cancel
              </Button>
            }
            right={
              <>
                {mode === "edit" ? (
                  <Button type="button" variant="outline" onClick={handleSkipToReview}>
                    Edit without upload
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={handleStartExtraction}
                  disabled={mode === "create" && uploads.length === 0}
                >
                  <Sparkles data-icon="inline-start" />
                  Extract metadata
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </>
            }
          />
        </>
      )}

      {currentStep === STEP_EXTRACT && (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-14">
            <Spinner className="text-primary" />
            <div className="flex max-w-lg flex-col gap-2 text-center">
              <p className="text-sm font-semibold text-foreground">Step 2 — Extracting metadata</p>
              <p className="text-sm text-muted-foreground">
                Parsing {uploads.length} document{uploads.length === 1 ? "" : "s"} across{" "}
                {EXTRACTION_SCHEMA_GROUPS.length} schema groups…
              </p>
            </div>
            <Progress value={extractionProgress} className="w-full max-w-md" />
            <ul className="grid w-full max-w-md grid-cols-1 gap-1 sm:grid-cols-2">
              {EXTRACTION_SCHEMA_GROUPS.map((group) => (
                <li key={group} className="text-xs text-muted-foreground">
                  · {group}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {currentStep === STEP_REVIEW && (
        <>
          <Alert>
            <AlertTitle>Step 3 — Review &amp; edit metadata</AlertTitle>
            <AlertDescription>
              Compare uploaded documents with extracted fields and edit any value before continuing. Check
              section 9 for overall extraction confidence; validation warnings above flag fields that need
              a closer look.
            </AlertDescription>
          </Alert>

          <ProjectDocumentReviewWorkspace
            {...extraction}
            uploads={extraction.uploads.length ? extraction.uploads : uploads}
            setUploads={(next) => {
              setUploads(next);
              extraction.setUploads(next);
            }}
          />

          <WorkflowFooter
            left={
              <Button type="button" variant="outline" onClick={() => goToStep(STEP_UPLOAD)}>
                <ArrowLeft data-icon="inline-start" />
                Back to upload
              </Button>
            }
            right={
              <Button type="button" onClick={handleContinueToConfirm}>
                Continue to confirm
                <ArrowRight data-icon="inline-end" />
              </Button>
            }
          />
        </>
      )}

      {currentStep === STEP_CONFIRM && (
        <>
          <ProjectWorkflowConfirmStep
            mode={mode}
            formValues={extraction.activeFormValues}
            uploads={extraction.uploads.length ? extraction.uploads : uploads}
            warnings={validation.warnings}
          />

          <WorkflowFooter
            left={
              <Button type="button" variant="outline" onClick={() => goToStep(STEP_REVIEW)}>
                <ArrowLeft data-icon="inline-start" />
                Back to review
              </Button>
            }
            right={
              <Button type="button" onClick={handleSubmit}>
                <Check data-icon="inline-start" />
                {mode === "create" ? "Create project" : "Save changes"}
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}

function WorkflowFooter({ left, right }) {
  return (
    <div className="flex flex-col gap-4">
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">{left}</div>
        <div className="flex flex-wrap items-center justify-end gap-2">{right}</div>
      </div>
    </div>
  );
}
