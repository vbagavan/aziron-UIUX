import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  ProjectHeaderBreadcrumb,
  projectUploadDocumentBreadcrumbs,
} from "@/components/features/projects/ProjectHeaderBreadcrumb";
import { ProjectDocumentReviewWorkspace } from "@/components/features/projects/ProjectDocumentReviewWorkspace";
import { UploadDiscardDialog } from "@/components/features/projects/UploadDiscardDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePerDocumentExtraction } from "@/hooks/usePerDocumentExtraction";
import { acceptedChangesFromFormValues } from "@/lib/projectMetadataExtraction";
import { getProjectDocumentTypeLabel } from "@/data/projectDocuments";
import { projectToMetadataValues } from "@/data/projectMetadataSchema";
import { validateMetadataForm } from "@/data/projectDocuments";
import { PROJECT_FLOW_ROUTES } from "@/data/projectWorkflowFlow";
import { LIST_PAGE_SHELL_CLASS } from "@/lib/listToolbar";
import { useAuth } from "@/context/AuthContext";
import { useProjectsStore } from "@/store/projectsStore";

export default function ProjectDocumentUploadPage({ onNavigate }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const userName = auth.user?.name ?? "Admin";

  const project = useProjectsStore((s) => s.getProjectById(projectId));
  const applyDocumentDelta = useProjectsStore((s) => s.applyDocumentDelta);

  const baseMetadata = useMemo(
    () => (project ? projectToMetadataValues(project) : {}),
    [project],
  );

  const extraction = usePerDocumentExtraction(baseMetadata);
  const [saveError, setSaveError] = useState(null);
  const [savedDocIds, setSavedDocIds] = useState(() => new Set());
  const [discardOpen, setDiscardOpen] = useState(false);

  const { activeUpload, uploads, activeStatus, anyExtracting } = extraction;

  const pendingUploadCount = useMemo(
    () => uploads.filter((u) => !savedDocIds.has(u.id)).length,
    [uploads, savedDocIds],
  );

  const canSave =
    uploads.length > 0 && activeStatus === "done" && !anyExtracting && activeUpload;

  const saveDisabledReason = useMemo(() => {
    if (!uploads.length) return "Upload a document before you can save.";
    if (anyExtracting || activeStatus === "loading") {
      return "Wait for extraction to finish for the selected document.";
    }
    if (activeStatus === "error") {
      return "Extraction failed — retry before saving.";
    }
    if (activeStatus !== "done") return "Extraction has not finished yet.";
    return null;
  }, [uploads.length, anyExtracting, activeStatus]);

  if (!project) {
    return <Navigate to={PROJECT_FLOW_ROUTES.list} replace />;
  }

  function leaveUploadPage() {
    navigate(PROJECT_FLOW_ROUTES.detail(project.id));
  }

  function handleCancelClick() {
    if (pendingUploadCount > 0) {
      setDiscardOpen(true);
      return;
    }
    leaveUploadPage();
  }

  function handleSaveDocument() {
    setSaveError(null);
    const { activeFormValues, uploads: currentUploads } = extraction;

    if (!currentUploads.length || !activeUpload) {
      setSaveError("Upload at least one document before saving.");
      return;
    }
    if (activeStatus !== "done") {
      setSaveError("Wait for extraction to finish for the selected document.");
      return;
    }

    const reviewKeys =
      extraction.perDoc[activeUpload.id]?.reviewFieldKeys ?? extraction.activeReviewFieldKeys;

    const validation = validateMetadataForm(activeFormValues, {
      fieldKeys: reviewKeys.length ? reviewKeys : undefined,
    });
    if (!validation.valid) {
      setSaveError("Fix validation errors in the form before saving.");
      return;
    }

    const currentMeta = projectToMetadataValues(
      useProjectsStore.getState().getProjectById(project.id),
    );
    const acceptedChanges = acceptedChangesFromFormValues(currentMeta, activeFormValues, {
      fieldKeys: reviewKeys,
    });
    applyDocumentDelta({
      projectId: project.id,
      acceptedChanges,
      documentRef: {
        type: activeUpload.documentType,
        fileName: activeUpload.fileName,
        fileId: activeUpload.id,
      },
      userName,
    });

    const docLabel = getProjectDocumentTypeLabel(activeUpload.documentType);
    const changeCount = acceptedChanges.length;
    if (changeCount > 0) {
      toast.success(
        `${docLabel} saved — ${changeCount} field${changeCount !== 1 ? "s" : ""} updated on ${project.name}.`,
      );
    } else {
      toast.success(`${docLabel} saved — no project fields changed.`);
    }

    const nextSaved = new Set(savedDocIds);
    nextSaved.add(activeUpload.id);
    setSavedDocIds(nextSaved);

    const remaining = currentUploads.filter((u) => !nextSaved.has(u.id));
    if (remaining.length === 0) {
      toast.success("All documents saved to this project.");
      navigate(PROJECT_FLOW_ROUTES.detail(project.id), { replace: true });
      return;
    }

    const idx = currentUploads.findIndex((u) => u.id === remaining[0].id);
    if (idx >= 0) extraction.setActiveIndex(idx);
  }

  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="invoice-projects" onNavigate={onNavigate} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <ProjectHeaderBreadcrumb
            segments={projectUploadDocumentBreadcrumbs(project.name, project.id)}
          />
        </AppHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={`${LIST_PAGE_SHELL_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden`}>
            <PageHeader
              title="Upload document"
              description={`Add documents to ${project.name}. Select a document type, upload each file, then review the preview alongside extracted fields before saving.`}
            />

            {saveError ? (
              <Alert variant="destructive" className="shrink-0">
                <AlertTitle>Cannot save</AlertTitle>
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            ) : null}

            <ProjectDocumentReviewWorkspace
              {...extraction}
              compareWithValues={baseMetadata}
              rightHeaderExtra={
                uploads.length > 1 ? (
                  <span className="text-xs text-muted-foreground">
                    {extraction.activeIndex + 1} / {uploads.length}
                  </span>
                ) : null
              }
              footer={
                <div className="flex flex-col gap-2">
                  {!canSave && saveDisabledReason ? (
                    <p className="text-xs text-muted-foreground">{saveDisabledReason}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button type="button" variant="ghost" onClick={handleCancelClick}>
                      Cancel
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                      {uploads.length > 1 && savedDocIds.size > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {savedDocIds.size} of {uploads.length} saved
                        </span>
                      ) : null}
                      <Button
                        type="button"
                        disabled={!canSave}
                        title={saveDisabledReason ?? undefined}
                        onClick={handleSaveDocument}
                      >
                        <Check data-icon="inline-start" />
                        Save document
                        {uploads.length > 1 ? " & continue" : ""}
                      </Button>
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>

      <UploadDiscardDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        pendingCount={pendingUploadCount}
        onConfirmLeave={leaveUploadPage}
      />
    </div>
  );
}
