import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROJECT_FLOW_ROUTES } from "@/data/projectWorkflowFlow";
import { cn } from "@/lib/utils";
import { TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";

/** Creates a project via manual entry only. Document upload is available on the project detail page. */
export function CreateProjectDropdown({ className }) {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3", className)}
      onClick={() => navigate(PROJECT_FLOW_ROUTES.createManual)}
    >
      <Plus data-icon="inline-start" />
      Add Project
    </Button>
  );
}
