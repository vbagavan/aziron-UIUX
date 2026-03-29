// ============================================================
// claudecodefigma – Import Screens  (Figma Plugin)
// Generates 5 app screens as Figma frames with full fidelity
// to the React implementation.
// ============================================================

figma.showUI(__html__, { width: 300, height: 340 });

// ──────────────────────────────────────────────────────────────
// Design tokens (match the React app's Tailwind palette)
// ──────────────────────────────────────────────────────────────
const C = {
  bg:        hex('#f8fafc'),
  white:     hex('#ffffff'),
  slate50:   hex('#f8fafc'),
  slate100:  hex('#f1f5f9'),
  slate200:  hex('#e2e8f0'),
  slate300:  hex('#cbd5e1'),
  slate400:  hex('#94a3b8'),
  slate500:  hex('#64748b'),
  slate700:  hex('#334155'),
  slate900:  hex('#0f172a'),
  blue600:   hex('#2563eb'),
  blue700:   hex('#1d4ed8'),
  blue100:   hex('#dbeafe'),
  blue200:   hex('#bfdbfe'),
  red500:    hex('#ef4444'),
  green500:  hex('#22c55e'),
  green100:  hex('#dcfce7'),
  amber500:  hex('#f59e0b'),
  gold:      hex('#c9a227'),
  goldLight: hex('#e8c84a'),
  dark:      hex('#0d0d0d'),
  darkCard:  hex('#111008'),
};

function hex(h) {
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  return { r, g, b };
}

function rgba(h, a) {
  var c = hex(h);
  return { r: c.r, g: c.g, b: c.b, a: a === undefined ? 1 : a };
}

// ──────────────────────────────────────────────────────────────
// Primitive helpers
// ──────────────────────────────────────────────────────────────

function frame(name, w, h) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(w, h);
  f.fills = [];
  return f;
}

function rect(name, w, h, fill, radius = 0) {
  const r = figma.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = [{ type: 'SOLID', color: fill }];
  r.cornerRadius = radius;
  return r;
}

function text(content, size, weight, color, opts) {
  if (opts === undefined) opts = {};
  const t = figma.createText();
  // fontName MUST be set before characters
  t.fontName = { family: 'Inter', style: weight };
  t.characters = content;
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color: color }];
  if (opts.width) t.textAutoResize = 'HEIGHT';
  if (opts.align) t.textAlignHorizontal = opts.align;
  if (opts.lineHeight) t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
  if (opts.letterSpacing) t.letterSpacing = { value: opts.letterSpacing, unit: 'PIXELS' };
  if (opts.opacity !== undefined) t.opacity = opts.opacity;
  return t;
}

function setAutoLayout(node, dir, gap, padH, padV) {
  node.layoutMode = dir;
  node.itemSpacing = gap;
  node.paddingLeft = padH;
  node.paddingRight = padH;
  node.paddingTop = padV;
  node.paddingBottom = padV;
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
}

function solidFill(color) {
  return [{ type: 'SOLID', color }];
}

function border(color, weight = 1) {
  return [{ type: 'SOLID', color, weight }];
}

function addStroke(node, color, weight = 1) {
  node.strokes = [{ type: 'SOLID', color }];
  node.strokeWeight = weight;
  node.strokeAlign = 'INSIDE';
}

function place(parent, child, x, y) {
  parent.appendChild(child);
  child.x = x;
  child.y = y;
}

// ──────────────────────────────────────────────────────────────
// Shared layout components
// ──────────────────────────────────────────────────────────────

// Collapsed sidebar (24 px wide) with icon rows
function buildSidebar(h) {
  const sb = frame('Sidebar', 24, h);
  sb.fills = solidFill(C.white);
  addStroke(sb, C.slate200);

  // Nav icon dots (simplified)
  const navItems = [
    { y: 12, active: false },
    { y: 44, active: false },
    { y: 76, active: false },
    { y: 108, active: false },
    { y: 140, active: false },
    { y: 172, active: false },
    { y: 204, active: false },
  ];

  navItems.forEach(({ y, active }) => {
    const dot = rect('NavIcon', 16, 16, active ? C.blue600 : C.slate400, 3);
    sb.appendChild(dot);
    dot.x = 4;
    dot.y = y;
  });

  // Avatar at bottom
  const avatar = rect('Avatar', 20, 20, C.blue600, 10);
  sb.appendChild(avatar);
  avatar.x = 2;
  avatar.y = h - 28;

  return sb;
}

// App header (full width at top, 56 px)
function buildHeader(w) {
  const hdr = frame('AppHeader', w, 56);
  hdr.fills = solidFill(C.white);
  addStroke(hdr, C.slate200);

  // Toggle button placeholder
  const btn = rect('MenuBtn', 32, 32, C.slate100, 6);
  hdr.appendChild(btn);
  btn.x = 12;
  btn.y = 12;

  // Bell icon area
  const bell = rect('Bell', 28, 28, C.slate100, 6);
  hdr.appendChild(bell);
  bell.x = w - 44;
  bell.y = 14;

  return hdr;
}

// ──────────────────────────────────────────────────────────────
// SCREEN 1: New Chat
// ──────────────────────────────────────────────────────────────
async function buildNewChat() {
  const W = 1512, H = 982;
  const root = frame('1 · New Chat', W, H);
  root.fills = solidFill(C.bg);

  const sidebar = buildSidebar(H);
  place(root, sidebar, 0, 0);

  const header = buildHeader(W - 24);
  place(root, header, 24, 0);

  // Center content
  const contentW = W - 24;
  const centerX = 24 + contentW / 2;

  // Aziro "A" logo mark
  const logo = frame('AziroLogo', 40, 40);
  logo.fills = [];
  const logoCircle = figma.createEllipse();
  logoCircle.resize(40, 40);
  logoCircle.fills = solidFill(C.blue600);
  logo.appendChild(logoCircle);
  place(root, logo, centerX - 20, 56 + 200);

  // "Hi John, Where should we start?" heading
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }); } catch(_) {}
  const heading = text('Hi John, Where should we start?', 28, 'Bold', C.slate900, { align: 'CENTER' });
  heading.resize(500, 40);
  heading.textAutoResize = 'HEIGHT';
  place(root, heading, centerX - 250, 56 + 258);

  // Prompt box
  const promptBox = frame('PromptBox', 600, 100);
  promptBox.fills = solidFill(C.white);
  addStroke(promptBox, C.slate200);
  promptBox.cornerRadius = 12;
  place(root, promptBox, centerX - 300, 56 + 322);

  try { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); } catch(_) {}
  const placeholder = text('Ask anything, or describe your task…', 14, 'Regular', C.slate400);
  placeholder.resize(400, 22);
  promptBox.appendChild(placeholder);
  placeholder.x = 48;
  placeholder.y = 20;

  // Clip icon
  const clip = rect('ClipIcon', 20, 20, C.slate300, 4);
  promptBox.appendChild(clip);
  clip.x = 16;
  clip.y = 19;

  // Send button
  const sendBtn = rect('SendBtn', 32, 32, C.slate100, 16);
  promptBox.appendChild(sendBtn);
  sendBtn.x = 554;
  sendBtn.y = 14;

  // Control bar at bottom of prompt box
  const ctrlBar = frame('ControlBar', 600, 36);
  ctrlBar.fills = solidFill(C.slate50);
  addStroke(ctrlBar, C.slate200);
  place(root, ctrlBar, centerX - 300, 56 + 422);

  const toolsChip = rect('ToolsChip', 70, 24, C.slate100, 6);
  ctrlBar.appendChild(toolsChip);
  toolsChip.x = 12;
  toolsChip.y = 6;

  const khChip = rect('KnowledgeHubChip', 110, 24, C.slate100, 6);
  ctrlBar.appendChild(khChip);
  khChip.x = 90;
  khChip.y = 6;

  const modelChip = rect('ModelChip', 120, 24, C.slate100, 6);
  ctrlBar.appendChild(modelChip);
  modelChip.x = 466;
  modelChip.y = 6;

  return root;
}

// ──────────────────────────────────────────────────────────────
// SCREEN 2: Agents List
// ──────────────────────────────────────────────────────────────
async function buildAgentsList() {
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }); } catch(_) {}

  const W = 1512, H = 982;
  const root = frame('2 · Agents List', W, H);
  root.fills = solidFill(C.bg);

  const sidebar = buildSidebar(H);
  place(root, sidebar, 0, 0);

  const header = buildHeader(W - 24);
  place(root, header, 24, 0);

  // Content area starts at y=56+24=80 with px=24 padding
  const contentX = 24 + 24;
  const contentW = W - 24 - 48;

  // Page title
  const title = text('Agents', 24, 'Bold', C.slate900);
  title.resize(200, 32);
  place(root, title, contentX, 56 + 24);

  const subtitle = text('Build and manage your team of digital workers.', 14, 'Regular', C.slate500);
  subtitle.resize(400, 20);
  place(root, subtitle, contentX, 56 + 62);

  // Search box
  const search = frame('SearchBox', 280, 36);
  search.fills = solidFill(C.white);
  addStroke(search, C.slate300);
  search.cornerRadius = 6;
  place(root, search, W - 24 - 280 - 140, 56 + 28);

  const searchDot = rect('SearchIcon', 14, 14, C.slate400, 3);
  search.appendChild(searchDot);
  searchDot.x = 10;
  searchDot.y = 11;

  const searchTxt = text('Search…', 13, 'Regular', C.slate400);
  searchTxt.resize(220, 18);
  search.appendChild(searchTxt);
  searchTxt.x = 32;
  searchTxt.y = 9;

  // Create Agent button
  const cta = rect('CreateAgentBtn', 130, 36, C.blue600, 6);
  place(root, cta, W - 24 - 130, 56 + 28);
  const ctaTxt = text('+ Create Agent', 13, 'Medium', C.white);
  ctaTxt.resize(120, 18);
  place(root, ctaTxt, W - 24 - 130 + 8, 56 + 37);

  // Agent grid  — 4 columns
  const agents = [
    { name: 'Customer Appreciation', sub: 'AI-powered recognition workflow that creates personalized appreciation cards.', dot: true },
    { name: 'CV Agent', sub: 'Streamlines resume creation with smart suggestions and formatting.', dot: true },
    { name: 'Portfolio Builder', sub: 'Creates and curates a personalized portfolio showcasing your best work.', dot: false },
    { name: 'Job Matcher', sub: 'Intelligently matches you with job listings based on your skills.', dot: false },
    { name: 'Interview Coach', sub: 'Prepares you for interviews with practice questions and real-time coaching.', dot: true },
    { name: 'Skill Tracker', sub: 'Monitors your skill development progress and recommends tailored learning paths.', dot: false },
    { name: 'Networking Assistant', sub: 'Helps you build professional connections on LinkedIn and other platforms.', dot: false },
    { name: 'Salary Insights', sub: 'Provides data-driven salary benchmarks and negotiation strategies.', dot: true },
    { name: 'Freelance Finder', sub: 'Discovers freelance opportunities that match your expertise.', dot: false },
    { name: 'Profile Enhancer', sub: 'Optimizes your professional profiles to maximize visibility to recruiters.', dot: false },
    { name: 'Job Application Tracker', sub: 'Keeps track of all your job applications, deadlines, and statuses.', dot: false },
    { name: 'Resume Analyzer', sub: 'Analyzes your resume and provides actionable feedback.', dot: true },
  ];

  const cols = 4;
  const colW = Math.floor((contentW - (cols - 1) * 16) / cols);
  const cardH = 148;
  const gridY = 56 + 96;

  for (let i = 0; i < agents.length; i++) {
    const ag = agents[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = contentX + col * (colW + 16);
    const cy = gridY + row * (cardH + 16);

    const card = frame(`Card:${ag.name}`, colW, cardH);
    card.fills = solidFill(C.white);
    addStroke(card, C.slate200);
    card.cornerRadius = 8;
    place(root, card, cx, cy);

    // Avatar box
    const av = rect('Avatar', 40, 40, C.slate50, 4);
    addStroke(av, C.slate200);
    card.appendChild(av);
    av.x = 8;
    av.y = 8;

    // Red access dot
    if (ag.dot) {
      const d = figma.createEllipse();
      d.resize(8, 8);
      d.fills = solidFill(C.red500);
      card.appendChild(d);
      d.x = 56;
      d.y = 10;
    }

    // Name
    const nameNode = text(ag.name, 13, 'Medium', C.slate900);
    nameNode.resize(colW - 72, 20);
    card.appendChild(nameNode);
    nameNode.x = ag.dot ? 70 : 58;
    nameNode.y = 8;

    // Description
    const desc = text(ag.sub, 11, 'Regular', C.slate500);
    desc.resize(colW - 16, 36);
    desc.textAutoResize = 'NONE';
    card.appendChild(desc);
    desc.x = 8;
    desc.y = 56;

    // Divider
    const div = rect('Divider', colW, 1, C.slate200);
    card.appendChild(div);
    div.x = 0;
    div.y = 100;

    // Footer
    const dateTxt = text('23 Mar 2025', 11, 'Regular', C.slate500);
    dateTxt.resize(90, 16);
    card.appendChild(dateTxt);
    dateTxt.x = 8;
    dateTxt.y = 108;

    const modelDot = rect('ModelDot', 12, 12, C.slate300, 3);
    card.appendChild(modelDot);
    modelDot.x = colW - 70;
    modelDot.y = 110;

    const modelTxt = text('GPT-4.5', 11, 'Regular', C.slate500);
    modelTxt.resize(55, 16);
    card.appendChild(modelTxt);
    modelTxt.x = colW - 56;
    modelTxt.y = 108;
  }

  return root;
}

// ──────────────────────────────────────────────────────────────
// SCREEN 3: Agent Chat (CV Agent)
// ──────────────────────────────────────────────────────────────
async function buildAgentChat() {
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }); } catch(_) {}

  const W = 1512, H = 982;
  const root = frame('3 · Agent Chat', W, H);
  root.fills = solidFill(C.bg);

  const sidebar = buildSidebar(H);
  place(root, sidebar, 0, 0);

  // Chat header
  const hdr = frame('ChatHeader', W - 24, 56);
  hdr.fills = solidFill(C.white);
  addStroke(hdr, C.slate200);
  place(root, hdr, 24, 0);

  const agentIcon = rect('AgentIcon', 36, 36, C.slate100, 4);
  hdr.appendChild(agentIcon);
  agentIcon.x = 16;
  agentIcon.y = 10;

  const agentName = text('CV Agent', 16, 'Medium', C.slate900);
  agentName.resize(200, 24);
  hdr.appendChild(agentName);
  agentName.x = 60;
  agentName.y = 16;

  const maxBtn = rect('MaximiseBtn', 28, 28, C.slate100, 6);
  hdr.appendChild(maxBtn);
  maxBtn.x = W - 24 - 76;
  maxBtn.y = 14;

  const closeBtn = rect('CloseBtn', 28, 28, C.slate100, 6);
  hdr.appendChild(closeBtn);
  closeBtn.x = W - 24 - 40;
  closeBtn.y = 14;

  // PDF attachment chips (top of chat area)
  const pdfY = 56 + 20;
  const chips = ['Policy-document', 'User-manual'];
  chips.forEach((c, i) => {
    const chip = frame(`PDF:${c}`, 150, 36);
    chip.fills = solidFill(C.white);
    addStroke(chip, C.slate200);
    chip.cornerRadius = 6;
    place(root, chip, 24 + 380 + i * 166, pdfY);

    const pdfRect = rect('PDFIcon', 20, 24, hex('#ef4444'), 3);
    chip.appendChild(pdfRect);
    pdfRect.x = 8;
    pdfRect.y = 6;

    const chipTxt = text(c, 11, 'Medium', C.slate700);
    chipTxt.resize(110, 16);
    chip.appendChild(chipTxt);
    chipTxt.x = 34;
    chipTxt.y = 10;
  });

  // User message bubble
  const bubbleW = 520;
  const bubble = frame('UserBubble', bubbleW, 44);
  bubble.fills = solidFill(C.blue100);
  addStroke(bubble, C.blue200);
  bubble.cornerRadius = 12;
  place(root, bubble, 24 + (W - 24 - bubbleW) / 2, pdfY + 52);

  const bubbleTxt = text('Tell me about the Chennai water crisis and policy recommendations.', 13, 'Regular', C.slate900);
  bubbleTxt.resize(bubbleW - 24, 32);
  bubble.appendChild(bubbleTxt);
  bubbleTxt.x = 12;
  bubbleTxt.y = 6;

  // AI response lines
  const responseLines = [
    { t: 'Reasoning', bold: true, y: pdfY + 116 },
    { t: "Right now in Chennai it's clear and pleasant, around 24\u00B0C", bold: false, y: pdfY + 144 },
    { t: 'For today, expect hazy sunshine with a high near 31°C and a low around 19°C.', bold: false, y: pdfY + 164 },
    { t: "The coastal city of Chennai has a metropolitan population of 10.8 million as per 2019 census.\nAs the city lacks a perennial water source, catering the water requirements of the population\nhas remained an arduous task. On 18 June 2019, the city's reservoirs ran dry.", bold: false, y: pdfY + 200 },
    { t: 'Although three rivers flow through the metropolitan region and drain into the Bay of Bengal,\nChennai has historically relied on annual monsoon rains to replenish its water reservoirs.', bold: false, y: pdfY + 270 },
  ];

  for (const line of responseLines) {
    const style = line.bold ? 'Bold' : 'Regular';
    const color = line.bold ? C.slate700 : hex('#4e4d4d');
    const txt = text(line.t, 13, style, color);
    txt.resize(W - 24 - 48, 80);
    txt.textAutoResize = 'HEIGHT';
    place(root, txt, 24 + 24, line.y);
  }

  // PDF reference chips in middle of chat
  const refY = pdfY + 370;
  ['Policy-document', 'User-manual'].forEach((c, i) => {
    const chip = frame(`Ref:${c}`, 110, 64);
    chip.fills = solidFill(C.white);
    addStroke(chip, C.slate200);
    chip.cornerRadius = 6;
    place(root, chip, 24 + 200 + i * 126, refY);

    const pIcon = rect('P', 36, 44, hex('#ef4444'), 3);
    chip.appendChild(pIcon);
    pIcon.x = 37;
    pIcon.y = 4;
  });

  // "Save to Knowledge Hub" toggle row
  const toggleY = refY + 80;
  const toggleBar = frame('SaveBar', W - 24 - 48, 48);
  toggleBar.fills = solidFill(C.white);
  addStroke(toggleBar, C.slate200);
  toggleBar.cornerRadius = 8;
  place(root, toggleBar, 24 + 24, toggleY);

  const toggleOval = rect('Toggle', 44, 24, C.blue600, 12);
  toggleBar.appendChild(toggleOval);
  toggleOval.x = 16;
  toggleOval.y = 12;

  const saveTxt = text('Save to Knowledge Hub', 13, 'Medium', C.slate900);
  saveTxt.resize(220, 20);
  toggleBar.appendChild(saveTxt);
  saveTxt.x = 70;
  saveTxt.y = 14;

  const khSelect = frame('KHSelect', 180, 32);
  khSelect.fills = solidFill(C.white);
  addStroke(khSelect, C.slate200);
  khSelect.cornerRadius = 6;
  toggleBar.appendChild(khSelect);
  khSelect.x = toggleBar.width - 196;
  khSelect.y = 8;

  const khTxt = text('Select Knowledge hub', 12, 'Regular', C.slate400);
  khTxt.resize(160, 18);
  khSelect.appendChild(khTxt);
  khTxt.x = 10;
  khTxt.y = 7;

  // Bottom prompt box
  const promptY = H - 100;
  const promptBox = frame('PromptBox', W - 24 - 48, 62);
  promptBox.fills = solidFill(C.white);
  addStroke(promptBox, C.slate200);
  promptBox.cornerRadius = 12;
  place(root, promptBox, 24 + 24, promptY);

  const ph = text('Ask anything, or describe your task…', 13, 'Regular', C.slate400);
  ph.resize(600, 20);
  promptBox.appendChild(ph);
  ph.x = 48;
  ph.y = 20;

  return root;
}

// ──────────────────────────────────────────────────────────────
// SCREEN 4: Kudos – Empty State
// ──────────────────────────────────────────────────────────────
async function buildKudosEmpty() {
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }); } catch(_) {}

  const W = 1512, H = 982;
  const root = frame('4 · Kudos – Empty', W, H);
  root.fills = solidFill(C.bg);

  const sidebar = buildSidebar(H);
  place(root, sidebar, 0, 0);

  const header = buildHeader(W - 24);
  place(root, header, 24, 0);

  // Right sidebar panel (340px)
  const panelW = 340;
  const panel = frame('RightPanel', panelW, H - 56);
  panel.fills = solidFill(hex('#f1f2f6'));
  addStroke(panel, C.slate200);
  place(root, panel, W - panelW, 56);

  // Panel header
  const panelHdr = frame('PanelHeader', panelW, 64);
  panelHdr.fills = solidFill(C.white);
  addStroke(panelHdr, C.slate200);
  panel.appendChild(panelHdr);
  panelHdr.x = 0;
  panelHdr.y = 0;

  const agIcon = rect('AgentIcon', 40, 40, C.slate50, 4);
  addStroke(agIcon, C.slate200);
  panelHdr.appendChild(agIcon);
  agIcon.x = 12;
  agIcon.y = 12;

  const panelTitle = text('Customer Appreciation', 14, 'Medium', C.slate900);
  panelTitle.resize(200, 20);
  panelHdr.appendChild(panelTitle);
  panelTitle.x = 60;
  panelTitle.y = 22;

  // Centered welcome text in panel body
  const welcomeTitle = text("Hi! Let's create a customer appreciation.", 24, 'Medium', C.slate900, { align: 'CENTER' });
  welcomeTitle.resize(260, 90);
  welcomeTitle.textAutoResize = 'HEIGHT';
  panel.appendChild(welcomeTitle);
  welcomeTitle.x = 40;
  welcomeTitle.y = 200;

  const welcomeSub = text("I'll help you generate a professional appreciation card and message. You'll be able to review, edit, and approve it before sending.", 13, 'Regular', hex('#4e4d4d'), { align: 'CENTER' });
  welcomeSub.resize(260, 80);
  welcomeSub.textAutoResize = 'HEIGHT';
  panel.appendChild(welcomeSub);
  welcomeSub.x = 40;
  welcomeSub.y = 316;

  // Bottom prompt box inside panel
  const pp = frame('PromptBox', panelW - 32, 100);
  pp.fills = solidFill(C.slate50);
  addStroke(pp, C.slate200);
  pp.cornerRadius = 12;
  panel.appendChild(pp);
  pp.x = 16;
  pp.y = H - 56 - 116;

  const pph = text('Describe your appreciation…', 12, 'Regular', C.slate400);
  pph.resize(pp.width - 64, 18);
  pp.appendChild(pph);
  pph.x = 48;
  pph.y = 18;

  // Left area (blank canvas)
  const leftCanvas = frame('LeftCanvas', W - 24 - panelW, H - 56);
  leftCanvas.fills = solidFill(C.bg);
  place(root, leftCanvas, 24, 56);

  return root;
}

// ──────────────────────────────────────────────────────────────
// SCREEN 5: Kudos – Gold Classic Preview
// ──────────────────────────────────────────────────────────────
async function buildKudosGoldClassic() {
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); } catch(_) {}
  try { await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }); } catch(_) {}

  const W = 1512, H = 982;
  const root = frame('5 · Kudos – Gold Classic', W, H);
  root.fills = solidFill(C.bg);

  const sidebar = buildSidebar(H);
  place(root, sidebar, 0, 0);

  const header = buildHeader(W - 24);
  place(root, header, 24, 0);

  // Right sidebar panel (340px)
  const panelW = 340;
  const panel = frame('RightPanel', panelW, H - 56);
  panel.fills = solidFill(hex('#f1f2f6'));
  addStroke(panel, C.slate200);
  place(root, panel, W - panelW, 56);

  // Panel header
  const panelHdr = frame('PanelHeader', panelW, 64);
  panelHdr.fills = solidFill(C.white);
  addStroke(panelHdr, C.slate200);
  panel.appendChild(panelHdr);

  const agIcon = rect('AgentIcon', 40, 40, C.slate50, 4);
  addStroke(agIcon, C.slate200);
  panelHdr.appendChild(agIcon);
  agIcon.x = 12;
  agIcon.y = 12;

  const panelTitle = text('Customer Appreciation', 14, 'Medium', C.slate900);
  panelTitle.resize(200, 20);
  panelHdr.appendChild(panelTitle);
  panelTitle.x = 60;
  panelTitle.y = 22;

  // Conversation in panel
  // User message
  const userMsg = frame('UserMessage', panelW - 32, 60);
  userMsg.fills = solidFill(C.blue100);
  addStroke(userMsg, C.blue200);
  userMsg.cornerRadius = 10;
  panel.appendChild(userMsg);
  userMsg.x = 16;
  userMsg.y = 80;

  const umTxt = text('/kudos @Balachandra Husaine @Sridhar — outstanding customer service this quarter!', 11, 'Regular', C.slate900);
  umTxt.resize(panelW - 56, 48);
  userMsg.appendChild(umTxt);
  umTxt.x = 10;
  umTxt.y = 6;

  // Thinking card
  const thinkCard = frame('ThinkingCard', panelW - 32, 36);
  thinkCard.fills = solidFill(C.white);
  addStroke(thinkCard, C.slate200);
  thinkCard.cornerRadius = 6;
  panel.appendChild(thinkCard);
  thinkCard.x = 16;
  thinkCard.y = 156;

  const thinkTxt = text('Thinking….', 13, 'Regular', C.slate900);
  thinkTxt.resize(180, 18);
  panel.appendChild(thinkTxt);
  thinkTxt.x = 32;
  thinkTxt.y = 166;

  // Generating
  const genTxt = text('Generating….', 13, 'Regular', C.slate900);
  genTxt.resize(200, 18);
  panel.appendChild(genTxt);
  genTxt.x = 32;
  genTxt.y = 208;

  // AI response lines
  const r1 = text('Designing KudosFlow template — selecting card style, parsing recipients, preparing approval flow', 12, 'Regular', hex('#4e4d4d'));
  r1.resize(panelW - 48, 48);
  r1.textAutoResize = 'HEIGHT';
  panel.appendChild(r1);
  r1.x = 16;
  r1.y = 236;

  const r2 = text('Applying Gold Classic theme with personalized message and recipient avatars. Your appreciation card will be ready momentarily.', 12, 'Regular', hex('#4e4d4d'));
  r2.resize(panelW - 48, 56);
  r2.textAutoResize = 'HEIGHT';
  panel.appendChild(r2);
  r2.x = 16;
  r2.y = 296;

  // Success card
  const successCard = frame('SuccessCard', panelW - 32, 68);
  successCard.fills = solidFill(C.white);
  addStroke(successCard, C.slate200);
  successCard.cornerRadius = 6;
  panel.appendChild(successCard);
  successCard.x = 16;
  successCard.y = 368;

  const checkCircle = figma.createEllipse();
  checkCircle.resize(20, 20);
  checkCircle.fills = solidFill(C.green100);
  successCard.appendChild(checkCircle);
  checkCircle.x = 12;
  checkCircle.y = 24;

  const successTitle = text('Template has been generated', 13, 'Bold', C.slate900);
  successTitle.resize(240, 18);
  successCard.appendChild(successTitle);
  successTitle.x = 40;
  successTitle.y = 14;

  const successSub = text('Your appreciation card is ready. Review the preview on the left.', 12, 'Regular', C.slate500);
  successSub.resize(240, 32);
  successCard.appendChild(successSub);
  successSub.x = 40;
  successSub.y = 34;

  // Bottom prompt
  const pp = frame('PromptBox', panelW - 32, 100);
  pp.fills = solidFill(C.slate50);
  addStroke(pp, C.slate200);
  pp.cornerRadius = 12;
  panel.appendChild(pp);
  pp.x = 16;
  pp.y = H - 56 - 116;

  const pph = text('Describe your appreciation…', 12, 'Regular', C.slate400);
  pph.resize(pp.width - 64, 18);
  pp.appendChild(pph);
  pph.x = 48;
  pph.y = 18;

  // ── Gold Classic Card (left panel) ──
  const leftW = W - 24 - panelW;
  const cardW = 700, cardH = 500;
  const cardX = 24 + (leftW - cardW) / 2;
  const cardY = 56 + (H - 56 - 40 - cardH) / 2; // 40 = template bar

  const card = frame('GoldClassicCard', cardW, cardH);
  card.fills = [{ type: 'SOLID', color: hex('#111008') }];
  addStroke(card, C.gold, 2);
  card.cornerRadius = 12;
  place(root, card, cardX, cardY);

  // Corner glow overlay
  const glow = figma.createRectangle();
  glow.resize(200, 200);
  glow.fills = [{ type: 'SOLID', color: C.gold, opacity: 0.08 }];
  card.appendChild(glow);
  glow.x = cardW - 200;
  glow.y = 0;

  // "A" logo
  const aCircle = figma.createEllipse();
  aCircle.resize(36, 36);
  aCircle.fills = solidFill(C.blue600);
  card.appendChild(aCircle);
  aCircle.x = cardW - 56;
  aCircle.y = 20;

  // "Congratulations" title — try Georgia, fall back to Inter Bold
  let congratsFont = { family: 'Inter', style: 'Bold' };
  try { await figma.loadFontAsync({ family: 'Georgia', style: 'Bold Italic' }); congratsFont = { family: 'Georgia', style: 'Bold Italic' }; } catch(_) {}

  const congrats = figma.createText();
  congrats.fontName = congratsFont;
  congrats.characters = 'Congratulations';
  congrats.fontSize = 44;
  congrats.fills = solidFill(C.gold);
  congrats.textAlignHorizontal = 'CENTER';
  congrats.resize(cardW - 96, 60);
  card.appendChild(congrats);
  congrats.x = 48;
  congrats.y = 44;

  // Subtitle bar
  const subtitleBar = rect('SubtitleBar', 320, 34, hex('#111008'), 4);
  addStroke(subtitleBar, C.gold);
  card.appendChild(subtitleBar);
  subtitleBar.x = (cardW - 320) / 2;
  subtitleBar.y = 112;

  const subtitleTxt = figma.createText();
  subtitleTxt.fontName = { family: 'Inter', style: 'Medium' };
  subtitleTxt.characters = 'On Being Appreciated By the Customer';
  subtitleTxt.fontSize = 12;
  subtitleTxt.fills = solidFill(C.gold);
  subtitleTxt.textAlignHorizontal = 'CENTER';
  subtitleTxt.resize(300, 18);
  card.appendChild(subtitleTxt);
  subtitleTxt.x = (cardW - 300) / 2;
  subtitleTxt.y = 120;

  // Recipient avatars
  const recipients = [
    { name: 'BH', color: hex('#06b6d4'), label: 'Balachandra', x: cardW / 2 - 120 },
    { name: 'S',  color: hex('#22c55e'),  label: 'Sridhar',     x: cardW / 2 + 60 },
  ];

  for (const rec of recipients) {
    // Gold ring
    const ring = figma.createEllipse();
    ring.resize(68, 68);
    ring.fills = [];
    addStroke(ring, C.gold, 2);
    card.appendChild(ring);
    ring.x = rec.x;
    ring.y = 166;

    // Inner avatar
    const av = figma.createEllipse();
    av.resize(60, 60);
    av.fills = solidFill(rec.color);
    card.appendChild(av);
    av.x = rec.x + 4;
    av.y = 170;

    // Initials
    const init = figma.createText();
    init.fontName = { family: 'Inter', style: 'Bold' };
    init.characters = rec.name;
    init.fontSize = 20;
    init.fills = solidFill(C.white);
    init.textAlignHorizontal = 'CENTER';
    init.resize(60, 28);
    card.appendChild(init);
    init.x = rec.x + 4;
    init.y = 186;

    // Name badge
    const badge = rect(`Badge:${rec.label}`, 90, 26, hex('#111008'), 13);
    addStroke(badge, C.gold);
    card.appendChild(badge);
    badge.x = rec.x - 11;
    badge.y = 246;

    const badgeTxt = figma.createText();
    badgeTxt.fontName = { family: 'Inter', style: 'Bold' };
    badgeTxt.characters = rec.label;
    badgeTxt.fontSize = 11;
    badgeTxt.fills = solidFill(C.gold);
    badgeTxt.textAlignHorizontal = 'CENTER';
    badgeTxt.resize(90, 16);
    card.appendChild(badgeTxt);
    badgeTxt.x = rec.x - 11;
    badgeTxt.y = 251;
  }

  // Gold star between avatars
  const star = figma.createText();
  star.fontName = { family: 'Inter', style: 'Regular' };
  star.characters = '✦';
  star.fontSize = 20;
  star.fills = solidFill(C.goldLight);
  card.appendChild(star);
  star.x = cardW / 2 - 10;
  star.y = 192;

  // Appreciation message
  const msgTxt = figma.createText();
  msgTxt.fontName = { family: 'Inter', style: 'Regular' };
  msgTxt.characters = '"Your outstanding dedication, exceptional service, and commitment to excellence have truly made a difference. This recognition is a testament to your remarkable contributions and the impact you\'ve had on our customers."';
  msgTxt.fontSize = 13;
  msgTxt.fills = [{ type: 'SOLID', color: C.white, opacity: 0.9 }];
  msgTxt.textAlignHorizontal = 'CENTER';
  msgTxt.resize(520, 80);
  msgTxt.textAutoResize = 'HEIGHT';
  card.appendChild(msgTxt);
  msgTxt.x = (cardW - 520) / 2;
  msgTxt.y = 290;

  // Gold divider line
  const divLine = rect('GoldDivider', 500, 1, C.gold);
  card.appendChild(divLine);
  divLine.x = (cardW - 500) / 2;
  divLine.y = 400;

  const starDiv = figma.createText();
  starDiv.fontName = { family: 'Inter', style: 'Regular' };
  starDiv.characters = '✦';
  starDiv.fontSize = 16;
  starDiv.fills = solidFill(C.goldLight);
  card.appendChild(starDiv);
  starDiv.x = cardW / 2 - 8;
  starDiv.y = 392;

  // ── Template Selector Bar ──
  const tplBar = frame('TemplateSelectorBar', leftW, 48);
  tplBar.fills = solidFill(C.white);
  addStroke(tplBar, C.slate200);
  place(root, tplBar, 24, H - 48);

  const tplLabel = text('Templates:', 13, 'Medium', hex('#0a0a0a'));
  tplLabel.resize(90, 18);
  tplBar.appendChild(tplLabel);
  tplLabel.x = 24;
  tplLabel.y = 15;

  const templates = ['Gold Classic', 'Blue Modern', 'Green Nature', 'Purple Elegant'];
  const tplColors = [C.slate50, C.white, C.white, C.white];
  let tplX = 120;
  for (let i = 0; i < templates.length; i++) {
    const chip = rect(`Tpl:${templates[i]}`, 110, 30, tplColors[i], 6);
    addStroke(chip, C.slate300);
    tplBar.appendChild(chip);
    chip.x = tplX;
    chip.y = 9;

    const chipTxt = text(templates[i], 12, i === 0 ? 'Medium' : 'Regular', i === 0 ? C.slate900 : C.slate500);
    chipTxt.resize(100, 18);
    tplBar.appendChild(chipTxt);
    chipTxt.x = tplX + 5;
    chipTxt.y = 16;

    tplX += 118;
  }

  return root;
}

// ──────────────────────────────────────────────────────────────
// Main: build all screens and place inside MacBook Pro frame
// ──────────────────────────────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'generate') return;

  try {
    // Load base fonts — wrapped so a missing weight never aborts the run
    var fontsToLoad = [
      { family: 'Inter', style: 'Regular' },
      { family: 'Inter', style: 'Medium' },
      { family: 'Inter', style: 'Bold' },
    ];
    for (var fi = 0; fi < fontsToLoad.length; fi++) {
      try { await figma.loadFontAsync(fontsToLoad[fi]); } catch(_) {}
    }

    // Find the MacBook Pro 14" frame (node 2:2)
    let targetFrame = figma.getNodeById('2:2');

    const screens = await Promise.all([
      buildNewChat(),
      buildAgentsList(),
      buildAgentChat(),
      buildKudosEmpty(),
      buildKudosGoldClassic(),
    ]);

    const SPACING = 60;
    const W = 1512;

    if (targetFrame && targetFrame.type === 'FRAME') {
      // Place all screens stacked vertically inside the MacBook frame
      // First clear existing children
      var children = targetFrame.children.slice();
      for (var ci = 0; ci < children.length; ci++) {
        var child = children[ci];
        child.remove();
      }
      // Resize target frame to fit all screens
      const totalH = screens.length * (982 + SPACING) - SPACING;
      targetFrame.resize(W, totalH);
      targetFrame.fills = solidFill(C.bg);

      let yOffset = 0;
      for (const screen of screens) {
        targetFrame.appendChild(screen);
        screen.x = 0;
        screen.y = yOffset;
        yOffset += 982 + SPACING;
      }

      figma.viewport.scrollAndZoomIntoView([targetFrame]);
    } else {
      // Drop screens directly onto the canvas with horizontal spacing
      const page = figma.currentPage;
      let xOffset = 0;
      for (const screen of screens) {
        page.appendChild(screen);
        screen.x = xOffset;
        screen.y = 0;
        xOffset += W + SPACING;
      }
      figma.viewport.scrollAndZoomIntoView(screens);
    }

    figma.ui.postMessage({ type: 'done', count: screens.length });
  } catch (err) {
    var msg = err && err.message ? err.message : (err ? String(err) : 'Unknown error');
    figma.ui.postMessage({ type: 'error', message: msg });
  }
};
