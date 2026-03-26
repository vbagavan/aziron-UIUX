import { useState } from "react";
import {
  UserCircle,
  SwatchBook,
  KeyRound,
  Bell,
  LayoutGrid,
  HelpCircle,
  ChevronRight,
  Check,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";

const imgThemeBlueActive = "https://www.figma.com/api/mcp/asset/b286a75a-1bfc-4079-a8c0-cc107db1c040";
const imgThemeGreen    = "https://www.figma.com/api/mcp/asset/7970b3d4-28e9-4404-b71c-c61ad17dc708";
const imgThemeOrange   = "https://www.figma.com/api/mcp/asset/e26076c8-e8a3-4882-8f83-3912232e487b";
const imgThemePurple   = "https://www.figma.com/api/mcp/asset/9cfb15c9-c14a-4f58-9eaf-67c7c9312b1a";

const settingsNav = [
  { icon: UserCircle, label: "Account",       id: "account",       page: "settings" },
  { icon: SwatchBook, label: "Appearance",     id: "appearance",    page: "settings",       active: true },
  { icon: KeyRound,   label: "API Keys",       id: "api-keys",      page: "settings" },
  { icon: Bell,       label: "Notifications",  id: "notifications", page: "notifications" },
  { icon: LayoutGrid, label: "Integrations",   id: "integrations",  page: "settings" },
  { icon: HelpCircle, label: "Support",        id: "support",       page: "settings" },
];

const themeColors = [
  { id: "blue",   label: "Blue theme",   img: imgThemeBlueActive },
  { id: "green",  label: "Green theme",  img: imgThemeGreen },
  { id: "orange", label: "Orange theme", img: imgThemeOrange },
  { id: "purple", label: "Purple theme", img: imgThemePurple },
];

function LightPreview() {
  return (
    <div className="w-full flex-1 min-h-0 bg-[#f8fafc] rounded-[6px] border-2 border-[#8b949e] flex items-center justify-center p-2">
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[#e5e7eb] rounded-full w-3/4" />
        <div className="h-2 bg-[#e5e7eb] rounded-full w-1/2" />
      </div>
    </div>
  );
}

function DarkPreview({ selected }) {
  return (
    <div
      className={`w-full flex-1 min-h-0 bg-[#0d1117] rounded-[6px] border-2 flex items-center justify-center p-2 relative ${
        selected ? "border-[#0f172a]" : "border-[#8b949e]"
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2 size-4 rounded-full bg-[#0f172a] flex items-center justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[#1e2939] rounded-full w-3/4" />
        <div className="h-2 bg-[#1e2939] rounded-full w-1/2" />
      </div>
    </div>
  );
}

function SystemPreview() {
  return (
    <div className="w-full flex-1 min-h-0 rounded-[6px] border-2 border-[#8b949e] overflow-hidden flex items-center justify-center p-2"
      style={{ background: "linear-gradient(135deg, #f0f6fc 0%, #0d1117 100%)" }}
    >
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[rgba(153,161,175,0.5)] rounded-full w-3/4" />
        <div className="h-2 bg-[rgba(153,161,175,0.5)] rounded-full w-1/2" />
      </div>
    </div>
  );
}

export default function SettingsAppearancePage({
  onNavigate,
  sidebarCollapsed,
  onToggleSidebar,
}) {

  const [themeColor, setThemeColor] = useState("blue");
  const [themeMode, setThemeMode] = useState("dark");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        activePage="settings"
        onNavigate={onNavigate}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <AppHeader onToggleSidebar={onToggleSidebar} onNavigate={onNavigate}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]" />
            <nav className="flex items-center gap-[10px]">
              <span className="text-sm text-[#64748b] dark:text-[#94a3b8] whitespace-nowrap">Settings</span>
              <ChevronRight size={14} className="text-[#94a3b8] dark:text-[#64748b]" />
              <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] whitespace-nowrap">Appearance</span>
            </nav>
          </div>
        </AppHeader>

        {/* Page body */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-6 py-4 gap-4">
          {/* Page heading */}
          <div className="flex flex-col gap-0">
            <h1 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f1f5f9] tracking-[-0.6px] leading-8">
              Settings
            </h1>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-5">Manage your preferences</p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-1 gap-4 items-start min-h-0">
            {/* Left settings nav */}
            <div className="flex flex-col gap-1 w-[216px] flex-shrink-0">
              {settingsNav.map(({ icon: Icon, label, id, active, page }) => (
                <button
                  key={id}
                  onClick={() => page && onNavigate?.(page)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 px-2 h-8 rounded-[6px] text-sm w-full text-left transition-colors ${
                    active
                      ? "bg-[#d3d3d3]/60 text-[#363636] font-medium"
                      : "text-[#363636] hover:bg-[#d3d3d3]/40"
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Right content card */}
            <div className="flex-1 min-w-0 bg-card border-2 border-border rounded-xl shadow-2xs p-6 flex flex-col gap-8">
              {/* Card header */}
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-7">Appearance</h2>
                <p className="text-base text-[#4e4d4d] leading-6">
                  Manage your appearance settings and preferences.
                </p>
              </div>

              {/* Theme Color */}
              <div className="flex flex-col gap-4">
                <p className="text-base font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-6">Theme Color</p>
                <div className="flex items-center gap-4">
                  {themeColors.map(({ id, label, img }) => (
                    <button
                      key={id}
                      onClick={() => setThemeColor(id)}
                      aria-label={label}
                      aria-pressed={themeColor === id}
                      title={label}
                      className={`relative size-8 rounded-full overflow-hidden flex-shrink-0 transition-all ${
                        themeColor === id
                          ? "ring-2 ring-offset-2 ring-[#2563eb]"
                          : "hover:scale-110"
                      }`}
                    >
                      <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Mode */}
              <div className="flex flex-col gap-4">
                <p className="text-xl font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-7 tracking-[-0.6px]">
                  Theme Mode
                </p>
                <div className="flex gap-4">
                  {/* Light */}
                  <button
                    onClick={() => setThemeMode("light")}
                    aria-pressed={themeMode === "light"}
                    aria-label="Light mode"
                    className="flex flex-col gap-2 items-center flex-1 min-w-[120px] max-w-[200px]"
                  >
                    <div className="w-full h-24 flex">
                      <LightPreview />
                    </div>
                    <span
                      className={`text-sm font-medium leading-5 ${
                        themeMode === "light" ? "text-[#0f172a] dark:text-[#f1f5f9]" : "text-[#64748b] dark:text-[#94a3b8]"
                      }`}
                    >
                      Light
                    </span>
                  </button>

                  {/* Dark */}
                  <button
                    onClick={() => setThemeMode("dark")}
                    aria-pressed={themeMode === "dark"}
                    aria-label="Dark mode"
                    className="flex flex-col gap-2 items-center flex-1 min-w-[120px] max-w-[200px]"
                  >
                    <div className="w-full h-24 flex">
                      <DarkPreview selected={themeMode === "dark"} />
                    </div>
                    <span
                      className={`text-sm font-medium leading-5 ${
                        themeMode === "dark" ? "text-[#0f172a] dark:text-[#f1f5f9]" : "text-[#64748b] dark:text-[#94a3b8]"
                      }`}
                    >
                      Dark
                    </span>
                  </button>

                  {/* System */}
                  <button
                    onClick={() => setThemeMode("system")}
                    aria-pressed={themeMode === "system"}
                    aria-label="System mode (follow OS preference)"
                    className="flex flex-col gap-2 items-center flex-1 min-w-[120px] max-w-[200px]"
                  >
                    <div className="w-full h-24 flex">
                      <SystemPreview />
                    </div>
                    <span
                      className={`text-sm font-medium leading-5 ${
                        themeMode === "system" ? "text-[#0f172a] dark:text-[#f1f5f9]" : "text-[#64748b] dark:text-[#94a3b8]"
                      }`}
                    >
                      System
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
