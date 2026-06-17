import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, GitBranch, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeSourceUsage } from "@/lib/sourceUsageModel";

const USAGE_TABS = [
  { id: "hubs", label: "Knowledge Hubs", icon: Layers },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "flows", label: "Flows", icon: GitBranch },
];

function StatusBadge({ status }) {
  const variant =
    status === "active" ? "default" : status === "error" ? "destructive" : "secondary";
  return (
    <Badge variant={variant} className="text-[10px] capitalize">
      {status}
    </Badge>
  );
}

function EmptyUsageState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40">
        <Icon className="size-5 text-muted-foreground/60" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onAction}>
          <Icon className="size-3.5" aria-hidden />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function SourceUsageTab({ usage }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("hubs");
  const { hubs, agents, flows } = normalizeSourceUsage(usage);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col gap-0">
      <div className="shrink-0 overflow-x-auto border-b border-border">
        <TabsList className="h-10 w-max min-w-full justify-start rounded-none bg-transparent p-0">
          {USAGE_TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="hubs" className="mt-0 min-h-0 flex-1 pt-4">
        {hubs.length === 0 ? (
          <EmptyUsageState
            icon={Layers}
            title="No Knowledge Hubs linked"
            description="This source is not linked to any hub yet."
            actionLabel="Browse Knowledge Hubs"
            onAction={() => navigate("/knowledge")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Knowledge Hub</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Linked assets</TableHead>
                  <TableHead>Last accessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hubs.map((hub) => (
                  <TableRow key={hub.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => navigate("/knowledge")}
                      >
                        {hub.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={hub.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{hub.linkedAssets}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{hub.lastAccessed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="agents" className="mt-0 min-h-0 flex-1 pt-4">
        {agents.length === 0 ? (
          <EmptyUsageState
            icon={Bot}
            title="No agents connected"
            description="No agents are using this source for retrieval or actions."
            actionLabel="Go to Agents"
            onAction={() => navigate("/agents")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last execution</TableHead>
                  <TableHead className="text-right">Queries</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => navigate("/agents")}
                      >
                        {agent.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{agent.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={agent.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{agent.lastExecution}</TableCell>
                    <TableCell className="text-right tabular-nums">{agent.queryVolume}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {agent.successRate != null ? `${agent.successRate}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{agent.utilization}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="flows" className="mt-0 min-h-0 flex-1 pt-4">
        {flows.length === 0 ? (
          <EmptyUsageState
            icon={GitBranch}
            title="No flows connected"
            description="No workflows reference this source yet."
            actionLabel="Go to Flows"
            onAction={() => navigate("/flows")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last execution</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => navigate("/flows")}
                      >
                        {flow.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{flow.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={flow.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{flow.lastExecution}</TableCell>
                    <TableCell className="text-right tabular-nums">{flow.runs.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {flow.successRate != null ? `${flow.successRate}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
