import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Pencil, Search } from "lucide-react";
import { CreateProjectDropdown } from "@/components/features/projects/CreateProjectDropdown";
import { formatProjectCode, filterProjects } from "@/data/projectsData";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LIST_PAGE_SHELL_CLASS, TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";
import { PROJECT_FLOW_ROUTES } from "@/data/projectWorkflowFlow";
import { useProjectsStore } from "@/store/projectsStore";

export default function ProjectsPage({ onNavigate }) {
  const projects = useProjectsStore((s) => s.projects);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => filterProjects(projects, search), [projects, search]);

  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="invoice-projects" onNavigate={onNavigate} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={LIST_PAGE_SHELL_CLASS}>
            <PageHeader
              title="Projects"
              description="Create projects with basic details, then upload contracts per project to extract and compare metadata."
            >
              <CreateProjectDropdown />
              <Button type="button" variant="outline" className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}>
                <Download data-icon="inline-start" />
                Export CSV
              </Button>
            </PageHeader>

            <InputGroup className="h-10 w-full">
              <InputGroupAddon align="inline-start">
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                aria-label="Search projects"
              />
            </InputGroup>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Project Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Billing Type</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[72px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No projects match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Link
                            to={PROJECT_FLOW_ROUTES.detail(project.id)}
                            className="font-medium text-primary hover:underline"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatProjectCode(project.code)}
                        </TableCell>
                        <TableCell>{project.customer}</TableCell>
                        <TableCell>{project.billingType}</TableCell>
                        <TableCell className="text-muted-foreground">{project.gst}</TableCell>
                        <TableCell>
                          <Badge
                            variant={project.status === "active" ? "default" : "secondary"}
                            className="font-medium capitalize"
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Edit ${project.name}`}
                            render={<Link to={PROJECT_FLOW_ROUTES.edit(project.id)} />}
                          >
                            <Pencil />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
