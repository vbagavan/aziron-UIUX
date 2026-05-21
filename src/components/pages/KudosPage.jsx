import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import AppHeader from "@/components/layout/AppHeader";
import { useKudosWorkflow } from "@/components/features/kudos/useKudosWorkflow";
import { KudosConversationBody, KudosPanelHeader } from "@/components/features/kudos/kudosUi";
import { DEFAULT_CARD_CONTENT } from "@/components/features/kudos/constants";
import { resolveCardStyles, accentWithAlpha } from "@/lib/kudosCardStyleUtils";
import KudosPreviewEditor from "@/components/features/kudos/KudosPreviewEditor";
import KudosComposeStep from "@/components/features/kudos/KudosComposeStep";
import {
  Bot,
  X,
  Maximize2,
  Check,
  Paperclip,
  Send,
  Wrench,
  Database,
  Cpu,
  Mail,
  CheckCircle2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USERS = [
  { id: 1, name: "Malik Boatwright", email: "boatwright@aziro.com", color: "var(--warning)" },
  { id: 2, name: "Zoya Baum", email: "zbaum@aziro.com", color: "var(--primary)" },
  { id: 3, name: "Kenton Rue", email: "rkenton@aziro.com", color: "var(--destructive)" },
  { id: 4, name: "Zackary Turcotte", email: "zturcotte@aziro.com", color: "var(--chart-chart-4)" },
  { id: 5, name: "Branson Crona", email: "rtranson@aziro.com", color: "var(--success)" },
  { id: 6, name: "Shea Trantow", email: "strantow@aziro.com", color: "var(--warning)" },
  { id: 7, name: "Balachandra Husaine", email: "bhusaine@aziro.com", color: "var(--info)" },
  { id: 8, name: "Jayson Heaney", email: "jheaney@aziro.com", color: "var(--destructive)" },
  { id: 9, name: "Crystel Bayer", email: "bcrystel@aziro.com", color: "var(--success)" },
];

const DEFAULT_RECIPIENTS = [
  { name: "Balachandra Husaine", color: "var(--info)" },
  { name: "Sridhar", color: "var(--success)" },
];

const TEMPLATES = [
  { id: "gold-classic", label: "Gold Classic" },
  { id: "blue-morden", label: "Blue Modern" },
  { id: "green", label: "Green Nature" },
  { id: "purple-elegant", label: "Purple Elegant" },
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Colored circle avatar with initials */
function UserAvatar({ name, color, size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: size * 0.35,
        fontWeight: 600,
        color: "var(--primary-foreground)",
        userSelect: "none",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/** Spark / Aziro logo SVG (used in generating messages) */
function SparkLogo({ size = 18 }) {
  const s = size;
  return (
    <svg
      width={s}
      height={Math.round(s * 1.09)}
      viewBox="0 0 22 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path d="M0 14L9 8.5V19.5L0 14Z" fill="var(--primary)" />
      <path d="M13 0L22 5.5V14.5L13 9V0Z" fill="var(--primary)" />
      <path d="M13 15L22 9.5V20.5L13 15Z" fill="var(--chart-chart-2)" />
    </svg>
  );
}

/** Agent placeholder icon (bot icon in bordered box) */
function AgentPlaceholder() {
  return (
    <div className="bg-muted border border-border rounded-[4px] size-12 flex items-center justify-center flex-shrink-0">
      <Bot size={24} className="text-muted-foreground" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gold Classic Card
// ---------------------------------------------------------------------------

function GoldClassicCard({ recipients, content = DEFAULT_CARD_CONTENT }) {
  const s = resolveCardStyles(content, {
    accent: "var(--warning)",
    background: "radial-gradient(ellipse at 30% 20%, var(--foreground) 0%, var(--foreground) 70%)",
    fontColor: "var(--warning)",
    borderColor: "var(--warning)",
    buttonColor: "var(--primary)",
  });
  const GOLD = s.accent;
  const GOLD_LIGHT = s.accent;
  const DARK_BG = "var(--foreground)";

  // Use provided recipients or fallback defaults
  const people = recipients && recipients.length > 0 ? recipients : DEFAULT_RECIPIENTS;

  return (
    <div
      style={{
        width: 700,
        minHeight: 500,
        background: s.background,
        border: `2px solid ${s.borderColor}`,
        borderRadius: 12,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "36px 48px 40px",
        boxSizing: "border-box",
        boxShadow: `0 0 60px 0 rgba(201,162,39,0.18), 0 4px 32px 0 rgba(0,0,0,0.6)`,
        overflow: "hidden",
      }}
    >
      {/* Subtle corner glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 200,
          height: 200,
          background: `radial-gradient(ellipse at top right, rgba(201,162,39,0.12) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {content.showLogo !== false && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 36,
            height: 36,
            backgroundColor: s.buttonColor,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            className="font-serif"
            style={{
              color: "var(--primary-foreground)",
              fontWeight: 800,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            A
          </span>
        </div>
      )}

      {/* "Congratulations" italic script title */}
      <div
        className="font-serif"
        style={{
          marginTop: 8,
          fontSize: 44,
          fontStyle: "italic",
          fontWeight: 700,
          color: s.fontColor,
          letterSpacing: 1,
          textShadow: `0 0 20px rgba(201,162,39,0.5)`,
          textAlign: "center",
        }}
      >
        {content.headline}
      </div>

      {/* Subtitle bar */}
      <div
        style={{
          marginTop: 16,
          border: `1px solid ${GOLD}`,
          borderRadius: 4,
          padding: "6px 28px",
          color: GOLD,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: 0.5,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {content.subtitle}
      </div>

      {/* Recipients area */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 48,
        }}
      >
        {/* Star in the middle between avatars */}
        {people.map((person, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Gold-ring avatar */}
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: `2.5px solid ${GOLD}`,
                padding: 3,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 12px 0 rgba(201,162,39,0.4)`,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: person.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--primary-foreground)",
                }}
              >
                {getInitials(person.name)}
              </div>
            </div>

            {/* Name badge */}
            <div
              style={{
                backgroundColor: "rgba(201,162,39,0.15)",
                border: `1px solid ${GOLD}`,
                borderRadius: 20,
                padding: "4px 14px",
                color: GOLD,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {person.name.split(" ")[0]}
            </div>

            {/* Decorative gold star between recipients (only after first, before second) */}
            {idx === 0 && people.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  marginTop: 18,
                  fontSize: 24,
                  color: GOLD_LIGHT,
                  textShadow: `0 0 8px rgba(201,162,39,0.6)`,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                ✦
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Appreciation message */}
      <div
        style={{
          marginTop: 36,
          color: "var(--primary-foreground)",
          fontSize: 14,
          fontStyle: "italic",
          textAlign: "center",
          lineHeight: 1.7,
          maxWidth: 520,
          opacity: 0.9,
        }}
      >
        &ldquo;{content.message}&rdquo;
      </div>

      {/* Decorative gold star divider */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          maxWidth: 500,
        }}
      >
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
        <span style={{ color: GOLD_LIGHT, fontSize: 18 }}>✦</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
      </div>

      {/* Bottom thin gold line */}
      <div
        style={{
          marginTop: 24,
          width: "80%",
          height: 1,
          background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blue Modern Card
// ---------------------------------------------------------------------------

function BlueMordernCard({ recipients, content = DEFAULT_CARD_CONTENT }) {
  const s = resolveCardStyles(content, {
    accent: "var(--primary)",
    background: "var(--primary-foreground)",
    fontColor: "var(--primary)",
    borderColor: "var(--chart-chart-2)",
    buttonColor: "rgba(255,255,255,0.2)",
    bodyBg: accentWithAlpha("var(--primary)", 0.08),
  });
  const BLUE = s.accent;
  const BLUE_LIGHT = s.bodyBg ?? accentWithAlpha(s.accent, 0.08);
  const BLUE_MID = s.borderColor;

  const people = recipients && recipients.length > 0 ? recipients : DEFAULT_RECIPIENTS;

  return (
    <div
      style={{
        width: 700,
        minHeight: 500,
        background: s.background,
        border: `1.5px solid ${BLUE_MID}`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 32px 0 rgba(37,99,235,0.10)",
        boxSizing: "border-box",
      }}
    >
      {/* Header band */}
      <div
        style={{
          background: s.headerBg ?? `linear-gradient(135deg, ${BLUE} 0%, #1e40af 100%)`,
          padding: "36px 48px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background circle decoration */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -30,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: s.buttonColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            border: "1.5px solid rgba(255,255,255,0.35)",
          }}
        >
          <span style={{ color: "var(--primary-foreground)", fontWeight: 800, fontSize: 18 }}>A</span>
        </div>

        <h1
          className="font-sans"
          style={{
            color: s.fontColor === s.accent ? "var(--primary-foreground)" : s.fontColor,
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: -0.5,
            margin: 0,
            textAlign: "center",
          }}
        >
          {content.headline}
        </h1>
        <p
          className="font-sans"
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            marginTop: 8,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {content.subtitle}
        </p>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          background: s.bodyBg ?? BLUE_LIGHT,
          padding: "40px 48px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Recipients */}
        <div style={{ display: "flex", gap: 40, justifyContent: "center", alignItems: "flex-start" }}>
          {people.map((person, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {/* Avatar with blue ring */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  border: `3px solid ${BLUE}`,
                  padding: 3,
                  boxSizing: "border-box",
                  background: "var(--primary-foreground)",
                }}
              >
                <div
                  className="font-sans"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: person.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--primary-foreground)",
                  }}
                >
                  {getInitials(person.name)}
                </div>
              </div>
              {/* Name chip */}
              <div
                className="font-sans"
                style={{
                  background: "var(--primary-foreground)",
                  border: `1.5px solid ${BLUE_MID}`,
                  borderRadius: 20,
                  padding: "4px 16px",
                  color: BLUE,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {person.name.split(" ")[0]}
              </div>
            </div>
          ))}
        </div>

        {/* Horizontal rule */}
        <div style={{ width: "100%", maxWidth: 480, height: 1, background: BLUE_MID }} />

        {/* Message */}
        <p
          className="font-sans"
          style={{
            color: "var(--foreground)",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.7,
            maxWidth: 520,
            margin: 0,
          }}
        >
          &ldquo;{content.message}&rdquo;
        </p>

        {/* Footer chips */}
        <div style={{ display: "flex", gap: 8 }}>
          {["Excellence", "Customer Focus", "Teamwork"].map((tag) => (
            <span
              key={tag}
              className="font-sans"
              style={{
                background: "var(--primary-foreground)",
                border: `1.5px solid ${BLUE_MID}`,
                borderRadius: 20,
                padding: "3px 12px",
                color: BLUE,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Green Nature Card
// ---------------------------------------------------------------------------

function GreenCard({ recipients, content = DEFAULT_CARD_CONTENT }) {
  const s = resolveCardStyles(content, {
    accent: "var(--success)",
    background: accentWithAlpha("var(--success)", 0.08),
    fontColor: "var(--success)",
    borderColor: "var(--success)",
    buttonColor: "var(--success)",
  });
  const GREEN = s.accent;
  const GREEN_DARK = s.fontColor;
  const GREEN_LIGHT = accentWithAlpha(s.accent, 0.1);
  const GREEN_MID = s.borderColor;

  const people = recipients && recipients.length > 0 ? recipients : DEFAULT_RECIPIENTS;

  return (
    <div
      style={{
        width: 700,
        minHeight: 500,
        background: s.background,
        border: `1.5px solid ${GREEN_MID}`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 32px 0 rgba(22,163,74,0.10)",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Top decorative wave */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${GREEN} 0%, #4ade80 50%, ${GREEN} 100%)`,
        }}
      />

      {/* Top-right logo */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: s.buttonColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "var(--primary-foreground)", fontWeight: 800, fontSize: 17 }}>A</span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "44px 48px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          background: s.bodyBg ?? undefined,
        }}
      >
        {/* Leaf icon + title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 36 }}>🌿</span>
          <h1
            className="font-serif"
            style={{
              color: GREEN_DARK,
              fontSize: 40,
              fontWeight: 700,
              fontStyle: "italic",
              margin: 0,
              textAlign: "center",
            }}
          >
            {content.headline}
          </h1>
          {/* Tag line */}
          <div
            className="font-sans"
            style={{
              background: GREEN_LIGHT,
              border: `1px solid ${GREEN_MID}`,
              borderRadius: 20,
              padding: "4px 20px",
              color: GREEN,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {content.subtitle}
          </div>
        </div>

        {/* Recipients */}
        <div style={{ display: "flex", gap: 40, justifyContent: "center", alignItems: "flex-start" }}>
          {people.map((person, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  border: `3px solid ${GREEN}`,
                  padding: 3,
                  boxSizing: "border-box",
                  background: "var(--primary-foreground)",
                  boxShadow: "0 0 0 4px rgba(22,163,74,0.12)",
                }}
              >
                <div
                  className="font-sans"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: person.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--primary-foreground)",
                  }}
                >
                  {getInitials(person.name)}
                </div>
              </div>
              <div
                className="font-sans"
                style={{
                  background: GREEN_LIGHT,
                  border: `1px solid ${GREEN_MID}`,
                  borderRadius: 20,
                  padding: "4px 14px",
                  color: GREEN_DARK,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {person.name.split(" ")[0]}
              </div>
            </div>
          ))}
        </div>

        {/* Divider with leaves */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 500 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GREEN_MID})` }} />
          <span style={{ fontSize: 16 }}>🍃</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GREEN_MID})` }} />
        </div>

        {/* Message */}
        <p
          className="font-serif"
          style={{
            color: "var(--success)",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.7,
            maxWidth: 520,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          &ldquo;{content.message}&rdquo;
        </p>

        {/* Bottom accent */}
        <div
          style={{
            width: "60%",
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Purple Elegant Card
// ---------------------------------------------------------------------------

function PurpleElegantCard({ recipients, content = DEFAULT_CARD_CONTENT }) {
  const s = resolveCardStyles(content, {
    accent: "var(--chart-chart-4)",
    background: "radial-gradient(ellipse at 40% 10%, #1e0a3c 0%, var(--foreground) 65%)",
    fontColor: "var(--chart-chart-4)",
    borderColor: "var(--chart-chart-4)",
    buttonColor: "var(--chart-chart-4)",
  });
  const PURPLE = s.accent;
  const PURPLE_LIGHT = s.fontColor;
  const SILVER = content.messageColor ?? "var(--border)";
  const DARK = "var(--foreground)";

  const people = recipients && recipients.length > 0 ? recipients : DEFAULT_RECIPIENTS;

  return (
    <div
      style={{
        width: 700,
        minHeight: 500,
        background: s.background,
        border: `2px solid ${s.borderColor}`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 48px 40px",
        boxSizing: "border-box",
        boxShadow: `0 0 60px 0 rgba(124,58,237,0.2), 0 4px 32px 0 rgba(0,0,0,0.7)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glows */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 240,
          height: 240,
          background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 200,
          height: 200,
          background: "radial-gradient(ellipse at bottom right, rgba(167,139,250,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top right logo */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: s.buttonColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 12px ${accentWithAlpha(s.accent, 0.5)}`,
        }}
      >
        <span style={{ color: "var(--primary-foreground)", fontWeight: 800, fontSize: 18 }}>A</span>
      </div>

      {/* Crown icon */}
      <div style={{ fontSize: 32, marginBottom: 8 }}>👑</div>

      {/* Title */}
      <h1
        className="font-serif"
        style={{
          color: PURPLE_LIGHT,
          fontSize: 42,
          fontWeight: 700,
          fontStyle: "italic",
          letterSpacing: 1,
          margin: 0,
          textAlign: "center",
          textShadow: `0 0 24px rgba(167,139,250,0.5)`,
        }}
      >
        {content.headline}
      </h1>

      {/* Subtitle pill */}
      <div
        className="font-sans"
        style={{
          marginTop: 14,
          border: `1px solid ${PURPLE_LIGHT}`,
          borderRadius: 4,
          padding: "5px 24px",
          color: PURPLE_LIGHT,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          background: "rgba(124,58,237,0.15)",
        }}
      >
        {content.subtitle}
      </div>

      {/* Recipients */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          gap: 48,
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {people.map((person, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: `2.5px solid ${PURPLE_LIGHT}`,
                padding: 3,
                boxSizing: "border-box",
                boxShadow: `0 0 14px rgba(124,58,237,0.5)`,
              }}
            >
              <div
                className="font-sans"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: person.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--primary-foreground)",
                }}
              >
                {getInitials(person.name)}
              </div>
            </div>
            <div
              className="font-sans"
              style={{
                background: "rgba(124,58,237,0.2)",
                border: `1px solid ${PURPLE_LIGHT}`,
                borderRadius: 20,
                padding: "4px 14px",
                color: PURPLE_LIGHT,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {person.name.split(" ")[0]}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          maxWidth: 500,
        }}
      >
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${PURPLE_LIGHT})` }} />
        <span style={{ color: PURPLE_LIGHT, fontSize: 16 }}>✦</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${PURPLE_LIGHT})` }} />
      </div>

      {/* Message */}
      <p
        className="font-serif"
        style={{
          marginTop: 24,
          color: SILVER,
          fontSize: 14,
          fontStyle: "italic",
          textAlign: "center",
          lineHeight: 1.7,
          maxWidth: 520,
          opacity: 0.85,
        }}
      >
        &ldquo;{content.message}&rdquo;
      </p>

      {/* Bottom accent line */}
      <div
        style={{
          marginTop: 28,
          width: "70%",
          height: 1,
          background:
            s.footerBg ??
            `linear-gradient(to right, transparent, ${PURPLE}, transparent)`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

export function renderKudosTemplate(templateId, recipients, content = DEFAULT_CARD_CONTENT) {
  switch (templateId) {
    case "blue-morden":
      return <BlueMordernCard recipients={recipients} content={content} />;
    case "green":
      return <GreenCard recipients={recipients} content={content} />;
    case "purple-elegant":
      return <PurpleElegantCard recipients={recipients} content={content} />;
    case "gold-classic":
    default:
      return <GoldClassicCard recipients={recipients} content={content} />;
  }
}

// ---------------------------------------------------------------------------
// User Picker Dropdown
// ---------------------------------------------------------------------------

function UserPickerDropdown({ query, onSelect }) {
  const filtered = USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div
      className="bg-card border border-border rounded-[8px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] overflow-y-auto"
      style={{ maxHeight: 260 }}
    >
      {filtered.map((user, idx) => (
        <button
          key={user.id}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user);
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left transition-colors ${
            idx !== 0 ? "border-t border-border" : ""
          }`}
        >
          <UserAvatar name={user.name} color={user.color} size={30} />
          <div className="flex flex-col min-w-0 gap-0.5">
            <span className="text-sm font-medium text-foreground leading-5 truncate">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground leading-4 truncate">{user.email}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prompt Box
// ---------------------------------------------------------------------------

function PromptBox({ value, onChange, onSend, showPicker, pickerQuery, onSelectUser }) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className="bg-muted rounded-[12px] w-full"
      style={{ boxShadow: "8px 6px 130px 0px rgba(37,99,235,0.16)" }}
    >
      {/* User picker appears ABOVE the box */}
      {showPicker && (
        <div className="mb-1">
          <UserPickerDropdown query={pickerQuery} onSelect={onSelectUser} />
        </div>
      )}

      {/* Input panel */}
      <div className="border border-border rounded-t-[12px] flex items-start gap-2 min-h-[100px] p-4">
        {/* Attachment button */}
        <button aria-label="Attach file" className="flex items-center justify-center size-10 rounded-full text-muted-foreground hover:bg-muted flex-shrink-0 mt-0.5">
          <Paperclip size={16} aria-hidden />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your appreciation..."
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-6 min-h-[40px] pt-1.5"
          style={{ overflow: "hidden" }}
        />

        {/* Send button */}
        <button
          onClick={onSend}
          aria-label="Send kudos"
          className="flex items-center justify-center size-10 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted flex-shrink-0 mt-0.5"
        >
          <Send size={16} aria-hidden />
        </button>
      </div>

      {/* Control bar */}
      <div className="border-b border-l border-r border-border rounded-b-[12px] h-9 flex items-center justify-between px-4">
        {/* Left controls */}
        <div className="flex items-center gap-0.5">
          {/* Tools button */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08)" }}
          >
            <Wrench size={14} />
            <span className="text-xs text-muted-foreground">Tools</span>
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-border mx-1" />

          {/* Knowledge icon */}
          <button aria-label="Browse knowledge hub" className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors">
            <Database size={14} aria-hidden />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-border mx-1" />

          {/* Usage */}
          <div className="flex items-center gap-1.5 px-2">
            {/* Donut icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="5" stroke="var(--border)" strokeWidth="3" fill="none" />
              <circle
                cx="7"
                cy="7"
                r="5"
                stroke="var(--primary)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${0.65 * 2 * Math.PI * 5} ${2 * Math.PI * 5}`}
                strokeDashoffset={2 * Math.PI * 5 * 0.25}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs text-muted-foreground">65% used</span>
          </div>
        </div>

        {/* Right: AI model selector */}
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors">
          <Cpu size={14} />
          <span className="text-xs text-muted-foreground">Claude-sonnet</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email Tag Input
// ---------------------------------------------------------------------------

function EmailTagInput({ tags, onAdd, onRemove, inputValue, onInputChange, placeholder }) {
  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      const email = inputValue.trim().replace(/,$/, "");
      if (email && !tags.includes(email)) onAdd(email);
      onInputChange("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[28px] py-0.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-xs text-primary font-medium whitespace-nowrap"
        >
          {tag}
          <button
            onMouseDown={(e) => { e.preventDefault(); onRemove(tag); }}
            aria-label={`Remove ${tag}`}
            className="text-foreground hover:text-primary transition-colors"
          >
            <X size={10} aria-hidden />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[140px] text-sm text-foreground outline-none bg-transparent placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Email Card (shown in RightSidebar conversation after approval)
// ---------------------------------------------------------------------------

function InlineEmailCard({ approval, onUpdate }) {
  if (approval.emailSent) {
    return (
      <div className="bg-success/10 border border-success-ring rounded-[10px] p-3 flex items-center gap-2.5">
        <CheckCircle2 size={15} className="text-success flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-success">Email Sent!</p>
          <p className="text-xs text-muted-foreground">
            Delivered to {approval.emailTo.length} recipient{approval.emailTo.length !== 1 ? "s" : ""}
            {approval.emailCc.length > 0 ? ` + ${approval.emailCc.length} CC` : ""}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[10px] overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted">
        <Mail size={13} className="text-primary flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground flex-1">Send Appreciation Email</span>
        <span className="text-xs font-medium text-success bg-success/10 border border-success-ring rounded-full px-2 py-0.5">
          Approved ✓
        </span>
      </div>

      {/* To: */}
      <div className="flex items-start gap-2 px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-5 pt-1.5 flex-shrink-0">To</span>
        <div className="flex-1 min-w-0">
          <EmailTagInput
            tags={approval.emailTo}
            onAdd={(e) => onUpdate(approval.id, { emailTo: [...approval.emailTo, e] })}
            onRemove={(e) => onUpdate(approval.id, { emailTo: approval.emailTo.filter((x) => x !== e) })}
            inputValue={approval.toInput}
            onInputChange={(v) => onUpdate(approval.id, { toInput: v })}
            placeholder="Add recipients…"
          />
        </div>
      </div>

      {/* CC: */}
      <div className="flex items-start gap-2 px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-5 pt-1.5 flex-shrink-0">CC</span>
        <div className="flex-1 min-w-0">
          <EmailTagInput
            tags={approval.emailCc}
            onAdd={(e) => onUpdate(approval.id, { emailCc: [...approval.emailCc, e] })}
            onRemove={(e) => onUpdate(approval.id, { emailCc: approval.emailCc.filter((x) => x !== e) })}
            inputValue={approval.ccInput}
            onInputChange={(v) => onUpdate(approval.id, { ccInput: v })}
            placeholder="Add CC…"
          />
        </div>
      </div>

      {/* Send */}
      <div className="px-3 py-2.5">
        <button
          onClick={() => onUpdate(approval.id, { emailSent: true })}
          disabled={approval.emailTo.length === 0}
          className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground text-xs font-medium h-8 rounded-[6px] transition-colors"
        >
          <Mail size={12} /> Send Email
        </button>
        {approval.emailTo.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-1">Add at least one recipient</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right Sidebar Panel
// ---------------------------------------------------------------------------

function RightSidebar({ stage, activeTemplate, approvals, onUpdateApproval, onClose, inputValue, onInputChange, onSend, showPicker, pickerQuery, onSelectUser }) {
  const activeLabel = TEMPLATES.find((t) => t.id === activeTemplate)?.label ?? "Gold Classic";
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (stage === "generating" || stage === "preview") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [stage]);

  return (
    <div
      className="flex flex-col border-l border-border bg-muted flex-shrink-0"
      style={{ width: 340 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 h-16 px-4 border-b border-border flex-shrink-0 relative">
        <AgentPlaceholder />
        <span className="flex-1 text-base font-medium text-foreground leading-6 truncate">
          Customer Appreciation
        </span>


        <button aria-label="Expand conversation" className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-border transition-colors">
          <Maximize2 size={16} aria-hidden />
        </button>
        <button
          onClick={onClose}
          aria-label="Close conversation"
          className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-border transition-colors"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      {/* Content body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-4 py-4 gap-3">
        {/* Stage 1: empty — centered welcome text */}
        {stage === "empty" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-2">
            <h2 className="text-3xl font-medium text-foreground leading-tight">
              Hi! Let's create a customer appreciation.
            </h2>
            <p className="text-sm text-foreground leading-5 max-w-[260px]">
              I'll help you generate a professional appreciation card and message. You'll be able
              to review, edit, and approve it before sending.
            </p>
          </div>
        )}

        {/* Stage 2 & 3: conversation history */}
        {(stage === "generating" || stage === "preview") && (
          <div className="flex flex-col gap-3">
            {/* User message (echoed) */}
            <div className="flex justify-end">
              <div className="bg-primary/10 border border-primary/30 rounded-[12px] rounded-tr-[4px] px-3 py-2 max-w-[85%]">
                <p className="text-sm text-foreground leading-5">
                  /kudos @Balachandra Husaine @Sridhar — outstanding customer service this quarter!
                </p>
              </div>
            </div>

            {/* Generating indicator with animated dots */}
            <div className="flex items-center gap-2">
              <SparkLogo size={18} />
              <span className="text-sm text-foreground">Generating</span>
              <span className="flex gap-0.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                  />
                ))}
              </span>
            </div>

            {/* AI response lines */}
            <p className="text-sm text-foreground leading-5">
              Designing KudosFlow template — selecting card style, parsing recipients, preparing
              approval flow
            </p>
            <p className="text-sm text-foreground leading-5">
              Applying {activeLabel} theme with personalized message and recipient avatars. Your
              appreciation card will be ready momentarily.
            </p>

            {/* Success alert card — shown only after preview is reached */}
            {stage === "preview" && (
              <div className="bg-card border border-border rounded-md p-4 flex items-start gap-3">
                <div className="flex items-center justify-center size-5 rounded-full bg-success/10 flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-success" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm text-foreground">
                    Template has been generated
                  </span>
                  <span className="text-sm text-muted-foreground leading-5">
                    Your appreciation card is ready. Review the preview on the left, then use the prompt to request approval.
                  </span>
                </div>
              </div>
            )}

            {/* Approval request conversation threads — one per approval */}
            {approvals.map((approval) => (
              <div key={approval.id} className="flex flex-col gap-3">
                {/* User bubble — echoes what they typed */}
                <div className="flex justify-end">
                  <div className="bg-primary/10 border border-primary/30 rounded-[12px] rounded-tr-[4px] px-3 py-2 max-w-[85%]">
                    <p className="text-sm text-foreground leading-5">{approval.userMessage}</p>
                  </div>
                </div>

                {/* AI confirmation bubble */}
                <div className="flex items-start gap-2">
                  <SparkLogo size={16} />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className={`rounded-[10px] px-3 py-2.5 border ${
                      approval.status === "approved"
                        ? "bg-success/10 border-success-ring"
                        : "bg-card border-border"
                    }`}>
                      {approval.status === "approved" ? (
                        <>
                          <p className="text-sm font-medium text-success leading-5">
                            ✓ Card approved by manager
                          </p>
                          <p className="text-xs text-muted-foreground leading-4 mt-0.5">
                            Configure the email recipients below and hit Send to deliver the appreciation card.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground leading-5">
                            Approval request sent ✓
                          </p>
                          <p className="text-xs text-muted-foreground leading-4 mt-0.5">
                            Your manager has been notified. You'll receive a notification once the card is reviewed.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline email card — only when approved */}
                {approval.status === "approved" && (
                  <InlineEmailCard approval={approval} onUpdate={onUpdateApproval} />
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom action area — always the prompt box */}
      <div className="flex-shrink-0 p-4 pt-0">
        <PromptBox
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          showPicker={showPicker}
          pickerQuery={pickerQuery}
          onSelectUser={onSelectUser}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Selector Bar (bottom of left panel in preview)
// ---------------------------------------------------------------------------

function TemplateSelectorBar({ activeTemplate, onSelect }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-t border-border flex-shrink-0 bg-card">
      <span className="text-sm text-black font-medium flex-shrink-0">Templates:</span>
      <div className="flex items-center gap-2 flex-wrap">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className={`px-3 py-1.5 text-sm rounded-[6px] border transition-colors ${
              activeTemplate === tpl.id
                ? "bg-muted border-border text-foreground font-medium"
                : "bg-card border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {tpl.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Embedded preview (agents list main area)
// ---------------------------------------------------------------------------

export { default as KudosPreviewPane } from "@/components/features/kudos/KudosPreviewEditor";

// ---------------------------------------------------------------------------
// Main KudosPage component
// ---------------------------------------------------------------------------

export default function KudosPage({ onNavigate }) {
  const workflow = useKudosWorkflow();
  const {
    stage,
    activeTemplate,
    setActiveTemplate,
    selectedRecipients,
    setInputValue,
    approvals,
    notifOpen,
    setNotifOpen,
    handleApprove,
    handleReject,
    handleUpdateApproval,
    inputValue,
    handleSend,
    showPicker,
    pickerQuery,
    handleSelectUser,
  } = workflow;

  return (
    <main className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="agents" onNavigate={onNavigate} />

      {/* Main content wrapper */}
      <div className="app-page-column flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <AppHeader
          approvals={approvals}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={workflow.handleRequestChanges}
          notifOpen={notifOpen}
          onNotifToggle={() => setNotifOpen((v) => !v)}
        />

        {/* Body: left content area + right sidebar */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left panel */}
          <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden bg-muted">
            {stage === "compose" || stage === "empty" ? (
              <div className="app-scroll-region min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                <div className="max-w-2xl mx-auto px-8 py-10">
                  <KudosComposeStep workflow={workflow} onContinue={workflow.submitComposeForm} />
                </div>
              </div>
            ) : (
              <KudosPreviewEditor workflow={workflow} />
            )}
          </div>

          {/* Right sidebar — /kudos conversation */}
          <div
            className="flex h-full min-h-0 flex-col border-l border-border bg-muted flex-shrink-0 overflow-hidden"
            style={{ width: 340 }}
          >
            <KudosPanelHeader onClose={() => onNavigate?.("agents")} />
            <KudosConversationBody workflow={workflow} />
          </div>
        </div>
      </div>
    </main>
  );
}
