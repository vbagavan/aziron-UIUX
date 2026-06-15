import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
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
  HelpCircle,
  Layers,
  ClipboardList,
  GitCompare,
  BarChart3,
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
  PanelLeftClose,
  MessageSquare,
  BookOpen,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { KnowledgeHubSearchPicker } from "@/components/common/KnowledgeHubSearchPicker";
import { HubFilePreviewViewer } from "@/components/features/knowledge/HubFilePreviewViewer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PANEL_TABS = [
  { id: "chapter", label: "Ask AI" },
  { id: "studio", label: "Studio" },
  { id: "notes", label: "Notes" },
  { id: "details", label: "Details" },
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

function generateFallbackChapters(file) {
  const fileName = file?.name ?? "this document";
  const sourceLabel = file?.source === "cloud" ? "Cloud import" : "Local upload";
  const isStored =
    file?.indexStatus === "stored" ||
    file?.fileStatus === "success" ||
    file?.syncStatus === "stored";

  return [
    {
      id: "c1",
      num: 1,
      title: "Document preview",
      readMins: 2,
      summary: `Preview of ${fileName}. Full chapter extraction is available once this file is indexed for Knowledge Hub retrieval.`,
      body: `**${fileName}**\n\nThis preview uses placeholder content until the document intelligence pipeline extracts readable chapters from your file.\n\n- **Source:** ${sourceLabel}\n- **Status:** ${isStored ? "Stored in your library" : "Awaiting processing"}\n\nOpen the **Details** panel to link this document to a Knowledge Hub. Linked documents become available for semantic search and agent retrieval.`,
    },
  ];
}

// ─── Studio tools (mirrors KnowledgeHubWorkspaceView) ────────────────────────

const STUDIO_TOOLS = [
  { id: "summary",     label: "Summary",     icon: FileText,       bg: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { id: "mindmap",     label: "Mind Map",    icon: Network,        bg: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  { id: "quiz",        label: "Quiz",        icon: HelpCircle,     bg: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { id: "flashcards",  label: "Flashcards",  icon: Layers,         bg: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  { id: "report",      label: "Report",      icon: ClipboardList,  bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { id: "compare",     label: "Compare",     icon: GitCompare,     bg: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "infographic", label: "Infographic", icon: BarChart3,      bg: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" },
  { id: "datatable",   label: "Data Table",  icon: FileSpreadsheet,bg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
];

function generateChapterStudioContent(toolId, fileName, chapter) {
  const title = chapter?.title ?? "this chapter";
  const fileBase = fileName?.replace(/\.[^.]+$/, "") ?? "Document";

  switch (toolId) {
    case "summary":
      return `# Summary — ${title}\n\n**Source:** ${fileBase}\n\n## Overview\n${chapter?.summary ?? ""}\n\n## Key Points\n- ${(chapter?.body ?? "").split("\n\n").slice(0, 3).map(p => p.slice(0, 80).trim()).join("\n- ")}\n\n## Conclusion\nThis chapter provides foundational context for the broader document. Cross-reference with adjacent chapters for complete coverage.`;

    case "quiz":
      return `# Quiz — ${title}\n\n**Source:** ${fileBase}\n\n---\n\n**Q1.** What is the primary subject of this chapter?\n- A) Administrative procedures\n- B) ${title} ✓\n- C) Historical background\n- D) Technical specifications\n\n---\n\n**Q2.** Which statement best summarises this chapter?\n- A) It provides an unrelated overview\n- B) It introduces contradictory ideas\n- C) ${(chapter?.summary ?? "").slice(0, 90)}… ✓\n- D) None of the above\n\n---\n\n**Q3.** True or False: The content in this chapter stands alone without reference to the rest of the document.\n- **False** ✓ — It builds on the document's core narrative.`;

    case "flashcards":
      return `# Flashcards — ${title}\n\n**Source:** ${fileBase}\n\n---\n\n**Card 1**\nQ: What is the main topic of "${title}"?\nA: ${(chapter?.summary ?? "").slice(0, 100)}\n\n---\n\n**Card 2**\nQ: How many chapters does this document contain?\nA: Multiple chapters covering progressive depth on the subject.\n\n---\n\n**Card 3**\nQ: What action or knowledge does this chapter aim to convey?\nA: Understanding of ${title.toLowerCase()} and its implications for the overall subject matter.`;

    case "mindmap":
      return `# Mind Map — ${title}\n\n**Source:** ${fileBase}\n\n## Central Node\n${title}\n\n## Branch 1 — Core Concepts\n  ├── ${(chapter?.body ?? "").split(" ").slice(0, 4).join(" ")}…\n  └── Key definitions and terminology\n\n## Branch 2 — Supporting Details\n  ├── Evidence and examples\n  └── ${fileBase} context\n\n## Branch 3 — Implications\n  ├── Practical applications\n  └── Connections to other chapters\n\n## Branch 4 — Open Questions\n  ├── What remains unexplained?\n  └── Further reading suggestions`;

    case "report":
      return `# Report — ${title}\n\n**Source:** ${fileBase}  \n**Generated:** ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}\n\n## Executive Summary\n${chapter?.summary ?? ""}\n\n## Findings\n\n### Section Analysis\nThe chapter presents its material in a structured manner, progressing from foundational concepts to practical implications. The narrative is internally consistent and references the document's broader thesis.\n\n### Depth of Coverage\n- Conceptual clarity: **High**\n- Practical application: **Medium**\n- Cross-references: **Low** (self-contained)\n\n## Recommendations\n1. Pair with Chapter ${(chapter?.num ?? 1) + 1} for sequential understanding.\n2. Use the summary as a quick-reference card.\n3. Review open questions before moving forward.`;

    case "compare":
      return `# Compare — ${title} vs Adjacent Chapters\n\n**Source:** ${fileBase}\n\n| Dimension | This Chapter | Previous | Next |\n|-----------|-------------|----------|------|\n| Scope | Focused | Broader | Deeper |\n| Complexity | Medium | Lower | Higher |\n| Dependencies | None | — | This chapter |\n| Key Concept | ${title} | Foundation | Application |\n\n## Analysis\nThis chapter occupies the middle ground in the document's pedagogical arc — it builds on foundational concepts from earlier sections while preparing the reader for more complex material ahead.`;

    case "infographic":
      return `# Infographic Script — ${title}\n\n**Source:** ${fileBase}\n\n## Visual Structure\n\n[HEADER BLOCK]\nTitle: ${title}\nSubtitle: From ${fileBase}\n\n[STAT CALLOUTS]\n• ${chapter?.readMins ?? 3} min read\n• ${(chapter?.body ?? "").split(" ").length} words\n• ${(chapter?.body ?? "").split("\n\n").length} sections\n\n[FLOW DIAGRAM]\n1. Introduction → 2. Core Concept → 3. Detail → 4. Implication → 5. Takeaway\n\n[KEY QUOTE]\n"${(chapter?.body ?? "").split(".")[0].trim()}."\n\n[FOOTER]\nSource: ${fileBase} · Chapter ${chapter?.num}`;

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
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
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

// ─── Chapter navigation item ──────────────────────────────────────────────────

function ChapterItem({ chapter, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(chapter.id)}
      className={cn(
        "group flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors duration-100",
        active ? "bg-primary/10" : "hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:bg-border",
        )}
      >
        {chapter.num}
      </span>
      <span
        className={cn(
          "line-clamp-2 text-xs leading-snug transition-colors",
          active ? "font-semibold text-primary" : "font-medium text-foreground/80 group-hover:text-foreground",
        )}
      >
        {chapter.title}
      </span>
    </button>
  );
}

// ─── Chapter reading view (center panel) ─────────────────────────────────────

function ReadingMeta({ chapter, total }) {
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="size-3" />
        {chapter.readMins} min read
      </span>
      <span className="h-3 w-px bg-border" />
      <span>
        Chapter {chapter.num} of {total}
      </span>
    </div>
  );
}

function ChapterReaderView({ chapter, chapters, readingSourceLabel, canEdit, openSelectionMenu, scrollRef }) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-8 py-10 pb-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
          Chapter {chapter?.num}
        </p>

        <h1 className="mt-3 text-[2rem] font-bold leading-tight tracking-tight text-foreground">
          {chapter?.title}
        </h1>

        <ReadingMeta chapter={chapter} total={chapters.length} />

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
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
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
  const cfg = getFileTypeConfig(file?.type);
  const linkedHubIds = new Set(hubLinks.map((l) => Number(l.hubId)));
  const availableHubs = hubs.filter((h) => !linkedHubIds.has(Number(h.id)));
  const allHubsLinked = hubs.length > 0 && availableHubs.length === 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Document details
        </p>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium text-foreground">{cfg.label}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Size</dt>
            <dd className="font-medium text-foreground">{formatFileSize(file?.sizeKb)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Source</dt>
            <dd className="flex items-center gap-1 font-medium text-foreground">
              {file?.source === "cloud" ? (
                <>
                  <Cloud className="size-3" /> Cloud
                </>
              ) : (
                <>
                  <HardDrive className="size-3" /> Local
                </>
              )}
            </dd>
          </div>
          {file?.uploadedAt && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd className="font-medium text-foreground">
                {formatDisplayDate(file.uploadedAt) ?? file.uploadedAt}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mx-4 h-px bg-border" />

      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Linked Knowledge Hubs
          </p>
          <KnowledgeHubSearchPicker
            hubs={availableHubs}
            align="end"
            emptyHint={
              allHubsLinked
                ? "This document is already linked to all your Knowledge Hubs."
                : undefined
            }
            onSelect={(hub) => {
              if (file?.isLibraryDocument) {
                onLinkToHub?.(file.id, hub.id);
              } else {
                onLinkHubFileToHub?.(file.hubId, file.id, hub.id);
              }
            }}
            onRequestCreate={canCreate ? onCreateHub : undefined}
            renderTrigger={({ toggle }) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-[11px]"
                onClick={toggle}
                disabled={!canEdit || allHubsLinked}
              >
                <Plus className="size-3" />
                Add to hub
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            )}
          />
        </div>

        {hubLinks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            This document is not linked to any Knowledge Hub yet. Add it to a hub when you want
            agents to use it for retrieval.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hubLinks.map((link) => (
              <li
                key={`${link.hubId}-${link.hubFileId}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
              >
                <Database className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{link.hubName}</p>
                  <p className="text-[10px] text-muted-foreground">Knowledge Hub</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Open hub"
                    onClick={() => onNavigateToHub?.(link.hubId)}
                  >
                    <ExternalLink className="size-3.5" />
                  </Button>
                  {file?.isLibraryDocument ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Remove from hub"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onUnlinkFromHub?.(file.id, link.hubId)}
                    >
                      <Unlink className="size-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Remove from hub"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveHubFile?.(file.hubId, file.id)}
                    >
                      <Unlink className="size-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
                        : "border-violet-500/20 bg-violet-500/5",
                      selectMode && !selected && "hover:border-primary/30 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {selectMode ? renderCheckbox(selected) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
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
      {/* Tab toggle */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2.5">
        {PANEL_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

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
  const showChapterNav = chapters.length > 1;

  const [activeId, setActiveId] = useState(chapters[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [chaptersNavCollapsed, setChaptersNavCollapsed] = useState(false);
  const [panelTab, setPanelTab] = useState("chapter");
  const [centerView, setCenterView] = useState("read");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobileChapterOpen, setMobileChapterOpen] = useState(false);
  const [askSeedPrompt, setAskSeedPrompt] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    setActiveId(chapters[0]?.id ?? null);
    setSearch("");
    setPanelTab("chapter");
    setCenterView("read");
    setMobilePanelOpen(false);
    setAskSeedPrompt("");
  }, [file?.id, chapters]);

  const chapter = chapters.find((c) => c.id === activeId) ?? chapters[0];
  const chapterIndex = chapters.findIndex((c) => c.id === activeId);

  const filteredChapters = search.trim()
    ? chapters.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase()),
      )
    : chapters;

  useEffect(() => {
    if (
      search.trim() &&
      filteredChapters.length > 0 &&
      !filteredChapters.some((c) => c.id === activeId)
    ) {
      setActiveId(filteredChapters[0].id);
    }
  }, [search, filteredChapters, activeId]);

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

  function goTo(id) {
    setActiveId(id);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    if (chapterIndex > 0) goTo(chapters[chapterIndex - 1].id);
  }

  function goNext() {
    if (chapterIndex < chapters.length - 1) goTo(chapters[chapterIndex + 1].id);
  }

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

  const readingSourceLabel = `${file.name} · ${chapter?.title ?? "Chapter"}`;

  return (
    <>
    <div className="flex h-full w-full flex-col bg-background">

      {/* ── Three columns ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Left: chapter nav ── */}
        {showChapterNav ? (
          chaptersNavCollapsed ? (
            <div className="hidden w-11 shrink-0 flex-col items-center border-r border-border bg-muted/20 py-3 md:flex">
              <button
                type="button"
                onClick={() => setChaptersNavCollapsed(false)}
                aria-label="Expand chapters"
                title="Expand chapters"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PanelLeftClose className="size-4 rotate-180" />
              </button>
              <span className="mt-4 rotate-180 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">
                Chapters
              </span>
            </div>
          ) : (
            <div className="hidden w-52 shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Chapters
                </p>
                <button
                  type="button"
                  onClick={() => setChaptersNavCollapsed(true)}
                  aria-label="Collapse chapters"
                  title="Collapse chapters"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </div>

              <div className="px-3 py-3">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.5">
                  <Search className="size-3 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search chapters…"
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4">
                <div className="flex flex-col gap-0.5">
                  {filteredChapters.map((ch) => (
                    <ChapterItem
                      key={ch.id}
                      chapter={ch}
                      active={ch.id === activeId}
                      onClick={goTo}
                    />
                  ))}
                  {filteredChapters.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No chapters match.</p>
                  )}
                </div>
              </div>
            </div>
          )
        ) : null}

        {/* ── Center: reader + optional source preview ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/10 px-4 py-2">
            {CENTER_VIEWS.map(({ id, label, icon: ViewIcon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCenterView(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  centerView === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <ViewIcon className="size-3.5" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => openMobilePanel(panelTab)}
              className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
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
                chapters={chapters}
                readingSourceLabel={readingSourceLabel}
                canEdit={canEdit}
                openSelectionMenu={capture.openSelectionMenu}
                scrollRef={scrollRef}
              />

              {chapters.length > 1 ? (
              <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/10 px-4 py-2 md:px-8">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={chapterIndex === 0}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    chapterIndex === 0
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {chapterIndex + 1} / {chapters.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileChapterOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground md:hidden"
                  >
                    Ch {chapterIndex + 1}
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={chapterIndex === chapters.length - 1}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    chapterIndex === chapters.length - 1
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
              ) : null}
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
          <div className="hidden w-72 shrink-0 border-l border-border bg-muted/10 lg:flex lg:flex-col xl:w-80">
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

    {showChapterNav ? (
      <Sheet open={mobileChapterOpen} onOpenChange={setMobileChapterOpen}>
        <SheetContent side="bottom" className="h-[min(70vh,520px)] gap-0 p-0 md:hidden">
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-sm">Chapters</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            <div className="mb-3 px-2">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.5">
                <Search className="size-3 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chapters…"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              {filteredChapters.map((ch) => (
                <ChapterItem
                  key={ch.id}
                  chapter={ch}
                  active={ch.id === activeId}
                  onClick={(id) => {
                    goTo(id);
                    setMobileChapterOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    ) : null}

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
