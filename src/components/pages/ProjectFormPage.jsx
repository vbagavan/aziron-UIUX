import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  ProjectHeaderBreadcrumb,
  projectCreateManualBreadcrumbs,
  projectEditBreadcrumbs,
} from "@/components/features/projects/ProjectHeaderBreadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { ProjectQuickForm } from "@/components/features/projects/ProjectQuickForm";
import { ProjectMetadataEditForm } from "@/components/features/projects/ProjectMetadataEditForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PROJECT_FLOW_ROUTES } from "@/data/projectWorkflowFlow";
import { LIST_PAGE_SHELL_CLASS } from "@/lib/listToolbar";
import { useAuth } from "@/context/AuthContext";
import { useProjectsStore } from "@/store/projectsStore";

export default function ProjectFormPage({ onNavigate, mode: modeProp }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();
  const fromCreate = Boolean(location.state?.fromCreate);

  const mode = modeProp ?? (projectId ? "manual-edit" : "manual-create");

  const existingProject = useProjectsStore((s) =>
    mode === "manual-edit" ? s.getProjectById(projectId) : null,
  );
  const createProjectManual = useProjectsStore((s) => s.createProjectManual);
  const updateProjectManual = useProjectsStore((s) => s.updateProjectManual);

  const userName = auth.user?.name ?? "Admin";

  if (mode === "manual-edit" && !existingProject) {
    return <Navigate to={PROJECT_FLOW_ROUTES.list} replace />;
  }

  function handleManualCreateSubmit(formValues) {
    const created = createProjectManual({ formValues, userName });
    if (!created?.id) return;
    navigate(PROJECT_FLOW_ROUTES.edit(created.id), {
      state: { fromCreate: true, createMode: "manual" },
      replace: true,
    });
  }

  function handleManualEditSubmit(formValues) {
    const updated = updateProjectManual({ projectId, formValues, userName });
    if (!updated) return;
    toast.success(`Project details saved for ${existingProject?.name ?? "project"}.`);
    navigate(`${PROJECT_FLOW_ROUTES.detail(projectId)}?tab=metadata`, { replace: true });
  }

  const pageTitle =
    mode === "manual-create" ? "Create project" : `Edit — ${existingProject?.name}`;

  const pageDescription =
    mode === "manual-create"
      ? "Enter basic project information to create the project. After creation you can upload contracts on the project page to extract and compare metadata."
      : "Review and update all nine project detail sections. Upload documents from the project page to extract fields with AI.";

  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="invoice-projects" onNavigate={onNavigate} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <ProjectHeaderBreadcrumb
            segments={
              mode === "manual-create"
                ? projectCreateManualBreadcrumbs()
                : projectEditBreadcrumbs(existingProject?.name, projectId)
            }
          />
        </AppHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={LIST_PAGE_SHELL_CLASS}>
            <PageHeader title={pageTitle} description={pageDescription} />

            {mode === "manual-create" && (
              <ProjectQuickForm
                onSubmit={handleManualCreateSubmit}
                onCancel={() => navigate(PROJECT_FLOW_ROUTES.list)}
              />
            )}

            {mode === "manual-edit" && fromCreate && (
              <Alert>
                <AlertTitle>Project created</AlertTitle>
                <AlertDescription>
                  Complete the remaining project detail sections below, then save. Use{" "}
                  <span className="font-medium text-foreground">Upload document</span> on the project
                  page to add contracts and compare AI-extracted fields side by side with the current
                  record.
                </AlertDescription>
              </Alert>
            )}

            {mode === "manual-edit" && (
              <ProjectMetadataEditForm
                project={existingProject}
                submitLabel="Save changes"
                onSubmit={handleManualEditSubmit}
                onCancel={() => navigate(PROJECT_FLOW_ROUTES.detail(projectId))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
