import { useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import PulseDashboard from "@/components/features/pulse/PulseDashboard";
import PulseCreateFlow from "@/components/features/pulse/PulseCreateFlow";

export default function PulsePage({ onNavigate }) {
  const [view, setView] = useState("dashboard"); // "dashboard" or "create"
  const [artifacts, setArtifacts] = useState([
    {
      id: 1,
      title: "E-commerce Product Grid",
      prompt: "Create a modern e-commerce product grid with filters, sort options, and add to cart buttons",
      html: "",
      thumbnail: null,
      lastEdited: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: 2,
      title: "Analytics Dashboard",
      prompt: "Create a comprehensive analytics dashboard with line charts, bar charts, and KPI cards",
      html: "",
      thumbnail: null,
      lastEdited: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  ]);
  const [editingId, setEditingId] = useState(null);

  const handleCreateNew = () => {
    setEditingId(null);
    setView("create");
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setView("create");
  };

  const handleDuplicate = (id) => {
    const original = artifacts.find(a => a.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: Math.max(...artifacts.map(a => a.id)) + 1,
      title: `${original.title} (Copy)`,
      lastEdited: new Date(),
    };

    setArtifacts([...artifacts, duplicate]);
  };

  const handleDelete = (id) => {
    setArtifacts(artifacts.filter(a => a.id !== id));
  };

  const handleSave = (data) => {
    if (editingId) {
      // Update existing
      setArtifacts(artifacts.map(a =>
        a.id === editingId
          ? { ...a, ...data, lastEdited: new Date() }
          : a
      ));
    } else {
      // Create new
      const newArtifact = {
        id: Math.max(...artifacts.map(a => a.id), 0) + 1,
        ...data,
        lastEdited: new Date(),
        thumbnail: null,
      };
      setArtifacts([newArtifact, ...artifacts]);
    }
    setView("dashboard");
  };

  const handleBack = () => {
    setView("dashboard");
    setEditingId(null);
  };

  const currentArtifact = editingId ? artifacts.find(a => a.id === editingId) : null;

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="pulse" onNavigate={onNavigate} />

      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        {view === "dashboard" && (
          <AppHeader onNavigate={onNavigate}>
            <div className="ml-1 flex items-center gap-2">
              <div className="h-6 w-px bg-[#e2e8f0] dark:bg-[#334155]" />
              <span className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">Pulse</span>
            </div>
          </AppHeader>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          {view === "dashboard" ? (
            <PulseDashboard
              artifacts={artifacts}
              onCreateNew={handleCreateNew}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ) : (
            <PulseCreateFlow
              key={editingId ?? "new"}
              onBack={handleBack}
              onSave={handleSave}
              initialPrompt={currentArtifact?.prompt || ""}
              initialHTML={currentArtifact?.html || ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}
