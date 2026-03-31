import { useState, useRef } from "react";
import {
  PanelLeft,
  Sparkles,
  Bot,
  BrainCog,
  Vault,
  Bell,
  ChevronRight,
  ChevronDown,
  X,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Plus,
  Search,
  Maximize2,
  BarChart2,
  Send,
  Trash2,
  ArrowRight,
  Check,
  Minus,
  MoreHorizontal,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { KnowledgeHubPicker, defaultHubs } from "@/components/KnowledgeHubPicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast, useToast } from "@/components/ui/Toast";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

// Figma asset URLs
const imgAzironLogo = "https://www.figma.com/api/mcp/asset/f4c83c9c-c4ed-4c76-880e-b0d714d34c1e";
const imgGroup25 = "https://www.figma.com/api/mcp/asset/c6b8dfc6-4089-4c60-92c8-39ceb3eaf6ac";
const imgAvatar = "https://www.figma.com/api/mcp/asset/3a51bb65-a7a4-4fe2-8268-cbcefea71344";
const imgAvatar1 = "https://www.figma.com/api/mcp/asset/0e023794-4aba-48b7-8bb0-7fe507f5fee3";
const imgAvatar2 = "https://www.figma.com/api/mcp/asset/67e8cd6e-1031-4b09-b6fd-9a8adc2abf16";
const imgImage1 = "https://www.figma.com/api/mcp/asset/f7a86c32-1bdc-4b8c-9195-62bef1b7633b";
const imgUserAvatar = "https://www.figma.com/api/mcp/asset/6a5664fe-b4d1-48b0-bc2f-f6023a197ef0";
const imgVector2 = "https://www.figma.com/api/mcp/asset/902a3e70-c4a8-4373-b96e-dd3410c5fca2";
const imgElements1 = "https://www.figma.com/api/mcp/asset/04bd626c-870b-43b3-b425-9c5a4d03a0a0";
const imgElements2 = "https://www.figma.com/api/mcp/asset/ff2b2176-1ed2-4a50-a2df-65dd00a693ff";
const imgElements3 = "https://www.figma.com/api/mcp/asset/96bb2d18-13c6-44b5-ae9b-04725bbc0d25";
const imgElements4 = "https://www.figma.com/api/mcp/asset/2d379d0e-0f4a-4761-950e-c3dbd96a7608";
const imgVector9 = "https://www.figma.com/api/mcp/asset/7fa0a244-bdd6-4675-ab9f-22c9b7ebffb2";
const imgElements = "https://www.figma.com/api/mcp/asset/4bafa2e7-d5fc-4018-b782-e5e648e805de";
const imgVector25 = "https://www.figma.com/api/mcp/asset/eacdae71-06ff-4672-92d1-b68629683d02";

// Sent file chips (simulated already-sent message)
const sentFileChips = [
  { id: "s1", name: "Policy-document", type: "PDF" },
  { id: "s2", name: "User-manual", type: "PDF" },
];

// Sidebar nav items
const navItems = [
  { icon: <Sparkles size={16} />, active: false },
  { icon: <Bot size={16} />, active: true },
  { icon: <img src={imgVector9} alt="" className="size-4 object-contain" />, active: false },
  { icon: <BrainCog size={16} />, active: false },
  { icon: <Vault size={16} />, active: false },
  { icon: <img src={imgElements} alt="" className="size-4 object-contain" />, active: false },
  { icon: <BarChart2 size={16} />, active: false },
];

const hubFiles = [
  { id: 1, name: "Policy-document.pdf", size: "2.2 MB", date: "23 Feb 2026" },
  { id: 2, name: "Risk-assessment.docx", size: "1.1 MB", date: "07 Jul 2026" },
  { id: 3, name: "User-manual.pdf", size: "2.5 MB", date: "14 Jul 2026" },
  { id: 4, name: "Project-timeline.xlsx", size: "890 KB", date: "10 May 2026" },
  { id: 5, name: "Meeting-minutes.docx", size: "650 KB", date: "21 May 2026" },
  { id: 6, name: "Budget-estimate.pdf", size: "1.2 MB", date: "05 Jun 2026" },
  { id: 7, name: "Technical-specifications.pdf", size: "1.9 MB", date: "11 Aug 2026" },
  { id: 8, name: "Launch-plan.docx", size: "1.4 MB", date: "18 Aug 2026" },
  { id: 9, name: "Integration-guide.xlsx", size: "800 KB", date: "21 Jul 2026" },
  { id: 10, name: "Feedback-collection.docx", size: "600 KB", date: "28 Jul 2026" },
];

function SparkLogo() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 14L9 8.5V19.5L0 14Z" fill="#2563EB" />
      <path d="M13 0L22 5.5V14.5L13 9V0Z" fill="#2563EB" />
      <path d="M13 15L22 9.5V20.5L13 15Z" fill="#60A5FA" />
    </svg>
  );
}

function AgentPlaceholder() {
  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[4px] size-12 flex items-center justify-center overflow-hidden relative flex-shrink-0">
      <Bot size={24} className="text-[#64748b]" />
    </div>
  );
}

function CreateKnowledgeHubModal({ onClose }) {
  const [checked, setChecked] = useState({});
  const [files, setFiles] = useState(hubFiles);

  const toggleAll = (e) => {
    if (e.target.checked) {
      const all = {};
      files.forEach((f) => (all[f.id] = true));
      setChecked(all);
    } else {
      setChecked({});
    }
  };

  const deleteFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-[12px] w-[640px] max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="border border-dashed border-[#6366f1] rounded-t-[12px] p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#0f172a] leading-6">Create Knowledge Hub</h2>
              <p className="text-sm text-[#6366f1] mt-1 leading-5">
                Store the files and knowledge your AI agents will use for answering questions, reasoning, and workflows.
              </p>
            </div>
            <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] ml-4 flex-shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="mx-6 mt-4 mb-4 border border-dashed border-[#6366f1] rounded-[8px] overflow-hidden flex-1 min-h-0">
          <div className="flex items-center px-4 py-3 border-b border-[#e2e8f0] bg-white">
            <input
              type="checkbox"
              onChange={toggleAll}
              checked={files.length > 0 && Object.keys(checked).length === files.length}
              className="mr-4 size-4 accent-[#6366f1] cursor-pointer"
            />
            <span className="flex-1 text-sm font-medium text-[#0f172a]">File Name</span>
            <span className="w-24 text-sm font-medium text-[#0f172a] text-center">File Size</span>
            <span className="w-32 text-sm font-medium text-[#0f172a] text-center">Created On</span>
            <span className="w-8" />
          </div>

          <div className="overflow-y-auto max-h-[340px]">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center px-4 py-3 border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc]"
              >
                <input
                  type="checkbox"
                  checked={!!checked[file.id]}
                  onChange={() => setChecked((prev) => ({ ...prev, [file.id]: !prev[file.id] }))}
                  className="mr-4 size-4 accent-[#6366f1] cursor-pointer"
                />
                <span className="flex-1 text-sm text-[#0f172a]">{file.name}</span>
                <span className="w-24 text-sm text-[#0f172a] text-center">{file.size}</span>
                <span className="w-32 text-sm text-[#0f172a] text-center">{file.date}</span>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="w-8 flex justify-center text-[#ef4444] hover:text-[#dc2626]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-dashed border-[#6366f1] rounded-b-[12px] mx-6 mb-6 px-4 py-3 flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-sm font-medium text-[#0f172a] hover:text-[#64748b]">
            Cancel
          </button>
          <button className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-5 py-2 rounded-[8px] transition-colors">
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Sent file chip with three-dot menu and hub picker
function SentFileChip({ chip, savedFiles, openMenu, setOpenMenu, hubPickerFor, setHubPickerFor, hubs, onHubsChange, onSave }) {
  const menuId = `file-${chip.id}`;
  const pickerId = `filepicker-${chip.id}`;
  const saved = savedFiles[chip.id];
  const isMenuOpen = openMenu === menuId;
  const isPickerOpen = hubPickerFor === pickerId;

  return (
    <div className="relative">
      <div className="group flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-[8px] px-3 py-2 min-w-[150px]">
        {/* File icon */}
        <div className="w-7 h-8 bg-[#f1f5f9] rounded-[3px] flex items-end justify-center pb-0.5 flex-shrink-0 relative">
          <div
            className="absolute top-0 right-0 w-2 h-2 bg-white"
            style={{ clipPath: "polygon(0 0,100% 100%,100% 0)" }}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2"
            style={{ background: "#e2e8f0", clipPath: "polygon(0 0,100% 100%,0 100%)" }}
          />
          <span className="text-xs font-bold text-[#64748b] leading-none">{chip.type}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#0f172a] truncate">{chip.name}</p>
          {saved && (
            <p className="text-xs text-[#16a34a] leading-none mt-0.5 truncate">
              Saved to {saved.hubName} · {saved.chunks} chunks
            </p>
          )}
        </div>

        {saved ? (
          <CheckCircle2 size={14} className="text-[#16a34a] flex-shrink-0" />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(isMenuOpen ? null : menuId);
              setHubPickerFor(null);
            }}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#64748b] hover:text-[#0f172a] p-0.5 rounded"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>

      {/* Chip context menu */}
      {isMenuOpen && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-[#e2e8f0] rounded-[8px] shadow-lg overflow-hidden w-[200px]">
          <button
            onClick={() => {
              setOpenMenu(null);
              setHubPickerFor(pickerId);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors text-left"
          >
            <BrainCog size={14} className="text-[#64748b] flex-shrink-0" />
            Save to Knowledge Hub
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
            <Download size={14} className="text-[#64748b]" />
            Download file
          </button>
        </div>
      )}

      {/* Hub picker for this chip */}
      {isPickerOpen && (
        <div className="absolute top-full mt-1 left-0 z-30">
          <KnowledgeHubPicker
            hubs={hubs}
            onHubsChange={onHubsChange}
            selectedHubId={null}
            onSelect={(hub) => onSave([chip.id], hub)}
            onClose={() => setHubPickerFor(null)}
          />
        </div>
      )}
    </div>
  );
}

export default function AgentPage({ agent, onNavigate

}) {

  // KB state
  const [hubs, setHubs] = useState(defaultHubs);
  const [selectedHub, setSelectedHub] = useState(null);
  const [saveToHub, setSaveToHub] = useState(true);
  const [hubPickerFor, setHubPickerFor] = useState(null); // null | 'bar' | 'bubble' | 'filepicker-s1' | etc.
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState([
    { id: 1, name: "Policy-document", type: "PDF" },
    { id: 2, name: "User-manual", type: "PDF" },
  ]);
  const [fileInclusion, setFileInclusion] = useState({}); // att.id -> false means excluded; default included

  // After-send state
  const [openMenu, setOpenMenu] = useState(null); // null | 'bubble' | 'file-s1' | etc.
  const [savedFiles, setSavedFiles] = useState({}); // chipId -> {hubName, chunks}

  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  // Helpers
  const isIncluded = (id) => fileInclusion[id] !== false;
  const includedCount = attachments.filter((a) => isIncluded(a.id)).length;

  const toggleInclusion = (id) => {
    setFileInclusion((prev) => ({ ...prev, [id]: !isIncluded(id) }));
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => {
      const ext = file.name.split(".").pop().toUpperCase();
      const isImage = file.type.startsWith("image/");
      return {
        id: Date.now() + Math.random(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: ext,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
      };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const saveChipsToHub = (chipIds, hub) => {
    const updates = {};
    chipIds.forEach((id) => {
      updates[id] = { hubName: hub.name, chunks: Math.floor(Math.random() * 18) + 5 };
    });
    setSavedFiles((prev) => ({ ...prev, ...updates }));
    setOpenMenu(null);
    setHubPickerFor(null);
    showToast(`${chipIds.length === 1 ? "File" : `${chipIds.length} files`} saved to ${hub.name}`);
  };

  const closeAll = () => {
    setOpenMenu(null);
    setHubPickerFor(null);
  };

  const unsavedSentChips = sentFileChips.filter((c) => !savedFiles[c.id]);

  return (
    <>
      {showCreateModal && <CreateKnowledgeHubModal onClose={() => setShowCreateModal(false)} />}

      {confirmDeleteMsg && (
        <ConfirmDialog
          title="Delete this message?"
          message="This message will be permanently removed from the conversation."
          confirmLabel="Delete"
          onConfirm={() => setConfirmDeleteMsg(false)}
          onCancel={() => setConfirmDeleteMsg(false)}
        />
      )}

      {confirmClose && (
        <ConfirmDialog
          title="Leave this chat?"
          message="Your conversation context will not be saved."
          confirmLabel="Leave"
          onConfirm={() => { setConfirmClose(false); onNavigate("agents"); }}
          onCancel={() => setConfirmClose(false)}
        />
      )}

      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
      ))}

      {/* Global overlay to close menus/pickers on outside click */}
      {(openMenu || hubPickerFor) && (
        <div className="fixed inset-0 z-20" onClick={closeAll} />
      )}

      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <Sidebar activePage="chat" onNavigate={onNavigate} />

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader onNavigate={onNavigate} />

          {/* Agent Panel */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Agent Panel Header */}
            <div className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-[#e2e8f0] px-4 dark:border-[#334155]">
              <AgentPlaceholder />
              <p className="flex-1 text-base font-medium leading-6 text-[#0f172a] dark:text-[#f8fafc]">
                {agent?.name ?? "Customer Appreciation"}
              </p>
              <div className="flex items-center pr-2">
                <Separator orientation="vertical" className="h-6" />
              </div>
              <button aria-label="Maximize" className="flex size-7 items-center justify-center rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]">
                <Maximize2 size={16} />
              </button>
              <button
                aria-label="Close chat"
                onClick={() => setConfirmClose(true)}
                className="flex size-7 items-center justify-center rounded-[6px] text-[#64748b] opacity-70 transition-opacity hover:bg-[#f1f5f9] hover:opacity-100 dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Content Body */}
            <div className="flex-1 min-h-0 flex flex-col py-4 gap-4">
              <div className="flex flex-col flex-1 min-h-0 w-full max-w-3xl mx-auto px-4">

                {/* Chat messages area */}
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
                  <div className="flex-1" />

                  {/* === User sent message bubble === */}
                  <div className="flex justify-end w-full flex-shrink-0">
                    <div className="max-w-[80%] flex flex-col items-end gap-2">

                      {/* File chips */}
                      <div className="flex flex-wrap gap-2 justify-end">
                        {sentFileChips.map((chip) => (
                          <SentFileChip
                            key={chip.id}
                            chip={chip}
                            savedFiles={savedFiles}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            hubPickerFor={hubPickerFor}
                            setHubPickerFor={setHubPickerFor}
                            hubs={hubs}
                            onHubsChange={setHubs}
                            onSave={saveChipsToHub}
                          />
                        ))}
                      </div>

                      {/* Bubble + three-dot */}
                      <div className="relative group">
                        <div className="rounded-[12px] rounded-tr-[4px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 pr-8 dark:border-[#2d4b77] dark:bg-[#15233f]">
                          <p className="text-sm leading-5 text-[#0f172a] dark:text-[#e5eefc]">
                            Tell me about the Chennai water crisis and policy recommendations.
                          </p>
                        </div>

                        {/* Three-dot button on bubble */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === "bubble" ? null : "bubble");
                            setHubPickerFor(null);
                          }}
                          className="absolute top-2 right-2 rounded p-0.5 text-[#64748b] opacity-0 transition-opacity hover:text-[#0f172a] group-hover:opacity-100 dark:text-[#94a3b8] dark:hover:text-[#f8fafc]"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      {/* Bubble context menu */}
                      {openMenu === "bubble" && (
                        <div className="relative z-30 w-[230px] overflow-hidden rounded-[8px] border border-[#e2e8f0] bg-white shadow-lg dark:border-[#334155] dark:bg-[#1e293b]">
                          {unsavedSentChips.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                setHubPickerFor("bubble");
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] transition-colors hover:bg-[#f8fafc] dark:text-[#f8fafc] dark:hover:bg-[#0f172a]"
                            >
                            <Vault size={14} className="text-[#64748b] dark:text-[#94a3b8]" />
                              Save all to Knowledge Hub ({unsavedSentChips.length}{" "}
                              {unsavedSentChips.length === 1 ? "file" : "files"})
                            </button>
                          )}
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] transition-colors hover:bg-[#f8fafc] dark:text-[#f8fafc] dark:hover:bg-[#0f172a]">
                            <Copy size={14} className="text-[#64748b] dark:text-[#94a3b8]" />
                            Copy
                          </button>
                          <button
                            onClick={() => { setOpenMenu(null); setConfirmDeleteMsg(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                          >
                            <Trash2 size={14} className="text-[#ef4444]" />
                            Delete
                          </button>
                        </div>
                      )}

                      {/* Hub picker for "save all" from bubble */}
                      {hubPickerFor === "bubble" && (
                        <div className="z-30 relative">
                          <KnowledgeHubPicker
                            hubs={hubs}
                            onHubsChange={setHubs}
                            selectedHubId={null}
                            onSelect={(hub) =>
                              saveChipsToHub(
                                unsavedSentChips.map((c) => c.id),
                                hub
                              )
                            }
                            onClose={() => setHubPickerFor(null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reasoning header */}
                  <div className="flex flex-col items-start w-full flex-shrink-0">
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                      <img src={imgElements1} alt="" className="size-4 object-contain" />
                      <span className="text-xs tracking-[0.12px] leading-4 text-[#0f172a] dark:text-[#f8fafc]">Reasoning</span>
                      <ChevronRight size={16} className="text-[#64748b] dark:text-[#94a3b8]" />
                    </button>
                  </div>

                  {/* Short response message */}
                  <div className="flex flex-col items-start w-full flex-shrink-0">
                    <div className="flex items-center p-[10px] rounded-lg w-full">
                      <p className="text-base leading-6 text-[#4e4d4d] dark:text-[#d1d5db]">
                        Right now in Chennai it's clear and pleasant, around 24°C 🌙
                        <br />
                        For today, expect hazy sunshine with a high near 31°C and a low around 19°C.
                      </p>
                    </div>
                  </div>

                  {/* Long response message */}
                  <div className="flex flex-col items-start w-full flex-shrink-0">
                    <div className="flex items-start justify-center p-[10px] rounded-lg w-full">
                      <div className="flex-1 space-y-4 text-base leading-6 text-[#4e4d4d] dark:text-[#d1d5db]">
                        <p>
                          The coastal city of Chennai has a metropolitan population of 10.6 million as per 2019 census.
                          As the city lacks a perennial water source, catering the water requirements of the population
                          has remained an arduous task. On 18 June 2019, the city's reservoirs ran dry, leaving the city
                          in severe crisis.[1][2]
                        </p>
                        <p>
                          Although three rivers flow through the metropolitan region and drain into the Bay of Bengal,
                          Chennai has historically relied on annual monsoon rains to replenish its water reservoirs since
                          the rivers are polluted with sewage. With the population increasing over the decades, the city
                          has faced water supply shortages, and its ground water levels have been depleted. An earlier
                          Veeranam Lake project aimed at augmenting the city's water supply failed. However, the New
                          Veeranam project, which became operational in September 2004, has greatly reduced dependency on
                          distant sources. In recent years, heavy and consistent monsoon rains and rainwater harvesting
                          (RWH) by Chennai Metro Water at its Anna Nagar Rain Centre have significantly reduced water
                          shortages. Moreover, newer projects like the Telugu Ganga project, which brings water from
                          rivers such as the Krishna River in Andhra Pradesh, have eased water shortages.
                        </p>
                        <p>
                          The expanded Chennai Metropolitan Area (CMA) has nearly 4,100 water bodies, with a potential
                          storage capacity of 150,000 million cubic feet.[4]
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Generating Response indicator */}
                  <div className="flex flex-col items-start w-full flex-shrink-0">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                      <SparkLogo />
                      <span className="whitespace-nowrap text-xs tracking-[0.12px] leading-4 text-[#0f172a] dark:text-[#f8fafc]">
                        Generating Response...
                      </span>
                    </div>
                  </div>

                  {/* Source badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {[
                      { src: imgAvatar, label: "Source 1" },
                      { src: imgAvatar1, label: "Source 2" },
                      { src: imgAvatar2, label: "Source 3" },
                    ].map((source) => (
                      <div
                        key={source.label}
                        className="flex items-center gap-1 overflow-hidden rounded-[6px] border border-[#e2e8f0] px-2 py-0.5 dark:border-[#334155]"
                      >
                        <Avatar className="size-3 rounded-full">
                          <AvatarImage src={source.src} className="object-cover" />
                          <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                        <span className="whitespace-nowrap text-xs font-medium leading-4 text-[#0f172a] dark:text-[#f8fafc]">
                          {source.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action button group */}
                  <div className="flex items-center flex-shrink-0">
                    {[
                      { icon: <Copy size={16} />, label: "Copy response" },
                      { icon: <ThumbsUp size={16} />, label: "Thumbs up" },
                      { icon: <ThumbsDown size={16} />, label: "Thumbs down" },
                      { icon: <RotateCcw size={16} />, label: "Regenerate response" },
                      { icon: <Plus size={16} />, label: "Add to note" },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        aria-label={btn.label}
                        title={btn.label}
                        className="flex size-8 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Box */}
                <div className="w-full flex-shrink-0 rounded-[12px] bg-[#f8fafc] shadow-[8px_6px_130px_0px_rgba(37,99,235,0.16)] dark:bg-[#111827] dark:shadow-none">
                  <div className="flex min-h-[100px] flex-col rounded-t-[12px] border border-[#e2e8f0] dark:border-[#334155]">

                    {/* Attachments row */}
                    {attachments.length > 0 && (
                      <div className="flex items-center p-4 gap-2.5">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="group relative flex h-[108px] w-[84px] flex-shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-[8px] border border-[#e2e8f0] bg-white dark:border-[#334155] dark:bg-[#0f172a]"
                          >
                            {att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="relative flex h-12 w-10 items-end justify-center rounded-[4px] bg-[#f1f5f9] pb-1 dark:bg-[#1e293b]">
                                  <div
                                    className="absolute top-0 right-0 h-3 w-3 bg-white dark:bg-[#0f172a]"
                                    style={{ clipPath: "polygon(0 0,100% 100%,100% 0)" }}
                                  />
                                  <div
                                    className="absolute top-0 right-0 w-3 h-3"
                                    style={{ background: "#e2e8f0", clipPath: "polygon(0 0,100% 100%,0 100%)" }}
                                  />
                                  <span className="text-xs font-bold leading-none text-[#64748b] dark:text-[#94a3b8]">{att.type}</span>
                                </div>
                                <span className="w-full truncate px-1 text-center text-xs leading-none text-[#64748b] dark:text-[#94a3b8]">
                                  {att.name}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[8px]" />

                            {/* Close button */}
                            <button
                              onClick={() => removeAttachment(att.id)}
                              aria-label={`Remove ${att.name}`}
                              className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-[4px] border border-[#e2e8f0] bg-white p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:border-[#334155] dark:bg-[#0f172a]"
                            >
                              <X size={12} className="text-[#64748b] dark:text-[#94a3b8]" />
                            </button>

                            {/* Inclusion toggle — shown when save to hub is on */}
                            {saveToHub && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleInclusion(att.id);
                                }}
                                className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center size-5 rounded-full border-2 transition-colors shadow-sm ${
                                  isIncluded(att.id)
                                    ? "bg-[#16a34a] border-[#16a34a] text-white"
                                    : "bg-white border-[#94a3b8] text-[#94a3b8]"
                                }`}
                                title={isIncluded(att.id) ? "Included — click to exclude" : "Excluded — click to include"}
                              >
                                {isIncluded(att.id) ? <Check size={10} /> : <Minus size={10} />}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Save to Knowledge Hub row */}
                    <div className="relative flex flex-col border-t border-[#e2e8f0] dark:border-[#334155]">
                      <div className="flex items-center justify-between px-2 py-2">
                        {/* Left: toggle + label + status */}
                        <button className="flex items-center gap-3 py-2 cursor-pointer">
                          <Switch
                            checked={saveToHub}
                            onCheckedChange={setSaveToHub}
                            className="data-[state=checked]:bg-[#2563eb]"
                          />
                          <div className="flex flex-col items-start">
                            <span className="whitespace-nowrap text-sm font-medium leading-none text-[#0f172a] dark:text-[#f8fafc]">
                              Save to Knowledge Hub
                            </span>
                            {saveToHub && attachments.length > 0 && (
                              <span className="mt-0.5 text-xs leading-none text-[#64748b] dark:text-[#94a3b8]">
                                {includedCount} of {attachments.length}{" "}
                                {attachments.length === 1 ? "file" : "files"} will be saved
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Right: hub selector — only shown when toggle is on */}
                        {saveToHub && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setHubPickerFor(hubPickerFor === "bar" ? null : "bar");
                                setOpenMenu(null);
                              }}
                              className="flex w-[240px] items-center gap-2 rounded-[6px] border border-[#cbd5e1] bg-white px-3 py-2 dark:border-[#334155] dark:bg-[#1e293b]"
                            >
                              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm leading-5 text-[#64748b] dark:text-[#94a3b8]">
                                {selectedHub ? selectedHub.name : "Select Knowledge hub"}
                              </span>
                              <ChevronDown size={16} className="flex-shrink-0 text-[#64748b] dark:text-[#94a3b8]" />
                            </button>

                            {/* KnowledgeHubPicker for bar */}
                            {hubPickerFor === "bar" && (
                              <div className="absolute bottom-[42px] left-0 z-30">
                                <KnowledgeHubPicker
                                  hubs={hubs}
                                  onHubsChange={setHubs}
                                  selectedHubId={selectedHub?.id}
                                  onSelect={(hub) => {
                                    setSelectedHub(hub);
                                    setHubPickerFor(null);
                                  }}
                                  onClose={() => setHubPickerFor(null)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Text input row */}
                    <div className="flex w-full items-center gap-2 border-t border-[#e2e8f0] p-4 dark:border-[#334155]">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
                        title="Accepted: PDF, Word, Excel, images"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file (PDF, Word, Excel, images)"
                        title="Attach file (PDF, Word, Excel, images)"
                        className="flex size-10 flex-shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
                      >
                        <img src={imgVector25} alt="" className="size-4 object-contain" />
                      </button>
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && message.trim()) { setMessage(""); } }}
                        placeholder="Ask anything, or describe your task…"
                        aria-label="Message input"
                        className="min-w-0 flex-1 bg-transparent text-base leading-6 text-[#0f172a] placeholder:text-[#64748b] outline-none dark:text-[#f8fafc] dark:placeholder:text-[#94a3b8]"
                      />
                      <button
                        disabled={!message.trim()}
                        aria-label="Send message"
                        className={`flex items-center justify-center size-10 rounded-full border flex-shrink-0 transition-colors ${
                          message.trim()
                            ? "bg-[#2563eb] border-[#2563eb] text-white hover:bg-[#1d4ed8]"
                            : "bg-white border-[#cbd5e1] text-[#cbd5e1] cursor-not-allowed dark:bg-[#1e293b] dark:border-[#334155] dark:text-[#64748b]"
                        }`}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Control panel */}
                  <div className="flex h-9 items-center justify-between rounded-b-[12px] border-b border-l border-r border-[#e2e8f0] px-4 dark:border-[#334155]">
                    <div className="flex items-center gap-1">
                      <button aria-label="Tools" title="Tools" className="flex h-9 items-center gap-1 rounded-[6px] px-3 py-2 transition-colors hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]">
                        <img src={imgElements2} alt="" className="size-4 object-contain" />
                        <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Tools</span>
                      </button>
                      <div className="flex items-center justify-center h-4 w-0 mx-0">
                        <div className="h-px w-4 rotate-90 bg-[#e2e8f0] dark:bg-[#334155]" />
                      </div>
                      <button aria-label="Knowledge Hub" title="Knowledge Hub" className="flex items-center gap-1 rounded-[6px] px-3 py-2 transition-colors hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]">
                        <img src={imgElements3} alt="" className="size-4 object-contain" />
                        <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Knowledge Hub</span>
                      </button>
                      <div className="flex items-center justify-center h-4 w-0 mx-0">
                        <div className="h-px w-4 rotate-90 bg-[#e2e8f0] dark:bg-[#334155]" />
                      </div>
                      <div className="flex items-center gap-2" title="Context window usage">
                        <img src={imgGroup25} alt="" className="size-[15px] object-contain" />
                        <span className="text-xs leading-4 text-[#64748b] dark:text-[#94a3b8]">65% used</span>
                      </div>
                    </div>
                    <div>
                      <button aria-label="Select AI model" title="Select AI model" className="flex items-center gap-2 rounded-[6px] px-3 py-2 transition-colors hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]">
                        <img src={imgElements4} alt="" className="size-4 object-contain" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
