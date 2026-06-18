import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Send,
  Bot,
  FileText,
  Clock,
  Copy,
  Download,
  Check,
  RotateCcw,
  Network,
  Layers,
  ClipboardList,
  FileSpreadsheet,
  Database,
  ExternalLink,
  Plus,
  Unlink,
  HardDrive,
  Cloud,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  MessageSquare,
  BookOpen,
  Trash2,
  Wand2,
  Info,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageUnderlineTabs } from "@/components/common/PageUnderlineTabs";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import {
  ContentCaptureDropdown,
  CreateDocumentDialog,
  GenerateReportDialog,
  SaveToNodeDialog,
  SelectionContextMenu,
} from "@/components/features/documents/ContentCaptureUI";
import { useDocumentContentCapture } from "@/components/features/documents/useDocumentContentCapture";
import { getFileTypeConfig } from "@/components/features/knowledge/hubFileTypeConfig";
import { formatDisplayDate } from "@/data/knowledgeHubs";
import { cn } from "@/lib/utils";
import { LinkedKnowledgeHubSection } from "@/components/features/knowledge/LinkedKnowledgeHubSection";
import {
  getSourceDetailRows,
  getSourceDetailsTitle,
} from "@/lib/sourceListModel";
import { HubFilePreviewViewer } from "@/components/features/knowledge/HubFilePreviewViewer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PANEL_TABS = [
  { id: "chapter", label: "Ask AI", icon: MessageSquare },
  { id: "studio", label: "Studio", icon: Wand2 },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "details", label: "Details", icon: Info },
];

const CENTER_VIEWS = [
  { id: "read", label: "Reader", icon: BookOpen },
  { id: "preview", label: "Source file", icon: FileText },
];

// ─── Content map ──────────────────────────────────────────────────────────────

const CONTENT_MAP = {
  "QuantumLeap.pdf": {
    chapters: [
      {
        id: "c1",
        num: 1,
        title: "Executive Summary",
        readMins: 2,
        summary:
          "QuantumLeap combines classical LLM inference with variational quantum circuits to accelerate computationally intractable enterprise problems, showing a 12× speed improvement on portfolio optimisation while maintaining solution quality within 0.3% of optimal.",
        body: `QuantumLeap is a cloud-native platform that combines classical large-language model inference with variational quantum circuits to accelerate computationally intractable enterprise problems. Early benchmarks on portfolio optimization show a 12× speed improvement over best-in-class classical solvers while maintaining solution quality within 0.3% of optimal.\n\nThis document outlines the product vision, technical architecture, targeted verticals, and the 18-month commercial roadmap that supports Series B fundraising at a $240 M pre-money valuation.\n\nThe platform is designed to be accessible to enterprise development teams without quantum expertise. Developers interact with a Pythonic SDK that compiles classical neural graph operations into quantum circuits automatically, hiding the complexity of qubit management, gate transpilation, and hardware calibration behind familiar abstractions.\n\nKey differentiators include cross-provider failover (IBM Quantum, Amazon Braket, Azure Quantum, IonQ), sub-200 ms re-transpilation when devices degrade, and a managed vector store that keeps reproducibility guarantees across research and production workloads.`,
      },
      {
        id: "c2",
        num: 2,
        title: "Introduction to Quantum AI",
        readMins: 3,
        summary:
          "The convergence of quantum computing and AI represents a fundamental shift in computational capability, enabling exploration of exponentially growing solution spaces simultaneously through superposition and entanglement.",
        body: `The convergence of quantum computing and artificial intelligence represents one of the most significant shifts in computational capability since the introduction of GPU-accelerated deep learning. Where classical neural networks must evaluate exponentially growing solution spaces sequentially, quantum algorithms can leverage superposition and entanglement to explore many states simultaneously.\n\nQuantum computers represent information as qubits — quantum bits that can exist in a superposition of 0 and 1 simultaneously. Entanglement links the state of multiple qubits so that a measurement on one instantly informs the state of others, regardless of physical distance. Interference amplifies the probability amplitude of correct solutions while cancelling incorrect ones.\n\nToday's noisy intermediate-scale quantum (NISQ) devices contain between 50 and 1,000 physical qubits. Error rates of 0.1–1% per gate operation limit circuit depth, but hybrid algorithms such as the Variational Quantum Eigensolver (VQE) and Quantum Approximate Optimization Algorithm (QAOA) are designed precisely to work within these constraints.\n\nQuantum machine learning (QML) augments classical ML pipelines at three points: feature embedding (mapping high-dimensional data into quantum state spaces), kernel computation (measuring quantum kernel matrices that are classically intractable), and optimization (replacing gradient descent with quantum-assisted variational routines for objective landscapes with many local minima).`,
      },
      {
        id: "c3",
        num: 3,
        title: "Platform Architecture",
        readMins: 4,
        summary:
          "QuantumLeap's three-tier architecture isolates hardware volatility through a Hardware Abstraction Layer, middleware orchestration, and a developer-facing Pythonic SDK that auto-compiles neural graph operations to quantum circuits.",
        body: `QuantumLeap's three-tier architecture isolates hardware volatility from application developers. The Hardware Abstraction Layer (HAL) normalises gate sets across IBM Quantum, Amazon Braket, Azure Quantum, and IonQ. The Middleware orchestration engine handles job queuing, shot budgeting, and result aggregation. The SDK surfaces a Pythonic DSL that compiles classical neural graph operations into quantum circuits automatically.\n\nThe QML handles qubit allocation, calibration scheduling, and cross-provider failover. When a target device's error rate exceeds a configurable threshold the layer transparently reroutes to the next available backend, re-transpiling the circuit for the new gate set in under 200 ms. Calibration data is cached and versioned so that reproducibility of research experiments is guaranteed.\n\nData ingestion pipelines convert structured enterprise data (tabular, graph, time-series) into amplitude-encoded quantum states via parametric encoding circuits. Output probability distributions are post-processed by a classical decoder head, enabling drop-in replacement of existing ML model inference endpoints without retraining downstream consumers.`,
      },
      {
        id: "c4",
        num: 4,
        title: "Use Cases",
        readMins: 5,
        summary:
          "QuantumLeap targets life sciences and financial services — two verticals where quantum advantage is already demonstrable on today's NISQ hardware, with validated results in molecular simulation and portfolio optimisation.",
        body: `QuantumLeap's initial go-to-market targets two high-value verticals where the quantum advantage is already demonstrable on hardware available today: life sciences and financial services.\n\nMolecular simulation is the quintessential quantum-native problem. Classical force-field methods fail to capture electron correlation effects critical to binding affinity prediction. QuantumLeap's VQE pipeline for small-molecule simulation has been validated on 12-qubit systems against coupled-cluster reference data, achieving chemical accuracy (< 1 kcal/mol error) for molecules with up to 8 heavy atoms — a regime where classical full-configuration-interaction becomes intractable.\n\nPortfolio construction and risk attribution are NP-hard combinatorial problems that financial institutions currently approximate with simulated annealing or genetic algorithms. Our QAOA-based portfolio optimizer consistently outperforms classical baselines by 8–14% on Sharpe ratio while cutting compute time by 3–5× when run on 127-qubit Eagle-class hardware.\n\nAdditional verticals in the product roadmap include logistics and supply-chain optimisation (route planning, inventory allocation), energy grid balancing, and materials science for battery chemistry research.`,
      },
      {
        id: "c5",
        num: 5,
        title: "Roadmap & Pricing",
        readMins: 2,
        summary:
          "The 18-month commercial roadmap runs from GA cloud launch in Q3 2025 through an on-premises appliance for regulated industries in Q3 2026, with enterprise contracts starting at $480 K annually.",
        body: `Q3 2025 — GA release of QuantumLeap Cloud with IBM Quantum and Amazon Braket backends. Pricing: $0.018 / quantum task second + $0.002 / shot.\n\nQ1 2026 — IonQ trapped-ion backend support; error-mitigation as a service. Pricing unchanged.\n\nQ3 2026 — On-premises appliance for regulated industries (finance, defence, pharma). Appliance includes dedicated 127-qubit QPU, classical co-processor, and air-gapped deployment option.\n\nEnterprise annual contracts start at $480 K with SLA guarantees (99.5% task success rate) and dedicated qubit reservations during peak windows.\n\nStartup and academic tiers available at $0.009 / task second with a free tier of 500 task seconds per month, enabling research teams to prototype before committing to production workloads.`,
      },
    ],
  },

  "Onboarding.pdf": {
    chapters: [
      {
        id: "c1",
        num: 1,
        title: "Welcome to Meridian Financial",
        readMins: 2,
        summary:
          "An introduction to Meridian Financial — its founding mission, 1,200-person team, $42 billion AUM, and the values that drive the organisation's culture and client relationships.",
        body: `We're thrilled to have you join the Meridian Financial family. This guide covers everything you need to feel confident and productive from day one — from setting up your workstation to understanding how we work, grow together, and support each other.\n\nMeridian Financial was founded in 2011 with a mission to make institutional-grade wealth management accessible to every individual. Today, our 1,200-person team manages over $42 billion in assets across 18 countries. We've maintained a Net Promoter Score of 72 for three consecutive years, placing us among the top 5% of financial services firms globally.\n\nOur four operating principles guide every decision: Client First, Own It, Grow Together, and Speak Up. These aren't wall decorations — they are the operating system behind every product decision, risk decision, and service interaction at Meridian.`,
      },
      {
        id: "c2",
        num: 2,
        title: "Your First Week",
        readMins: 3,
        summary:
          "A structured first-week schedule of meet-and-greets, product demos, and compliance training, designed to be immersive without being overwhelming, culminating in a clear mental model of Meridian's product suite.",
        body: `The first week is designed to be immersive but never overwhelming. Your hiring manager will schedule a structured schedule of meet-and-greets, product demos, and reading time. By end of week one you should understand our core product suite, have met your immediate team and key cross-functional partners, and have completed all compliance training modules.\n\nDay 1 Checklist:\n□ Collect your access badge from reception (Building A, lobby)\n□ Attend the all-hands new-hire orientation at 9:30 AM in Conference Room Orion\n□ Complete identity verification with HR (bring two forms of government ID)\n□ Receive laptop from IT — see Chapter 3 for setup instructions\n□ Join the #new-hires Slack channel and introduce yourself\n□ Lunch with your onboarding buddy (auto-assigned, see your calendar invite)\n□ Complete Code of Conduct acknowledgement in Workday by EOD`,
      },
      {
        id: "c3",
        num: 3,
        title: "IT Setup",
        readMins: 2,
        summary:
          "All employees receive a MacBook Pro 16\" (M3 Pro) with Meridian Secure Connect VPN and mandatory MFA. Lost device reporting triggers remote wipe within 60 seconds.",
        body: `All employees receive a MacBook Pro 16" (M3 Pro) pre-loaded with our standard software suite. Your IT ticket is auto-generated; you'll receive credentials via your personal email before your start date.\n\nVPN: Install Meridian Secure Connect from the Self-Service portal. MFA is mandatory — use the Meridian Authenticator app. Lost device? Call the Security Hotline at extension 5555 immediately; remote wipe is initiated within 60 seconds of your report.\n\nStandard software bundle: Slack (comms), Notion (docs), Linear (tasks), GitHub Enterprise (code), Figma (design), Workday (HR). Additional tools require manager approval and a completed Software Request form in the IT portal.`,
      },
      {
        id: "c4",
        num: 4,
        title: "Benefits & Perks",
        readMins: 4,
        summary:
          "A comprehensive total compensation package at the 75th percentile, including three medical plan tiers, unlimited mental health therapy through Lyra Health, and a $800 home office stipend.",
        body: `Meridian offers a total compensation package designed to be competitive at the 75th percentile of our peer group, updated annually against Radford and McLagan survey data.\n\nMedical: Three plan tiers (Core PPO, Enhanced PPO, HDHP+HSA). Meridian covers 90% of individual premiums and 75% of dependent premiums on all plans. Our HDHP+HSA plan includes a $1,500 annual employer HSA contribution.\n\nDental: Two plans (Basic, Comprehensive). Orthodontia covered at 50% (lifetime max $2,500) on Comprehensive.\n\nVision: Annual allowance of $300 for frames/lenses or contact lenses.\n\nMental Health: Unlimited therapy sessions via Lyra Health, covered at 100%.\n\nRemote Work: 3 days in-office anchor days (Tue/Wed/Thu), 2 days flexible remote. Equipment stipend: $800 one-time for home office setup, plus $50/month internet reimbursement.`,
      },
      {
        id: "c5",
        num: 5,
        title: "Performance & Growth",
        readMins: 3,
        summary:
          "Bi-annual performance reviews, OKRs set in the first 30 days, and strong internal mobility after 18 months — over 40% of open roles are filled internally through the Meridian Academy.",
        body: `Performance reviews occur twice a year (June and December). Your manager will set 3–5 OKRs with you in your first 30 days. Mid-year reviews are developmental; year-end reviews determine compensation changes effective January 1.\n\nInternal mobility is strongly encouraged after 18 months in role. Over 40% of open positions are filled internally. The Meridian Academy offers 200+ courses, including a fully-funded CFA prep programme.\n\nPromotions at Meridian are never zero-sum. We celebrate team achievements in our quarterly all-hands and calibrate compensation on team outcomes, not individual stack ranking. Our culture is built on psychological safety — quarterly anonymous surveys are reviewed by the CEO and results are shared company-wide within two weeks.`,
      },
    ],
  },

  "ReleaseNotes.docx": {
    chapters: [
      {
        id: "c1",
        num: 1,
        title: "Version 4.2.0 — Overview",
        readMins: 2,
        summary:
          "Version 4.2.0 is the largest feature release since the 4.0 relaunch, shipping the AI Co-pilot, Knowledge Hub v2, and Workflow Automation GA. Minimum API version 2024-09.",
        body: `Release date: 12 June 2026\nRelease type: Minor (backward-compatible feature additions + bug fixes)\nMinimum API version: 2024-09\n\nVersion 4.2.0 is the largest feature release since the 4.0 platform relaunch. The headline addition is the AI Co-pilot, which provides inline AI assistance across the entire product surface. Knowledge Hub v2 introduces vector-search-powered retrieval and a new document intelligence pipeline. Workflow Automation exits beta and is now generally available for all plan tiers.\n\nSaaS customers receive this update automatically on June 18, 2026 between 02:00–04:00 UTC. Self-hosted customers should follow the upgrade guide in Chapter 5.`,
      },
      {
        id: "c2",
        num: 2,
        title: "AI Co-pilot",
        readMins: 3,
        summary:
          "The AI Co-pilot surfaces contextual assistance across every workflow — natural-language search, inline prompt suggestions, one-click flow-node generation, and document hover summaries — powered by Claude claude-sonnet-4-6.",
        body: `The AI Co-pilot surfaces contextual assistance in every major workflow. Powered by Claude claude-sonnet-4-6, the co-pilot supports:\n\n• Natural-language search across all your data, agents, flows, and documents\n• Inline suggestions while composing agent prompts\n• One-click generation of flow nodes from plain-English descriptions\n• Automatic summarisation of Knowledge Hub documents on hover\n\nCo-pilot is enabled by default on Professional and Enterprise plans. Starter plans receive 50 free co-pilot queries per month, after which queries are metered at $0.004 each.\n\nData privacy: co-pilot queries are processed in the same region as your workspace data. Query content and responses are retained for 30 days for debugging purposes, configurable to zero retention on Enterprise plans.`,
      },
      {
        id: "c3",
        num: 3,
        title: "Knowledge Hub v2",
        readMins: 4,
        summary:
          "Knowledge Hub v2 replaces keyword search with dense vector retrieval backed by pgvector, achieving a 34% improvement in MRR@10, with new document intelligence, per-hub access controls, and 15-minute cloud sync.",
        body: `Knowledge Hub v2 replaces the previous keyword-search index with a dense vector retrieval pipeline backed by a managed pgvector store. Changes include:\n\n• Semantic search with cross-encoder reranking (MRR@10 improvement: +34% on our internal benchmark)\n• Document intelligence: automatic extraction of tables, charts, and structured data from PDFs\n• Hub-level access controls: per-hub viewer/editor roles separate from workspace-level permissions\n• Cloud connector sync: OneDrive and Google Drive sources now sync on a 15-minute polling interval (previously 4 hours)\n\nExisting hubs are automatically migrated to v2 indexing over a 48-hour background process starting at activation. During migration, search results may mix v1 and v2 scores. A migration_status field on the Hub API response indicates progress.`,
      },
      {
        id: "c4",
        num: 4,
        title: "Bug Fixes & Breaking Changes",
        readMins: 3,
        summary:
          "Fixes a high-severity reflected XSS in agent name rendering (CVE-2026-1192) and four UX bugs. Two breaking changes affect the /v1/flows endpoint and the knowledge_hub.search() SDK method signature.",
        body: `CVE-2026-1192 (High) — Fixed reflected XSS in the agent name field; names are now HTML-escaped before rendering in the breadcrumb.\n\n• Fixed: Uploading files > 10 MB to Knowledge Hub showed success toast but silently failed\n• Fixed: Date picker in workflow scheduler showed incorrect timezone for users with UTC+ offset\n• Fixed: Marketplace "Install" button remained disabled after successful authentication\n• Fixed: Export to PDF truncated tables wider than 80 columns\n\nBreaking changes:\n\n1. The /v1/flows endpoint no longer accepts the legacy nodes array format. Migrate to the steps format documented in the API changelog.\n\n2. The knowledge_hub.search() SDK method signature has changed: the k parameter is renamed top_k for consistency with the REST API.\n\nWebhook payloads now include a signature header (X-Aziron-Signature-256). Consumers must validate this header; requests failing validation will return HTTP 401 starting from version 4.3.0.`,
      },
      {
        id: "c5",
        num: 5,
        title: "Upgrade Guide",
        readMins: 2,
        summary:
          "SaaS customers require no action. Self-hosted customers must pull the 4.2.0 image, run database migrations, and restart all services following the four-step process.",
        body: `Cloud (SaaS) customers: no action required. Updates roll out automatically starting 18 June 2026 between 02:00–04:00 UTC. Expected downtime: zero (rolling deployment).\n\nSelf-hosted customers:\n1. Back up your database before upgrading\n2. Run: docker pull aziron/platform:4.2.0\n3. Apply migrations: docker exec aziron-api rails db:migrate\n4. Restart all services: docker-compose restart\n\nFull migration notes: docs.aziron.com/upgrade/4.2.0\n\nIf you encounter issues, the support team is available 24/7 during the upgrade window at support@aziron.com. Enterprise customers have a dedicated upgrade call available — contact your CSM to schedule.`,
      },
    ],
  },

  "pg11-images-3.epub": {
    chapters: [
      {
        id: "c1",
        num: 1,
        title: "Down the Rabbit-Hole",
        readMins: 6,
        summary:
          "Alice, bored by the bank, follows a White Rabbit with a pocket-watch down a rabbit-hole, tumbling through a long fall into a strange underground hall with a tiny locked door leading to a beautiful garden.",
        body: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"\n\nSo she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.\n\nThere was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be too late!" — but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it.\n\nIn another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down what seemed to be a very deep well.`,
      },
      {
        id: "c2",
        num: 2,
        title: "The Pool of Tears",
        readMins: 5,
        summary:
          "Having grown to an enormous size and then shrunk again, Alice weeps a pool of tears and finds herself swimming alongside a Mouse and various birds, all trying to get dry after the flood.",
        body: `"Curiouser and curiouser!" cried Alice. "Now I'm opening out like the largest telescope that ever was! Good-bye, feet!" For when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off.\n\n"Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can."\n\nJust at this moment her head struck against the roof of the hall: in fact she was now rather more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.\n\nPoor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.\n\nShe went on shedding gallons of tears, until there was a large pool all around her, about four inches deep and reaching half down the hall. After a time she heard a little pattering of feet in the distance, and she hastily dried her eyes to see what was coming.`,
      },
      {
        id: "c3",
        num: 3,
        title: "A Caucus-Race and a Long Tale",
        readMins: 5,
        summary:
          "The dripping creatures on the bank hold a Caucus-Race to get dry — everyone runs in a circle and everyone wins. The Mouse attempts to bore them dry by telling a long, winding historical tale.",
        body: `They were indeed a queer-looking party that assembled on the bank — the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.\n\nThe first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life.\n\n"What I was going to say," said the Dodo in an offended tone, "was, that the best thing to get us dry would be a Caucus-race."\n\n"What is a Caucus-race?" said Alice.\n\n"Why," said the Dodo, "the best way to explain it is to do it." First it marked out a race-course, in a sort of circle, and then all the party were placed along the course, here and there. There was no "One, two, three, and away!" but they began running when they liked, and left off when they liked, so that it was not easy to know when the race was over.\n\nHowever, when they had been running half an hour or so, and were quite dry again, the Dodo suddenly called out "The race is over!" and they all crowded round it, panting, and asking, "But who has won?"`,
      },
      {
        id: "c4",
        num: 4,
        title: "The White Rabbit Sends in a Little Bill",
        readMins: 6,
        summary:
          "Alice stumbles into the White Rabbit's house, grows enormous after drinking a mystery bottle, and the Rabbit's servants attempt to extract her by sending a small lizard named Bill down the chimney.",
        body: `It was the White Rabbit, trotting slowly back again, and looking anxiously about as it went, as if it had lost something; and she heard it muttering to itself "The Duchess! The Duchess! Oh my dear paws! Oh my fur and whiskers! She'll get me executed, as sure as ferrets are ferrets! Where can I have dropped them, I wonder?"\n\nAlice guessed in a moment that it was looking for the fan and the pair of white kid gloves, and she very good-naturedly began hunting about for them, but they were nowhere to be seen — everything seemed to have changed since her swim in the pool, and the great hall, with the glass table and the little door, had vanished completely.\n\nVery soon the Rabbit noticed Alice, as she went hunting about, and called out to her in an angry tone, "Why, Mary Ann, what are you doing out here? Run home this moment, and fetch me a pair of gloves and a fan! Quick, now!"\n\nAnd Alice was so much frightened that she ran off at once in the direction it pointed to, without trying to explain the mistake it had made.\n\n"He took me for his housemaid," she said to herself as she ran. "How surprised he'll be when he finds out who I am!"`,
      },
      {
        id: "c5",
        num: 5,
        title: "Advice from a Caterpillar",
        readMins: 5,
        summary:
          "A large Caterpillar sitting on a mushroom smoking a hookah asks Alice 'Who are you?' — a question she finds surprisingly difficult to answer after all the changes she has been through.",
        body: `The Caterpillar and Alice looked at each other for some time in silence: at last the Caterpillar took the hookah out of its mouth, and addressed her in a languid, sleepy voice.\n\n"Who are you?" said the Caterpillar.\n\nThis was not an encouraging opening for a conversation. Alice replied, rather shyly, "I — I hardly know, sir, just at present — at least I know who I was when I got up this morning, but I think I must have been changed several times since then."\n\n"What do you mean by that?" said the Caterpillar sternly. "Explain yourself!"\n\n"I can't explain myself, I'm afraid, sir," said Alice, "because I'm not myself, you see."\n\n"I don't see," said the Caterpillar.\n\n"I'm afraid I can't put it more clearly," Alice replied very politely, "for I can't understand it myself to begin with; and being so many different sizes in a day is very confusing."\n\n"It isn't," said the Caterpillar.\n\n"Well, perhaps your feelings may be different," said Alice; "all I know is, it would feel very queer to me."\n\n"You!" said the Caterpillar contemptuously. "Who are you?"`,
      },
      {
        id: "c6",
        num: 6,
        title: "Pig and Pepper",
        readMins: 6,
        summary:
          "Alice visits the Duchess's chaotic house, where the cook adds far too much pepper to the soup, the baby turns into a pig, and the Cheshire Cat appears — grinning and fading at will.",
        body: `For a minute or two she stood looking at the house, and wondering what to do next, when suddenly a footman in livery came running out of the wood — she considered him to be a footman because he was in livery: otherwise, judging by his face only, she would have called him a fish — and rapped loudly at the door with his knuckles.\n\nIt was opened by another footman in livery, with a round face, and large eyes like a frog; and both footmen, Alice noticed, had powdered hair that curled all over their heads.\n\nThe Fish-Footman began by producing from under his arm a great letter, nearly as large as himself, and this he handed over to the other, saying, in a solemn tone, "For the Duchess. An invitation from the Queen to play croquet."\n\nThe Frog-Footman repeated, in the same solemn tone, only changing the order of the words a little, "From the Queen. An invitation for the Duchess to play croquet."\n\nThen they both bowed low, and their curls got entangled together. Alice laughed so much at this, that she had to run back into the wood for fear of their hearing her.`,
      },
    ],
  },
};

// ─── Synthetic chapter generator ─────────────────────────────────────────────
// Produces readable placeholder chapters for any document that isn't in
// CONTENT_MAP, keyed loosely on the filename and type.

function inferTopicFromName(name = "") {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();

  const lower = stem.toLowerCase();
  if (lower.includes("policy") || lower.includes("polic")) return { topic: stem, domain: "policy" };
  if (lower.includes("onboard") || lower.includes("welcome")) return { topic: stem, domain: "onboarding" };
  if (lower.includes("report") || lower.includes("quarterly") || lower.includes("annual")) return { topic: stem, domain: "report" };
  if (lower.includes("manual") || lower.includes("guide") || lower.includes("handbook")) return { topic: stem, domain: "guide" };
  if (lower.includes("release") || lower.includes("changelog") || lower.includes("notes")) return { topic: stem, domain: "release-notes" };
  if (lower.includes("contract") || lower.includes("agreement") || lower.includes("sla")) return { topic: stem, domain: "contract" };
  if (lower.includes("research") || lower.includes("study") || lower.includes("analysis")) return { topic: stem, domain: "research" };
  if (lower.includes("spec") || lower.includes("requirement") || lower.includes("prd")) return { topic: stem, domain: "spec" };
  if (lower.includes("finance") || lower.includes("budget") || lower.includes("forecast")) return { topic: stem, domain: "finance" };
  if (lower.includes("training") || lower.includes("course") || lower.includes("learn")) return { topic: stem, domain: "training" };
  return { topic: stem, domain: "general" };
}

const DOMAIN_CHAPTERS = {
  policy: (topic) => [
    {
      title: "Purpose & Scope",
      readMins: 2,
      summary: `This policy establishes the principles and expectations governing ${topic.toLowerCase()}. It applies to all employees, contractors, and stakeholders operating under the organisation's remit.`,
      body: `This document sets out the framework for ${topic.toLowerCase()} within the organisation. It defines the responsibilities of individuals, teams, and leadership to ensure consistent, compliant, and effective practices across all functions.\n\nThe policy applies to all permanent employees, fixed-term contractors, agency staff, and third-party vendors who interact with organisational systems, data, or processes. Exceptions must be approved in writing by the relevant policy owner.\n\nThis version supersedes all previous iterations. The policy owner is responsible for reviewing and updating this document on an annual basis or following any material change in regulatory requirements.`,
    },
    {
      title: "Key Principles",
      readMins: 3,
      summary: `The policy is underpinned by five core principles: accountability, transparency, fairness, proportionality, and continuous improvement. Each principle guides how the policy is applied in practice.`,
      body: `**Accountability** — Every individual is responsible for understanding and adhering to this policy. Managers are accountable for ensuring their teams are trained and compliant.\n\n**Transparency** — Decision-making processes must be documented and accessible to relevant stakeholders. Audit trails are maintained for all policy-governed activities.\n\n**Fairness** — The policy is applied consistently, without bias or preferential treatment. Escalation mechanisms ensure any perceived unfairness can be addressed promptly.\n\n**Proportionality** — Controls and consequences are proportionate to the risk or severity of any breach. Minor deviations are handled through guidance; material breaches through formal procedures.\n\n**Continuous Improvement** — Policy effectiveness is measured through periodic reviews, incident reports, and stakeholder feedback. Lessons learned are incorporated into subsequent revisions.`,
    },
    {
      title: "Roles & Responsibilities",
      readMins: 2,
      summary: `Clear ownership of policy obligations is assigned across three tiers: the Policy Owner (strategic), Line Managers (operational), and Individual Contributors (compliance).`,
      body: `**Policy Owner** — Maintains the document, coordinates the annual review cycle, and escalates systemic issues to the relevant governance committee.\n\n**Line Managers** — Ensure team members understand their obligations, complete required training, and report any incidents or near-misses in a timely manner.\n\n**Individual Contributors** — Read, understand, and comply with this policy. Raise concerns through the designated channel without fear of retaliation.\n\n**Compliance & Legal** — Provide guidance on regulatory interpretation, review proposed changes, and maintain records of policy sign-offs.`,
    },
    {
      title: "Procedures & Controls",
      readMins: 3,
      summary: `Operational procedures translate policy principles into specific, repeatable steps. Controls are designed to prevent breaches before they occur and detect them promptly when they do.`,
      body: `Procedures associated with this policy are maintained in the operational runbook linked from the policy register. The following controls are in force:\n\n1. **Access controls** — Permissions are granted on a least-privilege basis and reviewed quarterly.\n2. **Audit logging** — All material actions are logged with timestamp, user identity, and action taken. Logs are retained for a minimum of 24 months.\n3. **Training requirements** — All in-scope personnel must complete the mandatory training module within 30 days of hire and annually thereafter.\n4. **Incident reporting** — Any suspected breach must be reported within 24 hours using the incident management portal. A root-cause analysis is required for all confirmed breaches.\n5. **Third-party assessments** — Vendors handling in-scope data or processes are subject to an annual risk assessment.`,
    },
    {
      title: "Review & Enforcement",
      readMins: 2,
      summary: `The policy is subject to annual review and may be updated mid-cycle in response to regulatory changes. Breaches are subject to disciplinary action proportionate to severity.`,
      body: `**Review Schedule** — This policy is reviewed annually by the Policy Owner in collaboration with Legal and Compliance. An extraordinary review may be triggered by a material regulatory change, a significant breach, or a strategic business change.\n\n**Enforcement** — Breaches of this policy may result in disciplinary action up to and including termination of employment or contract, and referral to relevant regulatory authorities where required by law.\n\n**Appeals** — Individuals subject to formal enforcement action may appeal through the standard HR process. The appeal must be submitted within 10 working days of the decision.\n\n**Document History** — Version history is maintained in the policy register. All changes are reviewed and approved by the Policy Owner before publication.`,
    },
  ],
  onboarding: (topic) => [
    {
      title: "Welcome & Overview",
      readMins: 2,
      summary: `A warm introduction to the organisation — its mission, values, and what new team members can expect in their first days and weeks.`,
      body: `Welcome to the team. This document is designed to help you settle in quickly, understand how we work, and start contributing with confidence.\n\nOur organisation's mission is simple: to build products and services that genuinely improve the lives of the people we serve. That mission shapes every decision — from how we hire, to how we build, to how we support each other.\n\nOver the coming pages, you'll find practical guidance on your first week, how to set up your tools, who to reach out to, and what success looks like in your role. Don't try to absorb everything at once — your manager and onboarding buddy are here to help.`,
    },
    {
      title: "Your First Week",
      readMins: 3,
      summary: `A structured week-one schedule covering IT setup, team introductions, mandatory compliance training, and a clear understanding of your initial goals.`,
      body: `**Day 1** — Collect your access credentials from IT. Attend the all-hands new-hire orientation. Meet your onboarding buddy for lunch. Complete the welcome survey.\n\n**Day 2–3** — Shadow key team members to understand current projects. Complete the mandatory compliance training modules. Set up your development environment (if applicable).\n\n**Day 4** — 1-on-1 with your manager to discuss 30/60/90-day goals. Review team OKRs and understand where your role contributes.\n\n**Day 5** — Join the weekly team standup. Write your first brief (a short document describing your understanding of your role and immediate priorities). Share with your manager for feedback.\n\nBy end of week one, you should know who the key stakeholders are, have access to all essential tools, and have a clear picture of your first project.`,
    },
    {
      title: "Tools & Systems",
      readMins: 2,
      summary: `An overview of the standard toolset — communication, project management, documentation, and access management — including setup instructions and best practices.`,
      body: `**Communication** — We use Slack for day-to-day messaging. Keep your status up to date. Prefer async communication for non-urgent matters. Use @mentions sparingly.\n\n**Project Management** — All work is tracked in Linear. Your manager will add you to the relevant teams. Use labels and due dates consistently.\n\n**Documentation** — Notion is our single source of truth for team knowledge. Search before creating to avoid duplication. Every project should have a brief and a decision log.\n\n**Access Management** — Access is managed through the IT portal. Request additional tools via the standard request form. All requests require manager approval and a business justification.`,
    },
    {
      title: "Culture & Values",
      readMins: 2,
      summary: `The values that define how the team works — collaboration, ownership, transparency, and continuous learning — and what they look like in practice.`,
      body: `**Collaboration** — We work best when we work together. Share work in progress early. Give feedback kindly and receive it openly. The best ideas come from diverse perspectives.\n\n**Ownership** — Take responsibility for your work from start to finish. Don't wait to be asked — if you see a problem, address it. Escalate when you're stuck, but try first.\n\n**Transparency** — Share context freely. Write decisions down. If you're unsure whether something should be shared, it probably should be.\n\n**Continuous Learning** — We grow by doing and by reflecting. Mistakes are learning opportunities. Every team member has access to a learning budget — use it.`,
    },
    {
      title: "Benefits & Support",
      readMins: 2,
      summary: `An overview of the benefits package, mental health support, learning budget, and how to access the HR team for guidance throughout your time here.`,
      body: `**Benefits** — Full details of your benefits package are available in the HR portal. Key highlights include comprehensive health coverage, an annual wellness allowance, and flexible working arrangements.\n\n**Mental Health** — We take mental health seriously. All employees have access to confidential counselling through our Employee Assistance Programme. Your wellbeing comes first.\n\n**Learning Budget** — Each employee receives an annual learning budget. Approved uses include online courses, conferences, books, and certifications. Submit requests through the L&D portal.\n\n**HR Support** — The People team is available for any questions about your employment, benefits, or workplace concerns. Reach them via the internal Slack channel or in person during their drop-in hours.`,
    },
  ],
  report: (topic) => [
    {
      title: "Executive Summary",
      readMins: 2,
      summary: `A high-level overview of the period's key findings, headline metrics, and strategic implications. The summary is designed for senior stakeholders who need the essential picture quickly.`,
      body: `This report covers the performance, findings, and strategic context for the period under review. The headline metrics show progress against plan, with notable outperformance in core operational areas and some headwinds in external market conditions.\n\nKey findings:\n• Revenue and volume metrics were ahead of target by 8%, driven by strong performance in the primary segment.\n• Operating costs were within plan; efficiency initiatives delivered £1.2M in savings ahead of schedule.\n• Customer satisfaction scores improved for the third consecutive period, reaching an all-time high of 78 NPS.\n• One material risk was identified relating to supply chain dependencies; mitigation actions are underway.\n\nThe recommendations in this report focus on accelerating the efficiency programme, deepening investment in the highest-performing segment, and resolving the supply chain risk within the next quarter.`,
    },
    {
      title: "Performance Analysis",
      readMins: 4,
      summary: `Detailed analysis of performance against plan, including revenue, cost, customer, and operational metrics. Variances are explained and root causes identified.`,
      body: `**Revenue Performance**\nTotal revenue for the period was £24.8M, 8% ahead of plan (£23.0M). Growth was driven primarily by volume expansion in the enterprise segment (+14%) and price increases in the mid-market segment (+3%). Consumer segment revenue was flat versus plan.\n\n**Cost Analysis**\nTotal operating costs were £18.1M, 2% below plan. Savings were concentrated in procurement (£0.8M) and facilities (£0.4M). These were partially offset by higher-than-planned headcount costs in product and engineering, reflecting accelerated hiring to support the growth strategy.\n\n**Customer Metrics**\nNet Promoter Score: 78 (+6 vs prior period). Customer retention rate: 94.2% (+1.1pp). Average revenue per customer: £4,200 (+5% vs prior period). Time to first value for new customers: 18 days (−4 days vs plan).\n\n**Operational KPIs**\nSLA compliance: 99.4%. Incident rate: 0.8 per 1,000 customer interactions (−15% vs prior period). Deployment frequency: 14 per week (target: 12). Mean time to recovery: 23 minutes (target: 30).`,
    },
    {
      title: "Market & Competitive Context",
      readMins: 3,
      summary: `An assessment of the external environment — market conditions, competitor activity, and macro factors — that contextualises performance and informs forward-looking strategy.`,
      body: `The market environment during the period was characterised by continued demand growth in enterprise segments, offset by pricing pressure in the mid-market driven by increased competitive activity from two new entrants.\n\n**Competitive Landscape**\nThree main competitors made material moves in the period: Competitor A launched a lower-priced tier targeting the mid-market; Competitor B announced a strategic partnership with a major cloud provider; Competitor C exited a non-core product line, potentially releasing customers to the market.\n\n**Macro Factors**\nInflationary pressures on wages and infrastructure costs are expected to persist for at least two further quarters. Currency fluctuations had a marginal negative impact on reported revenue (−0.4%). Regulatory change in the primary market is anticipated in H2; legal and compliance teams are monitoring closely.\n\n**Strategic Implications**\nThe competitive dynamic reinforces the importance of moving up-market where differentiation is stronger and price sensitivity lower. The Competitor C exit represents a short-term acquisition opportunity.`,
    },
    {
      title: "Risks & Issues",
      readMins: 2,
      summary: `A review of the material risks identified in the period, their likelihood and impact, and the mitigation actions in progress or planned.`,
      body: `**Risk Register Summary**\n\n| Risk | Likelihood | Impact | Owner | Status |\n|------|-----------|--------|-------|--------|\n| Supply chain dependency (Tier 1 vendor) | Medium | High | COO | Mitigation in progress |\n| Regulatory change H2 | High | Medium | General Counsel | Monitoring |\n| Key person dependency (CTO) | Low | High | CEO | Succession plan in place |\n| Cybersecurity (third-party access) | Medium | High | CISO | Audit scheduled Q3 |\n\n**Material Issue — Supply Chain**\nThe Tier 1 vendor supplying critical infrastructure components notified us of potential capacity constraints for Q3. A dual-sourcing strategy is being implemented with an alternative vendor approved and onboarded. Contingency stock has been procured to cover a 6-week gap if needed.`,
    },
    {
      title: "Outlook & Recommendations",
      readMins: 2,
      summary: `Forward-looking guidance for the next period, including revised targets, strategic priorities, and specific recommendations for leadership action.`,
      body: `**Revised Guidance**\nBased on current trading and pipeline, guidance for the next period is as follows: Revenue £25.5–26.5M (previous plan: £25.0M). Operating costs £18.5M (unchanged). EBITDA margin 25–27% (previous plan: 26%).\n\n**Strategic Priorities**\n1. Accelerate enterprise segment expansion — increase enterprise sales headcount by 4 in Q3.\n2. Launch mid-market retention programme — targeted pricing and success packages to defend against competitive pressure.\n3. Resolve supply chain risk — dual-sourcing fully operational by end of Q3.\n4. Prepare for regulatory change — submit consultation response by deadline; update compliance framework.\n\n**Board Recommendations**\n• Approve incremental enterprise headcount.\n• Commission independent cyber audit.\n• Receive update on supply chain mitigation at next board meeting.`,
    },
  ],
  "release-notes": (topic) => [
    {
      title: "Release Overview",
      readMins: 2,
      summary: `An overview of the release — what changed, why, and what customers and developers need to know before upgrading.`,
      body: `This release delivers a set of improvements, bug fixes, and new capabilities across the platform. The changes reflect feedback collected from customers, internal product reviews, and performance monitoring.\n\nAll changes are backward-compatible unless explicitly noted in the Breaking Changes section. Customers on managed cloud deployments will receive this update automatically during the next maintenance window. Self-hosted customers should review the upgrade guide before proceeding.\n\nHighlights:\n• Performance improvements across core API endpoints (p95 latency −18%).\n• New configuration options for advanced deployment scenarios.\n• Eight bug fixes, including two high-priority issues reported by customers.\n• One deprecation notice for a legacy API method (end-of-life in 6 months).`,
    },
    {
      title: "New Features",
      readMins: 3,
      summary: `Detailed descriptions of all new capabilities included in this release, including usage guidance and configuration options.`,
      body: `**Feature 1 — Enhanced Search**\nSearch results now incorporate semantic ranking in addition to keyword matching. Relevance scores are exposed via the API for custom ranking logic. No configuration required; opt-out available via feature flag.\n\n**Feature 2 — Bulk Operations API**\nA new batch endpoint allows up to 500 operations per request, significantly reducing API call overhead for high-volume integrations. See the API reference for request format and rate limits.\n\n**Feature 3 — Webhook Retry Logic**\nWebhooks now retry failed deliveries up to 5 times with exponential backoff. Retry status and delivery logs are visible in the dashboard. Configurable per endpoint.\n\n**Feature 4 — Custom Metadata Fields**\nAdministrators can now define up to 20 custom metadata fields per resource type. Fields support string, number, boolean, and date types. Searchable via the query API.`,
    },
    {
      title: "Bug Fixes",
      readMins: 2,
      summary: `A full list of bugs resolved in this release, including severity, affected versions, and any workarounds that were previously in use.`,
      body: `**Critical**\n• Fixed: Race condition in concurrent write operations could result in data loss in rare circumstances. Affected versions: 3.1.0–3.4.2. Customers who experienced this issue should contact support.\n\n**High**\n• Fixed: Export function silently failed for datasets > 50,000 rows. Now returns a clear error and triggers an async job.\n• Fixed: API rate limit counter was not reset correctly at the top of each hour, causing false throttling for some customers.\n\n**Medium**\n• Fixed: Timezone handling in scheduled reports used server timezone instead of user-configured timezone.\n• Fixed: Pagination token expired after 1 hour instead of the documented 24 hours.\n• Fixed: Search filters were not applied when using the keyboard shortcut to submit.\n\n**Low**\n• Fixed: Minor visual alignment issue in the settings sidebar on narrow viewports.\n• Fixed: Tooltip text was truncated on file name fields longer than 40 characters.`,
    },
    {
      title: "Breaking Changes & Deprecations",
      readMins: 2,
      summary: `Actions required for customers upgrading from previous versions, including deprecated methods, changed defaults, and removed endpoints.`,
      body: `**Breaking Change — Default Sort Order**\nThe default sort order for list endpoints has changed from creation date (ascending) to last-modified date (descending) to align with common usage patterns. Clients that rely on the previous default must now pass sort=created_at:asc explicitly.\n\n**Deprecation — Legacy Authentication Header**\nThe X-API-Key header is deprecated in favour of Bearer token authentication. The header will continue to work for 6 months; it will be removed in version 4.0.0. Migrate to Authorization: Bearer <token> at your earliest convenience.\n\n**Removed — v1 Search Endpoint**\nThe /v1/search endpoint was deprecated 12 months ago and has now been removed. All clients must use /v2/search. The v2 endpoint is a superset of v1; no functionality has been lost.\n\n**Changed Default — TLS Version**\nMinimum TLS version is now 1.2 (previously 1.0). Clients using TLS 1.0 or 1.1 must upgrade.`,
    },
    {
      title: "Upgrade Guide",
      readMins: 2,
      summary: `Step-by-step instructions for upgrading from the previous version, including pre-flight checks, the upgrade sequence, and post-upgrade verification steps.`,
      body: `**Cloud (Managed) Customers**\nNo action required. The upgrade is applied automatically during the next maintenance window (see your account dashboard for the scheduled time). A notification will be sent 48 hours in advance.\n\n**Self-Hosted Customers**\n\n1. Back up your database before starting.\n2. Review the breaking changes section above and assess impact on your integration.\n3. Pull the new image: docker pull platform:latest\n4. Run database migrations: ./scripts/migrate.sh\n5. Restart all services: docker-compose up -d\n6. Verify health: curl https://your-domain/health should return HTTP 200.\n\n**Rollback**\nIf you encounter issues post-upgrade, roll back by pulling the previous image tag and restoring your database backup. Detailed rollback instructions are in the operations runbook.\n\n**Support**\nEnterprise customers have access to a dedicated upgrade support channel. All customers can raise issues via the standard support portal.`,
    },
  ],
  guide: (topic) => [
    {
      title: "Introduction",
      readMins: 2,
      summary: `An overview of what this guide covers, who it's for, and how to get the most out of it.`,
      body: `This guide is designed to help you understand and apply ${topic.toLowerCase()} effectively. Whether you're approaching this topic for the first time or looking to deepen an existing understanding, this document provides the context, procedures, and best practices you need.\n\nThe guide is structured to be read sequentially, though individual sections can be referenced independently. Practical examples are included throughout to illustrate key points. Where relevant, links to related documentation and additional resources are provided.\n\nIf you encounter an issue not covered here, or if guidance becomes outdated, please raise it through the standard feedback channel so the document can be updated.`,
    },
    {
      title: "Getting Started",
      readMins: 3,
      summary: `Prerequisites, initial setup, and the first steps needed to begin working with the subject matter effectively.`,
      body: `Before you begin, ensure you have:\n• The necessary access permissions (contact your manager or IT if unsure)\n• Completed any prerequisite training modules\n• Reviewed the relevant policy documents that govern this area\n\n**Initial Setup**\n1. Access the relevant system using your standard credentials.\n2. Complete the initial configuration steps as documented in the setup checklist.\n3. Verify your configuration by running the validation procedure described in Section 3.\n4. If you encounter errors during setup, consult the troubleshooting section or raise a ticket with the support team.\n\n**First Steps**\nStart with the most common use case before exploring advanced scenarios. The worked examples in Section 4 are designed to give you hands-on experience in a low-risk environment before working with live data or systems.`,
    },
    {
      title: "Core Concepts",
      readMins: 4,
      summary: `A clear explanation of the fundamental concepts, terminology, and mental models that underpin this subject area.`,
      body: `Understanding the core concepts will help you apply this guide correctly across different scenarios. The following terms and ideas are foundational.\n\n**Key Concepts**\n\n*Concept 1: Structure and Organisation* — The subject matter is organised hierarchically. Top-level elements govern the behaviour of sub-elements. Changes at the top level cascade downwards unless overridden.\n\n*Concept 2: Lifecycle Management* — Every artefact in this domain has a lifecycle: created, active, deprecated, archived. Understanding where something is in its lifecycle determines what operations are valid.\n\n*Concept 3: Permissions and Ownership* — Access is governed by the permissions model. Ownership determines who can modify or delete a resource. Permissions are inherited by default and can be overridden at any level.\n\n*Concept 4: Audit and Traceability* — All material changes are logged. The audit trail is immutable. This is both a compliance requirement and a practical debugging tool.`,
    },
    {
      title: "Step-by-Step Procedures",
      readMins: 4,
      summary: `Detailed, numbered procedures for the most common tasks — each designed to be followed sequentially with clear decision points.`,
      body: `**Procedure 1: Standard Workflow**\n1. Initiate the process by selecting the appropriate option from the main menu.\n2. Complete the required fields. Fields marked with an asterisk (*) are mandatory.\n3. Attach any supporting documentation in the formats specified.\n4. Submit for review. You will receive a confirmation notification within 2 working hours.\n5. Once approved, the system will automatically proceed to the next stage. If rejected, review the feedback provided and resubmit.\n\n**Procedure 2: Exception Handling**\n1. Identify the exception type using the classification table.\n2. Follow the exception-specific procedure documented in Appendix A.\n3. Log the exception in the incident register with full details.\n4. Notify the relevant stakeholder within the required timeframe.\n\n**Procedure 3: Escalation**\n1. If a standard procedure cannot resolve the issue, escalate to Tier 2 support.\n2. Provide a clear description of the problem, steps already taken, and any error messages.\n3. Track the escalation ticket until resolution and confirm the issue is resolved before closing.`,
    },
    {
      title: "Troubleshooting & FAQs",
      readMins: 3,
      summary: `Answers to the most frequently asked questions and solutions to the most common problems encountered when working in this area.`,
      body: `**Q: I can't access the system even with valid credentials.**\nA: First, confirm your account is active and your permissions haven't expired. Check with IT that your role includes the necessary access group. If the issue persists, raise an IT access request.\n\n**Q: I submitted something incorrectly. Can I reverse it?**\nA: Reversals are possible within the first 30 minutes of submission. Use the "withdraw" option in your pending items view. After 30 minutes, contact the process owner directly.\n\n**Q: I'm not receiving notifications.**\nA: Check your notification settings in your profile. Ensure your email address is up to date. If email notifications are enabled and you're still not receiving them, check your spam folder and whitelist the notification sender address.\n\n**Q: The system shows different data than what I'd expect.**\nA: Data is refreshed on a schedule (typically every 15–30 minutes). If stale data persists beyond an hour, raise a support ticket with the specific record reference so the team can investigate.\n\n**Q: Who do I contact for help beyond this guide?**\nA: The first point of contact is your line manager. For technical issues, raise a ticket via the IT helpdesk. For policy questions, contact the relevant policy owner listed in the policy register.`,
    },
  ],
  spec: (topic) => [
    {
      title: "Overview & Objectives",
      readMins: 2,
      summary: `The purpose of this specification, the problem it solves, and the measurable outcomes that will indicate success.`,
      body: `This document specifies the requirements for ${topic.toLowerCase()}. It serves as the authoritative reference for design, engineering, and QA teams throughout the development and delivery lifecycle.\n\n**Problem Statement**\nThe current state presents a gap between user expectations and available capabilities. This specification defines the scope and requirements to close that gap in a way that is technically feasible, commercially viable, and aligned with product strategy.\n\n**Success Metrics**\n• User task completion rate ≥ 92%\n• Time-on-task reduction of ≥ 25% vs baseline\n• Zero Sev-1 incidents in the first 30 days post-launch\n• NPS uplift of ≥ 5 points in the affected user segment\n\n**Out of Scope**\nThis specification does not cover adjacent systems unless explicitly called out. Dependencies on out-of-scope systems are documented in the dependencies section.`,
    },
    {
      title: "User Stories & Acceptance Criteria",
      readMins: 4,
      summary: `A structured set of user stories capturing the needs of each user persona, each paired with clear, testable acceptance criteria.`,
      body: `**Persona 1: Power User**\n\n*Story 1.1* — As a power user, I want to perform bulk operations on multiple records simultaneously, so that I can complete high-volume tasks without repetitive manual work.\n*Acceptance Criteria:*\n- User can select up to 500 records via checkbox or "Select All"\n- Bulk actions available: edit, archive, export, assign\n- Operation completes within 5 seconds for 500 records\n- Success/failure summary displayed on completion\n\n**Persona 2: Administrator**\n\n*Story 2.1* — As an administrator, I want to configure role-based access at a granular level, so that I can enforce least-privilege access across my organisation.\n*Acceptance Criteria:*\n- Roles can be created, edited, and deleted by admins with the IAM permission\n- Permissions are configurable at the resource type level (read/write/delete)\n- Changes take effect within 60 seconds without requiring user re-authentication\n\n**Persona 3: Read-Only Viewer**\n\n*Story 3.1* — As a viewer, I want to export data in standard formats, so that I can analyse it in my preferred tools.\n*Acceptance Criteria:*\n- Export available in CSV, JSON, and XLSX\n- Export respects the viewer's data access permissions\n- Files available for download for 48 hours after generation`,
    },
    {
      title: "Technical Requirements",
      readMins: 3,
      summary: `Non-functional requirements covering performance, scalability, security, and reliability targets that the implementation must meet.`,
      body: `**Performance**\n• API endpoints must respond within 300ms at p95 under expected load\n• Page load time (LCP) must not exceed 2.5 seconds on a standard broadband connection\n• Database queries must complete within 100ms at p99 under normal load\n\n**Scalability**\n• The system must handle 10× current peak load without degradation\n• Auto-scaling must trigger within 60 seconds of a threshold breach\n• State must not be held in memory in a way that prevents horizontal scaling\n\n**Security**\n• All data in transit encrypted with TLS 1.2 or higher\n• At-rest encryption using AES-256\n• Authentication via SSO (SAML 2.0 / OIDC). MFA mandatory for admin roles\n• Penetration test required before production launch\n\n**Reliability**\n• Target uptime: 99.9% (excluding scheduled maintenance)\n• RTO: 1 hour; RPO: 15 minutes\n• Circuit breakers implemented for all third-party dependencies`,
    },
    {
      title: "Design Specifications",
      readMins: 3,
      summary: `UI/UX design requirements, component specifications, and interaction patterns — linking to design artefacts where relevant.`,
      body: `Design artefacts are maintained in the Figma project linked from the project brief. This section captures the key design requirements and constraints for engineering reference.\n\n**Layout Principles**\n• All new surfaces must comply with the design system (component library v3.x)\n• Responsive breakpoints: 320px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide)\n• Minimum touch target size: 44×44px\n• Colour contrast: WCAG 2.1 AA minimum (AAA preferred for critical UI)\n\n**Key Interaction Patterns**\n• Optimistic UI updates: assume success, revert on error with toast notification\n• Empty states: every list/table must have a designed empty state with a clear CTA\n• Loading states: skeleton screens preferred over spinners for content areas\n• Error states: inline errors for form validation; modal for blocking errors; toast for non-blocking\n\n**Accessibility**\n• Full keyboard navigation required\n• Screen reader compatibility tested with NVDA (Windows) and VoiceOver (macOS/iOS)\n• Focus order must follow logical reading order`,
    },
    {
      title: "Dependencies & Risks",
      readMins: 2,
      summary: `External dependencies that could affect delivery, along with the key risks and mitigation strategies.`,
      body: `**Dependencies**\n\n| Dependency | Owner | Risk | Mitigation |\n|-----------|-------|------|------------|\n| Auth service API v3 | Platform team | Release scheduled Q3 | Parallel track; fallback to v2 if delayed |\n| Design system v3.2 | Design team | In progress | Use v3.1 components; upgrade post-launch |\n| Third-party geocoding API | Vendor | SLA 99.5% | Cache responses; graceful degradation |\n| Legal review — data exports | Legal | 2-week turnaround | Submit request immediately |\n\n**Key Risks**\n\n*Risk 1: Scope creep* — The requirements in this document have been agreed with stakeholders. Changes after sign-off require a formal change request and impact assessment.\n\n*Risk 2: Performance at scale* — Load testing must be completed in staging before production launch. If targets are not met, launch must be delayed.\n\n*Risk 3: Third-party API reliability* — See dependency table. Graceful degradation paths are documented in the technical design.`,
    },
  ],
  finance: (topic) => [
    {
      title: "Financial Summary",
      readMins: 2,
      summary: `A concise summary of the financial position, headline figures, and key movements for the period under review.`,
      body: `This document presents the financial analysis for the period under review. All figures are presented in the functional currency unless otherwise stated. Comparatives are provided against the prior period and against the approved plan.\n\n**Headline Figures**\n• Revenue: £24.8M (Plan: £23.0M, +8% vs plan; Prior period: £22.1M, +12% YoY)\n• Gross Margin: 62.4% (Plan: 61.0%; Prior period: 60.8%)\n• EBITDA: £6.2M (Plan: £5.5M; Prior period: £5.1M)\n• Cash and Equivalents: £18.4M (unchanged from prior period)\n• Headcount: 187 FTE (Plan: 182; Prior period: 174)\n\nThe period was characterised by strong top-line growth exceeding plan, driven by enterprise segment performance. Cost control remained disciplined, resulting in above-plan margin delivery.`,
    },
    {
      title: "Revenue Analysis",
      readMins: 3,
      summary: `A breakdown of revenue by segment, product, and geography, with variance analysis against plan and prior period.`,
      body: `**By Segment**\n• Enterprise: £14.2M (+14% vs plan) — Driven by 8 new enterprise wins and expansion in existing accounts\n• Mid-Market: £7.6M (flat vs plan) — Price increases offset volume softness from competitive activity\n• SMB/Consumer: £3.0M (−5% vs plan) — Deliberate reduction in investment; segment is being repositioned\n\n**By Product Line**\n• Core Platform: £18.9M (76% of total revenue)\n• Professional Services: £3.8M (15%)\n• Add-On Modules: £2.1M (9%)\n\n**By Geography**\n• Domestic: £16.2M (65%)\n• International: £8.6M (35%) — International growth of 18% YoY reflects successful expansion in two new markets\n\n**ARR and Retention**\n• Annual Recurring Revenue: £28.4M (+16% YoY)\n• Net Revenue Retention: 112%\n• Gross Revenue Retention: 94.2%`,
    },
    {
      title: "Cost Analysis",
      readMins: 3,
      summary: `A detailed review of operating costs, including headcount, infrastructure, and discretionary spend, with variance analysis.`,
      body: `**Total Operating Costs: £18.6M (Plan: £17.5M, +6.3%)**\n\nThe variance to plan is primarily driven by accelerated hiring in Engineering and Product ahead of a major product release. This investment is expected to drive revenue uplift from Q3 onwards.\n\n**Cost of Revenue: £9.4M (38% gross margin impact)**\n• Infrastructure: £4.2M — Scaling with revenue growth; efficiency work in flight\n• Hosting and third-party: £2.1M\n• Customer Success headcount: £3.1M\n\n**Operational Expenditure: £9.2M**\n• Engineering and Product: £5.1M (55% of OpEx)\n• Sales and Marketing: £2.4M (26%)\n• G&A: £1.7M (19%)\n\n**Headcount Costs**\nTotal headcount costs were £11.8M, representing 63% of total operating costs. Average cost per FTE was £63K (Plan: £62K). Headcount additions during the period: 13 (8 Engineering, 3 Sales, 2 Customer Success).`,
    },
    {
      title: "Cash Flow & Balance Sheet",
      readMins: 2,
      summary: `Cash flow statement highlights, working capital movements, and a summary of the balance sheet position at period end.`,
      body: `**Cash Flow Summary**\n• Opening cash: £17.9M\n• Operating cash inflow: £5.8M\n• Investing outflows: −£3.2M (primarily product development capitalisation and equipment)\n• Financing activities: £0 (no new debt or equity in the period)\n• Closing cash: £20.5M\n\n**Working Capital**\n• Accounts Receivable: £4.2M (DSO: 38 days vs target 35 days)\n• Deferred Revenue: £6.8M (+12% vs prior period, reflecting prepaid annual contracts)\n• Accounts Payable: £1.9M (DPO: 28 days, within terms)\n\n**Balance Sheet Highlights**\n• Total Assets: £34.8M\n• Total Liabilities: £8.2M\n• Net Assets: £26.6M\n\nThe balance sheet remains strong with no debt and a cash runway well in excess of 24 months at current burn rate.`,
    },
    {
      title: "Forecast & Outlook",
      readMins: 2,
      summary: `Updated financial forecasts for the remainder of the financial year, with key assumptions and sensitivities.`,
      body: `**Updated Full-Year Forecast**\n• Revenue: £98.5M–102.0M (original plan: £95.0M)\n• EBITDA: £24.0M–26.0M (original plan: £22.5M)\n• Headcount (year-end): 205 FTE (original plan: 195)\n• Capital expenditure: £12.0M (unchanged)\n\n**Key Assumptions**\n1. Enterprise momentum continues; pipeline conversion rate holds at 32%\n2. No material deterioration in mid-market competitive environment\n3. Product release in Q3 achieves planned adoption within 90 days of launch\n4. No material FX headwinds beyond current spot rates\n\n**Sensitivities**\n• Revenue ±5% impact if enterprise conversion rate changes by ±5pp\n• EBITDA ±£1.5M impact if headcount additions are accelerated or deferred by one quarter\n• Revenue ±2% impact from a 5% adverse movement in the primary foreign exchange rate\n\n**Next Steps**\nThe CFO will present a detailed reforecast to the Board at the next meeting, incorporating H2 assumptions and any updated macro factors.`,
    },
  ],
  training: (topic) => [
    {
      title: "Learning Objectives",
      readMins: 2,
      summary: `A clear statement of what participants will know and be able to do upon completing this training module.`,
      body: `This training module is designed to build the knowledge and skills needed to perform effectively in this area. By the end of this module, participants will be able to:\n\n1. Explain the key concepts and terminology associated with ${topic.toLowerCase()}.\n2. Apply the correct procedures to the most common scenarios encountered in their role.\n3. Identify when a situation requires escalation and follow the correct escalation path.\n4. Use the relevant tools and systems confidently to complete tasks independently.\n5. Recognise compliance obligations and explain the consequences of non-compliance.\n\n**Who This Module Is For**\nThis module is mandatory for all employees in roles that interact with this area. It should be completed within 30 days of starting in a relevant role and refreshed annually.\n\n**Estimated Duration**\nApproximately 45–60 minutes, including exercises and knowledge checks.`,
    },
    {
      title: "Key Concepts",
      readMins: 4,
      summary: `The essential concepts, terminology, and mental models needed to understand and apply the subject matter correctly.`,
      body: `Before diving into procedures and practical application, it's important to build a solid conceptual foundation. This section introduces the key terms and ideas you'll encounter throughout the module and in your day-to-day work.\n\n**Concept 1: Purpose and Context**\nUnderstanding why this area exists helps you make better decisions in ambiguous situations. The practices and procedures in this module exist to protect customers, colleagues, and the organisation — not as bureaucratic obstacles.\n\n**Concept 2: Risk and Proportionality**\nNot all situations carry the same risk. Good judgment means applying more scrutiny and care to higher-risk situations, and moving efficiently through lower-risk ones. The risk framework in this area helps you make that assessment consistently.\n\n**Concept 3: Your Role in the System**\nYou are one part of a larger system of controls. Your contribution — doing your part correctly and raising concerns when something seems wrong — is essential to the system working as intended.\n\n**Concept 4: When in Doubt, Ask**\nNo procedure covers every scenario. When you encounter an unusual situation, the right response is to pause and ask rather than to guess. The escalation contacts and resources available to you are listed in the appendix.`,
    },
    {
      title: "Core Procedures",
      readMins: 4,
      summary: `Step-by-step guidance for the procedures you'll use most frequently, with decision points and worked examples.`,
      body: `**Standard Procedure**\n\nThe following procedure applies to the most common scenario you'll encounter in this area. Follow each step in order. Do not skip steps unless the procedure explicitly allows it.\n\n1. **Prepare** — Gather the information and materials needed before starting. Attempting to complete the procedure without the necessary inputs wastes time and increases error risk.\n\n2. **Verify** — Confirm that the situation meets the criteria for this procedure. If it doesn't, consult the decision tree to identify the correct procedure.\n\n3. **Execute** — Follow the steps precisely. Document your actions as you go, not retrospectively.\n\n4. **Review** — Before finalising, check your work against the checklist provided. A second pair of eyes is recommended for high-stakes activities.\n\n5. **Record** — Log the outcome in the designated system. Include all required fields. Incomplete records are treated as non-compliance.\n\n6. **Follow up** — If the procedure generates downstream actions (notifications, approvals, handoffs), initiate them promptly. Don't assume someone else will.`,
    },
    {
      title: "Compliance & Common Mistakes",
      readMins: 3,
      summary: `The regulatory and policy requirements relevant to this area, and the most frequently observed errors — with guidance on how to avoid them.`,
      body: `**Compliance Requirements**\nThis area is governed by both internal policy and external regulatory requirements. Failure to comply can result in disciplinary action, regulatory sanction, and reputational damage. The key obligations are:\n\n• Maintain accurate records of all activities\n• Complete mandatory training within the required timeframes\n• Report suspected breaches or anomalies within 24 hours\n• Do not share access credentials or bypass system controls\n• Follow the data handling requirements appropriate to the classification of information you're working with\n\n**Common Mistakes**\n\n*Mistake 1: Incomplete documentation* — The most frequent compliance gap. Always complete all required fields at the time of the activity.\n\n*Mistake 2: Assuming someone else has done it* — Responsibility doesn't transfer automatically. If you're unsure, check explicitly.\n\n*Mistake 3: Applying the wrong procedure* — Take an extra 30 seconds to confirm you're using the right procedure for the situation. The cost of a wrong procedure is much higher than the cost of checking.\n\n*Mistake 4: Delaying escalation* — If something seems wrong, raise it immediately. Problems are almost always easier to resolve when caught early.`,
    },
    {
      title: "Knowledge Check & Resources",
      readMins: 2,
      summary: `A short knowledge check to confirm understanding, followed by a reference list of supporting resources and contacts.`,
      body: `**Knowledge Check**\n\n1. What are the two conditions that must be met before starting the standard procedure?\n→ The required information must be gathered, and the situation must meet the criteria for that procedure.\n\n2. Within how many hours must a suspected breach be reported?\n→ 24 hours.\n\n3. What should you do if you encounter a situation the procedure doesn't cover?\n→ Pause, consult the escalation contacts listed in the appendix, and do not guess.\n\n4. Who is responsible for completing required training?\n→ Every individual in a relevant role, supported by their line manager.\n\n**Reference Resources**\n• Policy documents: [Policy Register]\n• Operational runbook: [Runbook link]\n• Training record system: [LMS link]\n• Escalation contacts: [Contact list]\n• Incident reporting portal: [Portal link]\n• Feedback on this module: [Feedback form]\n\nIf you've completed this module and have questions not addressed here, speak with your line manager or contact the relevant team directly.`,
    },
  ],
  contract: (topic) => [
    {
      title: "Parties & Recitals",
      readMins: 2,
      summary: `Identifies the parties to the agreement, the background context, and the purpose this agreement is intended to serve.`,
      body: `This agreement is entered into between the parties identified in the cover sheet. The parties wish to set out their respective rights and obligations in connection with the subject matter described herein.\n\n**Background**\nThe parties have agreed that it is in their mutual interest to formalise the terms of their relationship in a binding written agreement. This document supersedes any prior written or oral agreements between the parties on the same subject matter.\n\n**Purpose**\nThis agreement governs the provision of services, the use of deliverables, and the respective obligations of each party. It is intended to provide clarity and certainty to both parties and to establish a fair and workable framework for the relationship.`,
    },
    {
      title: "Scope of Services",
      readMins: 3,
      summary: `A precise description of the services to be delivered, the deliverables, timelines, and any exclusions from scope.`,
      body: `**Services**\nThe Provider agrees to deliver the services described in Schedule 1 (Statement of Work). Services will be delivered in accordance with the specifications, standards, and timelines set out in that schedule.\n\n**Deliverables**\nAll deliverables are listed in Schedule 1. The Client's acceptance criteria for each deliverable are also set out in that schedule. Acceptance is deemed given if no written objection is raised within 10 business days of delivery.\n\n**Exclusions**\nThe following are expressly excluded from scope unless agreed in writing: (a) services not described in Schedule 1; (b) work required as a result of the Client's failure to meet its obligations; (c) services required due to a Force Majeure event.\n\n**Changes to Scope**\nEither party may request a change to the scope by submitting a written change request. No change takes effect until both parties have signed a change order specifying the amended scope, timeline, and any price adjustment.`,
    },
    {
      title: "Commercial Terms",
      readMins: 2,
      summary: `Pricing, payment terms, invoicing schedule, and provisions for price adjustments and disputed invoices.`,
      body: `**Pricing**\nThe fees payable under this agreement are set out in Schedule 2. Fees are exclusive of applicable taxes, which the Client is responsible for paying.\n\n**Payment Terms**\nInvoices are payable within 30 calendar days of the invoice date. Late payments accrue interest at 4% per annum above the base rate of the Bank of England, calculated daily.\n\n**Invoicing**\nInvoices will be issued monthly in arrears unless otherwise specified in Schedule 2. Each invoice must reference this agreement and include sufficient detail to allow the Client to verify the charges.\n\n**Disputed Invoices**\nIf the Client disputes any part of an invoice, they must notify the Provider in writing within 10 business days, specifying the amount in dispute and the reason. Undisputed amounts remain payable by the due date. The parties will use good faith efforts to resolve the dispute within 20 business days.`,
    },
    {
      title: "Intellectual Property & Confidentiality",
      readMins: 2,
      summary: `Ownership of intellectual property created under the agreement, licensing terms, and obligations of confidentiality that bind both parties.`,
      body: `**IP Ownership**\nAll pre-existing intellectual property belonging to either party remains the property of that party. Intellectual property created specifically for the Client under this agreement ("Work Product") vests in the Client upon full payment of the applicable fees.\n\n**Licence**\nThe Provider grants the Client a non-exclusive, worldwide, royalty-free licence to use any Provider IP incorporated in the Work Product solely to the extent necessary to use the Work Product for the purpose described in Schedule 1.\n\n**Confidentiality**\nEach party agrees to keep confidential all Confidential Information of the other party and to use it only in connection with this agreement. Confidential Information does not include information that is publicly available, independently developed, or required to be disclosed by law.\n\nConfidentiality obligations survive termination of this agreement for a period of five years.`,
    },
    {
      title: "Term, Termination & Governing Law",
      readMins: 2,
      summary: `The duration of the agreement, termination rights, consequences of termination, and the governing law and dispute resolution mechanism.`,
      body: `**Term**\nThis agreement commences on the Effective Date and continues until the completion of the services described in Schedule 1, unless terminated earlier in accordance with this section.\n\n**Termination**\nEither party may terminate this agreement immediately upon written notice if the other party commits a material breach and (if the breach is capable of remedy) fails to remedy it within 30 calendar days of written notice.\n\nThe Client may terminate for convenience upon 60 calendar days' written notice. In such cases, the Client is liable for fees for services delivered up to the termination date plus reasonable costs incurred in connection with the wind-down.\n\n**Consequences of Termination**\nUpon termination, each party must return or destroy the other's Confidential Information. Provisions that by their nature survive termination (including IP, confidentiality, and governing law) continue in force.\n\n**Governing Law**\nThis agreement is governed by the laws of England and Wales. Disputes will first be addressed through good-faith negotiation. If unresolved within 30 days, disputes will be referred to binding arbitration under the ICC Rules.`,
    },
  ],
  research: (topic) => [
    {
      title: "Abstract & Introduction",
      readMins: 2,
      summary: `An overview of the research question, methodology, and key findings — providing readers with the essential context to evaluate the significance of the work.`,
      body: `This document presents research into ${topic.toLowerCase()}. The study was motivated by a gap in the existing body of knowledge and a practical need to inform decision-making in the field.\n\n**Research Question**\nThe central question guiding this research is: how and to what extent does the subject matter influence outcomes in the relevant domain?\n\n**Methodology Overview**\nThe research employed a mixed-methods approach, combining quantitative analysis of structured data with qualitative insights gathered through interviews and case studies. The methodology is described in detail in Section 3.\n\n**Key Findings**\nThe research identified three primary findings, each with implications for theory and practice. These are summarised in the abstract and developed in full in the findings section. The implications for practitioners and for future research are discussed in the final section.`,
    },
    {
      title: "Literature Review",
      readMins: 4,
      summary: `A critical review of the existing literature, identifying what is known, what is contested, and where the gaps lie that this research addresses.`,
      body: `The existing literature on this topic spans multiple disciplines and methodological traditions. This review synthesises the most relevant prior work and situates the current study within that context.\n\n**Established Knowledge**\nA body of research has established the fundamental relationship between the key variables. The most cited work in this area demonstrated a statistically significant correlation (r=0.68, p<0.001) between the primary independent and dependent variables across a range of settings.\n\n**Contested Areas**\nSubsequent work has challenged several of the assumptions in the foundational studies. Critics have argued that the relationship is moderated by contextual factors that were not controlled for in the original studies, and that the effect size may be smaller in real-world conditions than in laboratory settings.\n\n**Gaps in the Literature**\nDespite significant research activity, two gaps remain. First, most studies have focused on large organisations; the applicability of findings to smaller entities is unclear. Second, longitudinal studies are sparse — most existing work is cross-sectional, limiting causal inference.\n\nThis study addresses both gaps through a longitudinal design and a sample that includes entities across the size spectrum.`,
    },
    {
      title: "Methodology",
      readMins: 3,
      summary: `A full description of the research design, data collection methods, sample characteristics, and analytical approach.`,
      body: `**Research Design**\nThis study used a longitudinal mixed-methods design. Quantitative data was collected at three time points (T1, T2, T3) over an 18-month period. Qualitative data was collected through semi-structured interviews at T1 and T3.\n\n**Sample**\nThe quantitative sample comprised 214 organisations across four sectors. Organisations were recruited through professional networks and stratified by size (small: <50 employees; medium: 50–250; large: >250). Response rates were 78% at T1, 71% at T2, and 68% at T3.\n\nThe qualitative sample comprised 24 participants selected purposively to ensure representation across sectors, sizes, and roles.\n\n**Data Collection**\nQuantitative data was collected via validated survey instruments. Qualitative data was collected through 60–90 minute interviews, conducted remotely and recorded with participant consent. Transcripts were verified by participants.\n\n**Analysis**\nQuantitative data was analysed using structural equation modelling (SEM) in R. Qualitative data was analysed using thematic analysis following the Braun and Clarke (2006) framework. Findings were triangulated across methods.`,
    },
    {
      title: "Findings",
      readMins: 4,
      summary: `The main findings of the research, presented systematically with supporting evidence from both quantitative and qualitative data.`,
      body: `**Finding 1: Primary Effect Confirmed**\nThe quantitative analysis confirmed a significant positive relationship between the primary variables (β=0.54, p<0.001, 95% CI [0.41, 0.67]). This finding is consistent with the foundational literature but with a smaller effect size than previously reported, supporting the critique that prior studies overstated the effect.\n\n**Finding 2: Moderation by Context**\nOrganisational size significantly moderated the primary relationship. The effect was strongest in large organisations (β=0.71) and weakest in small organisations (β=0.28), suggesting that the resources and capabilities needed to translate the independent variable into outcomes scale with organisational size.\n\n**Finding 3: Temporal Dynamics**\nLongitudinal analysis revealed that the relationship strengthened over time. The effect was modest at T1, grew at T2, and reached peak strength at T3. This suggests an implementation lag — organisations need time to realise the benefits of the independent variable.\n\n**Qualitative Themes**\nThematic analysis of interviews identified three reinforcing themes: (1) leadership alignment as a prerequisite for effect, (2) resource availability as a key enabler, and (3) cultural readiness as the most frequently cited barrier. These themes map onto the quantitative moderation results and provide explanatory depth.`,
    },
    {
      title: "Discussion & Conclusions",
      readMins: 3,
      summary: `Interpretation of the findings, their theoretical and practical implications, the study's limitations, and directions for future research.`,
      body: `**Interpretation**\nThe findings advance understanding in three ways. First, they confirm the primary theoretical relationship while providing a more accurate estimate of effect size. Second, they identify organisational size as a key boundary condition that should be incorporated into future theoretical models. Third, the longitudinal design provides new evidence of a temporal dynamic that cross-sectional studies cannot detect.\n\n**Practical Implications**\nFor practitioners, the key implication is that the independent variable is most impactful in larger, resource-rich organisations. Smaller organisations considering investment in this area should expect a longer implementation period and lower initial returns, and should ensure leadership alignment before committing resources.\n\n**Limitations**\nThis study has several limitations. The sample, while geographically diverse, is concentrated in English-speaking markets; generalisability to other cultural contexts is uncertain. Self-report measures introduce social desirability bias. The moderating variables examined are not exhaustive.\n\n**Future Research**\nFuture work should: (1) replicate the study in non-English-speaking markets; (2) examine additional moderators, particularly industry sector and competitive environment; (3) extend the longitudinal window to examine whether the effect continues to grow beyond 18 months or reaches a plateau.`,
    },
  ],
  general: (topic) => [
    {
      title: "Introduction",
      readMins: 2,
      summary: `An overview of the document's purpose, audience, and how it is structured.`,
      body: `This document provides information and guidance related to ${topic.toLowerCase()}. It is intended to serve as a reference for those who work in or interact with this area.\n\nThe content has been structured to progress from foundational context through to practical application. Readers who are already familiar with the background may wish to skip ahead to the procedures and guidance sections.\n\nFeedback on this document is welcomed and should be submitted through the standard document management process. The document owner is responsible for reviewing and updating the content in response to material changes.`,
    },
    {
      title: "Background & Context",
      readMins: 3,
      summary: `The context that explains why this document exists — the business need, strategic relevance, and any historical factors that shape the current situation.`,
      body: `Understanding the background to this document helps frame the guidance and decisions it contains. The current situation is the result of deliberate choices made in response to identified needs, and an appreciation of that history helps readers apply the guidance with good judgment rather than mechanical compliance.\n\nThe primary driver for this document was a recognised need to bring together existing practice, apply lessons learned from experience, and establish a clear reference point for new and existing team members alike.\n\nThe approach taken here reflects consultation with relevant stakeholders and draws on recognised good practice in the field. Where tradeoffs were made, the reasoning is documented in the relevant sections.`,
    },
    {
      title: "Key Information & Guidance",
      readMins: 4,
      summary: `The main substantive content — the facts, principles, and guidance that readers need to act on.`,
      body: `**Core Principles**\nThe guidance in this document is built on a small number of core principles that should inform how it is applied in situations not explicitly covered.\n\n1. *Clarity over complexity* — When in doubt, choose the simpler, clearer path. Complexity should only be introduced when it genuinely serves a purpose.\n\n2. *Documented decisions* — Material decisions should be written down at the time they are made, not reconstructed retrospectively.\n\n3. *Proportionality* — The level of effort and rigour applied should be proportionate to the stakes involved.\n\n4. *Continuous improvement* — No document or process is perfect. Feedback and improvement are both expected and welcomed.\n\n**Practical Application**\nThe guidance in this section is most useful when it is applied thoughtfully rather than mechanically. The goal is good outcomes, and the procedures are a means to that end. When a procedure would lead to a clearly poor outcome, that is a signal to escalate rather than to proceed blindly.`,
    },
    {
      title: "Procedures & Actions",
      readMins: 3,
      summary: `Step-by-step procedures for the most common activities, including decision points and escalation guidance.`,
      body: `The following procedures cover the scenarios most frequently encountered in this area. Each procedure is presented as a numbered sequence. Decision points are indicated clearly.\n\n**Standard Procedure**\n1. Confirm that the situation falls within the scope of this procedure.\n2. Gather the required information and documentation before starting.\n3. Follow each step in sequence. If you reach a point where the next step is unclear, stop and seek guidance.\n4. Document your actions and the outcome.\n5. Complete any required follow-up actions within the specified timeframes.\n\n**Exception Handling**\nExceptions — situations that don't fit the standard procedure — should be handled as follows:\n1. Document the nature of the exception.\n2. Consult the escalation contacts listed in this document.\n3. Follow the guidance provided.\n4. Record the outcome and any precedent set for future reference.\n\n**Escalation**\nEscalate whenever you are uncertain, when a situation has not been encountered before, or when the stakes are high enough to warrant a second opinion.`,
    },
    {
      title: "Reference & Contacts",
      readMins: 1,
      summary: `Quick-reference information, key contacts, and links to related documents and systems.`,
      body: `**Key Contacts**\n• Document Owner — responsible for maintaining this document and answering questions about its application\n• Line Manager — first point of contact for day-to-day queries\n• Subject Matter Expert — available for complex or unusual situations\n• Support / Helpdesk — for system or tool-related issues\n\n**Related Documents**\n• Policy Register — the authoritative list of policies that govern this area\n• Operational Runbook — detailed technical procedures\n• Training Materials — associated learning resources\n• Decision Log — historical record of material decisions made under this framework\n\n**Review History**\nThis document is reviewed on an annual cycle or when material changes occur. The current version number and review date are shown in the document header. Queries about previous versions should be directed to the document owner.`,
    },
  ],
};

function generateFallbackChapters(file) {
  const fileName = file?.name ?? "this document";

  // If the file is genuinely not yet ready, show the processing state
  const isProcessing =
    file?.indexStatus === "processing" ||
    file?.fileStatus === "processing" ||
    file?.syncStatus === "loading";

  if (isProcessing) {
    return [
      {
        id: "c1",
        num: 1,
        title: fileName,
        readMins: null,
        summary: "This document is being processed. Full reading view will be available shortly.",
        body: null,
      },
    ];
  }

  // For demo/placeholder files (source === "demo") with generic hub-slug names,
  // strip the numeric suffix to pick a domain
  const stem = fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
  const { topic, domain } = inferTopicFromName(fileName);
  const displayTopic = stem.length > 4 ? stem : topic;

  const chapterTemplates = (DOMAIN_CHAPTERS[domain] ?? DOMAIN_CHAPTERS.general)(displayTopic);

  return chapterTemplates.map((ch, i) => ({
    id: `c${i + 1}`,
    num: i + 1,
    ...ch,
  }));
}

function mergeChaptersForReading(chapters, fileName) {
  if (!chapters.length) return null;
  const docTitle = fileName?.replace(/\.[^.]+$/, "") ?? chapters[0].title;

  if (chapters.length === 1) {
    return { ...chapters[0], title: docTitle };
  }

  const body = chapters
    .filter((ch) => ch.body != null)
    .map((ch) => `**${ch.title}**\n\n${ch.body}`)
    .join("\n\n");

  return {
    ...chapters[0],
    id: "document",
    title: docTitle,
    summary: chapters.map((c) => c.summary).filter(Boolean).join(" "),
    body,
    readMins: chapters.reduce((sum, c) => sum + (c.readMins ?? 0), 0),
  };
}

// ─── Studio tools (mirrors KnowledgeHubWorkspaceView) ────────────────────────

const STUDIO_TOOLS = [
  { id: "summary",     label: "Summary",     icon: FileText,        bg: "bg-primary/10 text-primary" },
  { id: "mindmap",     label: "Mind Map",    icon: Network,         bg: "bg-chart-chart-4/15 text-chart-chart-4" },
  { id: "flashcards",  label: "Flashcards",  icon: Layers,          bg: "bg-warning/10 text-warning" },
  { id: "report",      label: "Report",      icon: ClipboardList,   bg: "bg-success/10 text-success" },
  { id: "datatable",   label: "Data Table",  icon: FileSpreadsheet, bg: "bg-chart-chart-3/15 text-chart-chart-3" },
];

function generateChapterStudioContent(toolId, fileName, chapter) {
  const title = chapter?.title ?? "this chapter";
  const fileBase = fileName?.replace(/\.[^.]+$/, "") ?? "Document";

  switch (toolId) {
    case "summary":
      return `# Summary — ${title}\n\n**Source:** ${fileBase}\n\n## Overview\n${chapter?.summary ?? ""}\n\n## Key Points\n- ${(chapter?.body ?? "").split("\n\n").slice(0, 3).map(p => p.slice(0, 80).trim()).join("\n- ")}\n\n## Conclusion\nThis chapter provides foundational context for the broader document. Cross-reference with adjacent chapters for complete coverage.`;

    case "flashcards":
      return `# Flashcards — ${title}\n\n**Source:** ${fileBase}\n\n---\n\n**Card 1**\nQ: What is the main topic of "${title}"?\nA: ${(chapter?.summary ?? "").slice(0, 100)}\n\n---\n\n**Card 2**\nQ: How many chapters does this document contain?\nA: Multiple chapters covering progressive depth on the subject.\n\n---\n\n**Card 3**\nQ: What action or knowledge does this chapter aim to convey?\nA: Understanding of ${title.toLowerCase()} and its implications for the overall subject matter.`;

    case "mindmap":
      return `# Mind Map — ${title}\n\n**Source:** ${fileBase}\n\n## Central Node\n${title}\n\n## Branch 1 — Core Concepts\n  ├── ${(chapter?.body ?? "").split(" ").slice(0, 4).join(" ")}…\n  └── Key definitions and terminology\n\n## Branch 2 — Supporting Details\n  ├── Evidence and examples\n  └── ${fileBase} context\n\n## Branch 3 — Implications\n  ├── Practical applications\n  └── Connections to other chapters\n\n## Branch 4 — Open Questions\n  ├── What remains unexplained?\n  └── Further reading suggestions`;

    case "report":
      return `# Report — ${title}\n\n**Source:** ${fileBase}  \n**Generated:** ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}\n\n## Executive Summary\n${chapter?.summary ?? ""}\n\n## Findings\n\n### Section Analysis\nThe chapter presents its material in a structured manner, progressing from foundational concepts to practical implications. The narrative is internally consistent and references the document's broader thesis.\n\n### Depth of Coverage\n- Conceptual clarity: **High**\n- Practical application: **Medium**\n- Cross-references: **Low** (self-contained)\n\n## Recommendations\n1. Pair with Chapter ${(chapter?.num ?? 1) + 1} for sequential understanding.\n2. Use the summary as a quick-reference card.\n3. Review open questions before moving forward.`;

    case "datatable":
      return `# Data Table — ${title}\n\n**Source:** ${fileBase}\n\n| Field | Value |\n|-------|-------|\n| Chapter | ${chapter?.num ?? 1} |\n| Title | ${title} |\n| Reading Time | ${chapter?.readMins ?? 3} min |\n| Word Count | ~${(chapter?.body ?? "").split(" ").length} |\n| Paragraphs | ${(chapter?.body ?? "").split("\n\n").length} |\n| Source File | ${fileName ?? "Unknown"} |\n| Summary Length | ${(chapter?.summary ?? "").split(" ").length} words |\n\n## Extracted Entities\n| Type | Value |\n|------|-------|\n| Topic | ${title} |\n| Document | ${fileBase} |\n| Context | Chapter ${chapter?.num} of document |`;

    default:
      return `# ${toolId} — ${title}\n\nGenerated from: ${fileBase}`;
  }
}

// ─── Suggested AI queries per chapter ────────────────────────────────────────

const SUGGESTED_QUERIES = [
  "Summarise and report back to contents",
  "What are the key takeaways?",
  "List any action items or next steps",
  "Explain this in simple terms",
];

function mockChapterReply(question, chapter, fileName) {
  const q = question.trim().toLowerCase();
  if (!q) {
    return `Ask a question about **${chapter.title}** and I'll answer from this chapter.`;
  }
  if (q.includes("summar") || q.includes("takeaway") || q.includes("key")) {
    return `**Key points from "${chapter.title}"**\n\n${chapter.summary}\n\nAsk a follow-up if you'd like more detail on any section.`;
  }
  if (q.includes("action") || q.includes("next step")) {
    return `Based on **${chapter.title}** in ${fileName}:\n\n• Review the chapter summary and cross-reference with adjacent sections.\n• Note any metrics or claims that need validation.\n• Share findings with your team if this chapter supports a decision.`;
  }
  if (q.includes("simple") || q.includes("explain")) {
    const plain = chapter.summary.split(".").slice(0, 2).join(".").trim();
    return `In plain terms — **${chapter.title}**:\n\n${plain}.`;
  }
  return `From **${chapter.title}** (Chapter ${chapter.num}):\n\n${chapter.summary}\n\nThis answer is drawn from the current chapter. Switch chapters or ask a more specific question for deeper detail.`;
}

function ChapterChatMessage({ message, sourceLabel, onCapture, showFeedbackActions = false }) {
  const [copied, setCopied] = useState(false);
  const plainText = message.text.replace(/\*\*(.*?)\*\*/g, "$1");

  if (message.role === "user") {
    return (
      <div className="flex w-full shrink-0 justify-end">
        <div className="max-w-[85%] rounded-[12px] rounded-tr-[4px] border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="whitespace-pre-line text-sm leading-5 text-foreground">{message.text}</p>
        </div>
      </div>
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(plainText).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex w-full shrink-0 flex-col items-start">
      <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border bg-card px-4 py-3">
        <p className="whitespace-pre-line text-sm leading-6 text-foreground">{plainText}</p>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy"}
          title={copied ? "Copied!" : "Copy"}
          onClick={handleCopy}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </button>
        {showFeedbackActions ? (
          <>
            <button
              type="button"
              aria-label="Good response"
              title="Good response"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ThumbsUp className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Bad response"
              title="Bad response"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ThumbsDown className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Regenerate"
              title="Regenerate"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => onCapture?.("save-note", message.text, sourceLabel)}
          title="Save as note"
          aria-label="Save as note"
          className="flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3" />
          Save as note
        </button>
        <ContentCaptureDropdown
          content={message.text}
          sourceLabel={sourceLabel}
          onCapture={onCapture}
          triggerTitle="More capture actions"
        />
      </div>
    </div>
  );
}

// ─── Document reading view (center panel) ─────────────────────────────────────

function ReadingMeta({ chapter }) {
  if (!chapter.readMins) return null;
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="size-3" />
        {chapter.readMins} min read
      </span>
    </div>
  );
}

function ChapterReaderView({ chapter, readingSourceLabel, canEdit, openSelectionMenu, scrollRef }) {
  // Fallback chapter (body === null) — document not yet indexed
  if (chapter?.body === null) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 px-8 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="size-8 text-muted-foreground/50" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              {chapter.summary?.includes("being processed")
                ? "Processing document…"
                : "Document stored"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {chapter.summary}
            </p>
          </div>
          {chapter.summary?.includes("being processed") && (
            <p className="text-xs text-muted-foreground">
              Check back shortly — this usually takes under a minute.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-8 py-10 pb-24">
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-foreground">
          {chapter?.title}
        </h1>

        <ReadingMeta chapter={chapter} />

        <div className="my-6 h-px w-12 bg-primary/30" />

        <div
          className="space-y-5"
          onContextMenu={(e) => canEdit && openSelectionMenu?.(e, null, readingSourceLabel)}
        >
          {(chapter?.body ?? "").split("\n\n").map((para, i) => (
            <p
              key={i}
              className="whitespace-pre-wrap text-[0.9375rem] leading-[1.8] text-foreground/85 selection:bg-primary/20"
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Right panel: Chapter tab ─────────────────────────────────────────────────

function ChapterTab({ chapter, fileName, onCapture, seedPrompt, onSeedPromptApplied }) {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      role: "ai",
      text: `You're on **${chapter.title}**. Ask questions about this chapter and I'll answer from its content.`,
    },
  ]);

  const chatSourceLabel = `${fileName ?? "Document"} · Chapter ${chapter.num}: ${chapter.title}`;

  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: `You're on **${chapter.title}**. Ask questions about this chapter and I'll answer from its content.`,
      },
    ]);
    setInput("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [chapter.id, chapter.title]);

  useEffect(() => {
    if (!seedPrompt?.trim()) return;
    setInput(seedPrompt);
    onSeedPromptApplied?.();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [seedPrompt, onSeedPromptApplied]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: mockChapterReply(q, chapter, fileName ?? "this document") },
      ]);
      setLoading(false);
    }, 700);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Conversation */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-4 py-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-border bg-muted">
            <Bot className="size-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">Conversation</p>
            <p className="truncate text-[10px] text-muted-foreground">
              Chapter {chapter.num}: {chapter.title}
            </p>
          </div>
          <button
            type="button"
            title="Clear conversation"
            aria-label="Clear conversation"
            onClick={() =>
              setMessages([
                {
                  role: "ai",
                  text: "Conversation cleared. Ask a new question about this chapter.",
                },
              ])
            }
            className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          <div className="flex-1" />
          {messages.map((msg, i) => (
            <ChapterChatMessage
              key={`${chapter.id}-${i}`}
              message={msg}
              sourceLabel={chatSourceLabel}
              onCapture={msg.role === "ai" ? onCapture : undefined}
            />
          ))}
          {loading && (
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex gap-1 rounded-[12px] rounded-tl-[4px] border border-border bg-card px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-muted"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        <div className="shrink-0 px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => send(q)}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] text-foreground/70 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
              >
                <Sparkles className="size-2.5 shrink-0 text-primary/60" />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt box — matches agent conversation panel */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_4px_24px_0_rgba(37,99,235,0.10)]">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about this chapter…"
                className="flex-1 bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  input.trim() && !loading
                    ? "border-border bg-primary text-primary-foreground hover:bg-primary"
                    : "cursor-not-allowed border-border bg-card text-foreground",
                )}
              >
                <Send size={14} />
              </button>
            </div>
            <div className="flex items-center gap-1 px-3 py-2">
              <span className="text-xs text-muted-foreground">Scope: This chapter</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Right panel: Studio tab ──────────────────────────────────────────────────

function StudioTab({ chapter, fileName, onCapture }) {
  const [activeTool, setActiveTool]   = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating]   = useState(false);
  const [output, setOutput]           = useState(null); // { toolId, content }
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    setActiveTool(null);
    setCustomPrompt("");
    setOutput(null);
    setGenerating(false);
    setCopied(false);
  }, [chapter?.id]);

  const studioSourceLabel = `${fileName ?? "Document"} · Studio · ${chapter?.title ?? "Chapter"}`;

  function handleToolClick(tool) {
    setActiveTool(tool);
    setCustomPrompt("");
    setOutput(null);
  }

  function handleGenerate() {
    if (!activeTool) return;
    setGenerating(true);
    setOutput(null);
    setTimeout(() => {
      let content = generateChapterStudioContent(activeTool.id, fileName, chapter);
      if (customPrompt.trim()) {
        content += `\n\n## Focus\n${customPrompt.trim()}`;
      }
      setOutput({
        toolId: activeTool.id,
        title: `${activeTool.label} — ${chapter?.title ?? "Chapter"}`,
        content,
      });
      setGenerating(false);
    }, 1400);
  }

  function handleCopy() {
    navigator.clipboard.writeText(output?.content ?? "").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([output?.content ?? ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output?.title?.replace(/[^\w\s-]/g, "") ?? "studio"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Tool grid */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <p className="mb-2.5 text-center text-[10px] text-muted-foreground">
          Select a tool to generate from this chapter
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {STUDIO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool?.id === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleToolClick(tool)}
                disabled={generating}
                className={cn(
                  "relative flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition-all",
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted/40",
                  generating && "cursor-not-allowed opacity-50",
                )}
              >
                <span className={cn("flex size-7 items-center justify-center rounded-lg", tool.bg)}>
                  <Icon className="size-3.5" />
                </span>
                <span className="text-[11px] font-semibold text-foreground leading-tight">{tool.label}</span>
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Config + output area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">

        {/* Config panel */}
        {activeTool && !generating && !output && (
          <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg", activeTool.bg)}>
                <activeTool.icon className="size-3" />
              </span>
              <p className="text-xs font-semibold text-foreground">Generate {activeTool.label}</p>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Using current chapter as source.
            </p>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={`Optional: focus on specific aspects…`}
              className="mb-2.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <activeTool.icon className="size-3.5" />
              Generate {activeTool.label}
            </button>
          </div>
        )}

        {/* Generating animation */}
        {generating && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Generating {activeTool?.label}…</p>
          </div>
        )}

        {/* Output */}
        {output && !generating && (
          <div className="rounded-xl border border-border bg-muted/10">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <p className="flex-1 truncate text-xs font-semibold text-foreground">{output.title}</p>
              <button
                type="button"
                title={copied ? "Copied!" : "Copy"}
                onClick={handleCopy}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
              </button>
              <button
                type="button"
                title="Download"
                onClick={handleDownload}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="size-3" />
              </button>
              <button
                type="button"
                title="Regenerate"
                onClick={handleGenerate}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="size-3" />
              </button>
              <ContentCaptureDropdown
                content={output.content}
                sourceLabel={studioSourceLabel}
                onCapture={onCapture}
                triggerClassName="size-6 rounded"
                triggerTitle="Capture generated content"
              />
            </div>
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-[11px] leading-relaxed text-foreground/85">
              {output.content}
            </pre>
          </div>
        )}

        {/* Empty hint */}
        {!activeTool && !generating && !output && (
          <p className="text-center text-[11px] text-muted-foreground/60 pt-2">
            Pick a tool above to generate content from this chapter.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Right panel: Details tab ─────────────────────────────────────────────────

function formatFileSize(kb) {
  if (!kb) return "—";
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function DetailsTab({
  file,
  hubLinks = [],
  hubs = [],
  onNavigateToHub,
  onLinkToHub,
  onLinkHubFileToHub,
  onUnlinkFromHub,
  onRemoveHubFile,
  onRemoveFromLibrary,
  onCreateHub,
  canEdit = true,
  canCreate = true,
}) {
  const detailRows = getSourceDetailRows(file ?? {});

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {getSourceDetailsTitle(file ?? {})}
        </p>
        <dl className="space-y-2 text-xs">
          {detailRows.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="max-w-[58%] truncate text-right font-medium text-foreground" title={String(value)}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mx-4 h-px bg-border" />

      <LinkedKnowledgeHubSection
        record={file}
        hubLinks={hubLinks}
        hubs={hubs}
        canEdit={canEdit}
        canCreate={canCreate}
        hubIcon={FileText}
        onNavigateToHub={onNavigateToHub}
        onLinkToHub={onLinkToHub}
        onLinkHubFileToHub={onLinkHubFileToHub}
        onUnlinkFromHub={onUnlinkFromHub}
        onRemoveHubFile={onRemoveHubFile}
        onCreateHub={onCreateHub}
      />

      {!file?.isLibraryDocument && hubLinks.length > 0 ? (
        <p className="mx-4 mb-4 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          This file is managed in its Knowledge Hub. Removing it here deletes it from the hub only.
        </p>
      ) : null}

      {canEdit ? (
        <div className="mt-auto border-t border-border px-4 py-4">
          {file?.isLibraryDocument ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRemoveFromLibrary?.()}
            >
              <Trash2 className="size-3.5" />
              Remove from library
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRemoveHubFile?.(file.hubId, file.id)}
            >
              <Trash2 className="size-3.5" />
              Remove from hub
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── Right panel: Notes tab ───────────────────────────────────────────────────

function noteSelectionKey(id) {
  return `note:${id}`;
}

function nodeSelectionKey(id) {
  return `node:${id}`;
}

function NotesTab({ notes, nodes, onCreateDocumentFromNotes }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const nodeItems = nodes.flatMap((node) =>
    (node.items ?? []).map((item) => ({ ...item, nodeTitle: node.title })),
  );

  const hasNotes = notes.length > 0;
  const hasNodeItems = nodeItems.length > 0;
  const hasSelectable = hasNotes || hasNodeItems;

  const allSelectionKeys = [
    ...notes.map((note) => noteSelectionKey(note.id)),
    ...nodeItems.map((item) => nodeSelectionKey(item.id)),
  ];
  const allSelected = hasSelectable && selectedKeys.size === allSelectionKeys.length;

  const selectedNotes = notes.filter((note) => selectedKeys.has(noteSelectionKey(note.id)));
  const selectedNodeItems = nodeItems.filter((item) =>
    selectedKeys.has(nodeSelectionKey(item.id)),
  );
  const selectedCount = selectedNotes.length + selectedNodeItems.length;

  function toggleSelection(key) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedKeys(new Set());
      return;
    }
    setSelectedKeys(new Set(allSelectionKeys));
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedKeys(new Set());
  }

  function handleCreateDocument() {
    if (selectedCount === 0) return;
    onCreateDocumentFromNotes?.(selectedNotes, selectedNodeItems);
    exitSelectMode();
  }

  function renderCheckbox(selected) {
    return (
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background",
        )}
      >
        {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Saved notes
          </p>
          {hasSelectable ? (
            selectMode ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
                <button
                  type="button"
                  onClick={exitSelectMode}
                  className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="rounded-md px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Select
              </button>
            )
          ) : null}
        </div>
        {hasNotes ? (
          <ul className="mb-5 flex flex-col gap-2">
            {notes.map((note) => {
              const key = noteSelectionKey(note.id);
              const selected = selectedKeys.has(key);
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectMode) toggleSelection(key);
                    }}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selectMode && "cursor-pointer",
                      selected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-background",
                      selectMode && !selected && "hover:border-primary/30 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {selectMode ? renderCheckbox(selected) : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{note.title}</p>
                        {note.sourceLabel ? (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {note.sourceLabel}
                          </p>
                        ) : null}
                        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/80">
                          {note.body}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mb-5 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
            No notes yet. Select text or use capture actions on AI responses to save insights here.
          </p>
        )}

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Workspace nodes
        </p>
        {hasNodeItems ? (
          <ul className="flex flex-col gap-2">
            {nodeItems.map((item) => {
              const key = nodeSelectionKey(item.id);
              const selected = selectedKeys.has(key);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectMode) toggleSelection(key);
                    }}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selectMode && "cursor-pointer",
                      selected
                        ? "border-primary/50 bg-primary/5"
                        : "border-primary/20 bg-primary/5",
                      selectMode && !selected && "hover:border-primary/30 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {selectMode ? renderCheckbox(selected) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary">
                          <Network className="size-3" />
                          {item.nodeTitle}
                        </div>
                        {item.sourceLabel ? (
                          <p className="mt-1 truncate text-[10px] text-muted-foreground">
                            {item.sourceLabel}
                          </p>
                        ) : null}
                        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/80">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
            Attach content to Key Insights, Research Notes, Action Items, or Reports using Save to
            Existing Node.
          </p>
        )}
      </div>

      {selectMode && selectedCount > 0 ? (
        <div className="shrink-0 border-t border-border bg-card px-4 py-3">
          <Button type="button" size="sm" className="w-full gap-1.5 text-xs" onClick={handleCreateDocument}>
            <FileText className="size-3.5" />
            Create document ({selectedCount})
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ─── Right panel (tabbed: Chapter | Studio | Notes | Details) ─────────────────

function RightPanel({
  chapter,
  fileName,
  file,
  hubLinks,
  hubs,
  notes,
  nodes,
  tab,
  onTabChange,
  onNavigateToHub,
  onLinkToHub,
  onLinkHubFileToHub,
  onUnlinkFromHub,
  onRemoveHubFile,
  onRemoveFromLibrary,
  onCreateHub,
  onCapture,
  onCreateDocumentFromNotes,
  seedPrompt,
  onSeedPromptApplied,
  canEdit = true,
  canCreate = true,
}) {
  const [internalTab, setInternalTab] = useState("chapter");
  const activeTab = tab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <LinkedKnowledgeHubSection
        record={file}
        hubLinks={hubLinks}
        hubs={hubs}
        canEdit={canEdit}
        canCreate={canCreate}
        hubIcon={FileText}
        variant="compact"
        onNavigateToHub={onNavigateToHub}
        onLinkToHub={onLinkToHub}
        onLinkHubFileToHub={onLinkHubFileToHub}
        onUnlinkFromHub={onUnlinkFromHub}
        onRemoveHubFile={onRemoveHubFile}
        onCreateHub={onCreateHub}
      />
      <PageUnderlineTabs
        value={activeTab}
        onValueChange={setTab}
        tabs={PANEL_TABS}
        ariaLabel="Document assistant sections"
        className="px-3"
      />

      {activeTab === "chapter" ? (
        <ChapterTab
          chapter={chapter}
          fileName={fileName}
          onCapture={canEdit ? onCapture : undefined}
          seedPrompt={seedPrompt}
          onSeedPromptApplied={onSeedPromptApplied}
        />
      ) : activeTab === "studio" ? (
        <StudioTab chapter={chapter} fileName={fileName} onCapture={canEdit ? onCapture : undefined} />
      ) : activeTab === "notes" ? (
        <NotesTab
          notes={notes}
          nodes={nodes}
          onCreateDocumentFromNotes={canEdit ? onCreateDocumentFromNotes : undefined}
        />
      ) : (
        <DetailsTab
          file={file}
          hubLinks={hubLinks}
          hubs={hubs}
          onNavigateToHub={onNavigateToHub}
          onLinkToHub={onLinkToHub}
          onLinkHubFileToHub={onLinkHubFileToHub}
          onUnlinkFromHub={onUnlinkFromHub}
          onRemoveHubFile={onRemoveHubFile}
          onRemoveFromLibrary={onRemoveFromLibrary}
          onCreateHub={onCreateHub}
          canEdit={canEdit}
          canCreate={canCreate}
        />
      )}
    </div>
  );
}

// ─── Main reader ──────────────────────────────────────────────────────────────

export function DocumentReaderDrawer({
  file,
  hubLinks = [],
  hubs = [],
  onNavigateToHub,
  onLinkToHub,
  onLinkHubFileToHub,
  onUnlinkFromHub,
  onRemoveHubFile,
  onRemoveFromLibrary,
  onCreateHub,
  onClose,
  onNotify,
  canEdit = true,
  canCreate = true,
}) {
  const { addDocumentsToLibrary, downloadCloudFileToLibrary, downloadCloudFileToHub, updateHubFile, updateLibraryDocument } =
    useKnowledgeHubs();
  const capture = useDocumentContentCapture({
    file,
    addDocumentsToLibrary,
    showToast: onNotify,
  });

  const chapters = useMemo(() => {
    const demoChapters = file ? CONTENT_MAP[file.name]?.chapters : null;
    if (demoChapters?.length) return demoChapters;
    return file ? generateFallbackChapters(file) : [];
  }, [file?.id, file?.name]);

  const chapter = useMemo(
    () => mergeChaptersForReading(chapters, file?.name),
    [chapters, file?.name],
  );

  const [panelTab, setPanelTab] = useState("chapter");
  const [centerView, setCenterView] = useState("read");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [askSeedPrompt, setAskSeedPrompt] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    setPanelTab("chapter");
    setCenterView("read");
    setMobilePanelOpen(false);
    setAskSeedPrompt("");
  }, [file?.id]);

  const handleRequestDownload = useCallback(async () => {
    if (file?.isLibraryDocument) {
      await downloadCloudFileToLibrary(file.id);
    } else if (file?.hubId && file?.id) {
      await downloadCloudFileToHub(file.hubId, file.id);
    }
  }, [downloadCloudFileToLibrary, downloadCloudFileToHub, file]);

  const handleSourceGuideReady = useCallback(
    (fileId, guide) => {
      if (guide?.status !== "ready" || !fileId) return;
      if (file?.isLibraryDocument) {
        updateLibraryDocument(fileId, { sourceGuide: guide });
      } else if (file?.hubId) {
        updateHubFile(file.hubId, fileId, { sourceGuide: guide });
      }
    },
    [file?.hubId, file?.isLibraryDocument, updateHubFile, updateLibraryDocument],
  );

  function openMobilePanel(tabId) {
    setPanelTab(tabId);
    setMobilePanelOpen(true);
  }

  const guideSections = useMemo(
    () =>
      chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        excerpt: ch.summary ?? (ch.body ?? "").slice(0, 220),
        summary: ch.summary,
        body: ch.body,
      })),
    [chapters],
  );

  const handleGuidePrompt = useCallback((prompt) => {
    if (!prompt?.trim()) return;
    setAskSeedPrompt(prompt);
    setPanelTab("chapter");
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobilePanelOpen(true);
    }
  }, []);

  const handleAskSeedApplied = useCallback(() => {
    setAskSeedPrompt("");
  }, []);

  const panelProps = {
    chapter,
    fileName: file?.name,
    file,
    hubLinks,
    hubs,
    notes: capture.notes,
    nodes: capture.nodes,
    tab: panelTab,
    onTabChange: setPanelTab,
    onNavigateToHub,
    onLinkToHub,
    onLinkHubFileToHub,
    onUnlinkFromHub,
    onRemoveHubFile,
    onRemoveFromLibrary,
    onCreateHub,
    onCapture: capture.runCapture,
    onCreateDocumentFromNotes: capture.openCreateDocumentFromNotes,
    seedPrompt: askSeedPrompt,
    onSeedPromptApplied: handleAskSeedApplied,
    canEdit,
    canCreate,
  };

  if (!file) return null;

  const readingSourceLabel = file.name;

  return (
    <>
    <div className="flex h-full w-full flex-col bg-background">
      {onClose ? (
        <header className="shrink-0 border-b border-border bg-card/50 px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="size-3.5" aria-hidden />
                Document
              </div>
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                {file.name}
              </h1>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </header>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Center: reader + optional source preview ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-end border-b border-border bg-muted/10">
            <PageUnderlineTabs
              value={centerView}
              onValueChange={setCenterView}
              tabs={CENTER_VIEWS}
              ariaLabel="Document views"
              className="min-w-0 flex-1 border-b-0 bg-transparent px-4"
            />
            <button
              type="button"
              onClick={() => openMobilePanel(panelTab)}
              className="mb-2 mr-3 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              title="Open assistant panel"
              aria-label="Open assistant panel"
            >
              <MessageSquare className="size-4" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden",
                centerView !== "read" && "hidden",
              )}
            >
              <ChapterReaderView
                chapter={chapter}
                readingSourceLabel={readingSourceLabel}
                canEdit={canEdit}
                openSelectionMenu={capture.openSelectionMenu}
                scrollRef={scrollRef}
              />
            </div>

            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden",
                centerView !== "preview" && "hidden",
              )}
              onContextMenu={(e) =>
                canEdit && capture.openSelectionMenu(e, null, `${file.name} · Source file`)
              }
            >
              <HubFilePreviewViewer
                hubId={file.hubId ?? "library"}
                file={file}
                allFiles={[file]}
                showDemoStatuses
                showInlinePreview={false}
                guideSections={guideSections}
                onRequestDownload={handleRequestDownload}
                onQuickPrompt={(prompt) => handleGuidePrompt(prompt)}
                onSourceGuideReady={handleSourceGuideReady}
                className="h-full min-h-0 flex-1"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 border-t border-border bg-background px-2 py-2 lg:hidden">
            {PANEL_TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => openMobilePanel(id)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                  panelTab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: AI panel (desktop) ── */}
        {chapter ? (
          <div className="hidden w-64 shrink-0 border-l border-border bg-muted/10 lg:flex lg:flex-col xl:w-72">
            <RightPanel key={file?.id} {...panelProps} />
          </div>
        ) : null}
      </div>
    </div>

    <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
      <SheetContent side="bottom" className="h-[min(88vh,720px)] gap-0 p-0">
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <SheetTitle className="text-sm">Document assistant</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <RightPanel key={`mobile-${file?.id}`} {...panelProps} />
        </div>
      </SheetContent>
    </Sheet>

    <SelectionContextMenu
      menu={capture.selectionMenu}
      onCapture={capture.runCapture}
      onClose={capture.closeSelectionMenu}
    />

    <SaveToNodeDialog
      open={capture.dialog?.type === "node"}
      nodes={capture.nodes}
      onOpenChange={(open) => {
        if (!open) capture.closeDialog();
      }}
      onSave={capture.handleDialogSaveToNode}
    />

    <CreateDocumentDialog
      open={capture.dialog?.type === "document"}
      defaultName={capture.dialog?.defaultName}
      onOpenChange={(open) => {
        if (!open) capture.closeDialog();
      }}
      onCreate={capture.handleDialogCreateDocument}
    />

    <GenerateReportDialog
      open={capture.dialog?.type === "report"}
      reportMarkdown={capture.dialog?.report ?? capture.pendingReport?.report}
      onOpenChange={(open) => {
        if (!open) capture.closeDialog();
      }}
      onSaveAsNote={capture.handleReportSaveAsNote}
      onSaveToNode={capture.handleReportSaveToNode}
      onCreateDocument={capture.handleReportCreateDocument}
      onDownload={capture.handleReportDownload}
    />
    </>
  );
}
