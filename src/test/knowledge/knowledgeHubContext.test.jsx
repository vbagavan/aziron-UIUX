/**
 * Integration tests — KnowledgeHubContext CRUD actions
 * Mocks heavy async/storage deps so we can test pure state transitions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { KnowledgeHubProvider, useKnowledgeHubs } from '@/context/KnowledgeHubContext';
import { createHubAsset, createHubMember, KNOWLEDGE_HUBS_STORAGE_KEY } from '@/data/knowledgeHubs';

// ── Stub heavy external deps so tests don't touch IndexedDB / network ────────
vi.mock('@/lib/agentKnowledge', () => ({ countAgentsUsingHub: () => 0 }));
vi.mock('@/lib/knowledgeHubCloudSync', () => ({ downloadCloudFileBlob: vi.fn() }));
vi.mock('@/lib/knowledgeHubFileStorage', () => ({
  deleteKnowledgeHubFile: vi.fn().mockResolvedValue(undefined),
  documentLibraryBlobKey: (id) => `lib-${id}`,
  getKnowledgeHubFile: vi.fn().mockResolvedValue(null),
  knowledgeHubBlobKey: (hId, fId) => `kh-${hId}-${fId}`,
  saveKnowledgeHubFile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/components/features/knowledge/hubFileMetadata', () => ({
  createPendingHubFileMetadata: () => ({}),
}));
vi.mock('@/components/features/knowledge/hubSourceGuide', () => ({
  createPendingSourceGuide: () => ({}),
}));
vi.mock('@/components/features/knowledge/hubFileEnrichment', () => ({
  enrichStoredHubFile: vi.fn(),
  enrichStoredHubFiles: vi.fn(),
}));
vi.mock('@/lib/sourceCategories', () => ({ isSingleHubSource: () => false }));
vi.mock('@/context/AgentsContext', () => ({ useAgentsOptional: () => null }));
vi.mock('@/data/documentLibrary', () => ({
  fileToLibraryRecord: (f) => ({ id: `lib-${f.name}`, name: f.name }),
  applyLibraryDocumentHubLink: (hubs, _opts) => ({ hubs, alreadyLinked: false, moved: false, hubFileId: null }),
  getHubLinksForDocument: () => [],
  libraryRecordToHubFile: (doc, hubId) => ({ id: `hf-${doc.id}`, name: doc.name, libraryDocumentId: doc.id }),
  loadDocumentsFromStorage: () => [],
  resolveCloudImportToLibraryRecords: () => [],
  saveDocumentsToStorage: vi.fn(),
  syncDemoCategoryHubLinks: (hubs) => hubs,
}));

// ── Seed hub for tests ───────────────────────────────────────────────────────
const SEED_HUB = {
  id: 999,
  name: 'Test Hub',
  files: 0,
  isUserCreated: true,
  members: [{ id: 'm-999-owner', principalType: 'user', name: 'You', email: 'you@test.com', role: 'owner' }],
  assets: [],
  userFiles: [],
  tags: [],
  visibility: 'private',
  status: 'draft',
};

// ── Test harness helpers ─────────────────────────────────────────────────────
function Wrapper({ children }) {
  return <KnowledgeHubProvider>{children}</KnowledgeHubProvider>;
}

function HubStateReader({ onRender }) {
  const { hubs } = useKnowledgeHubs();
  const hub = hubs.find((h) => h.id === 999);
  onRender(hub);
  return <div data-testid="hub-reader" />;
}

function HubActions({ hubId, onCtx }) {
  const ctx = useKnowledgeHubs();
  onCtx(ctx);
  return null;
}

function seedStorage() {
  localStorage.setItem(KNOWLEDGE_HUBS_STORAGE_KEY, JSON.stringify([SEED_HUB]));
}

beforeEach(() => {
  localStorage.clear();
  seedStorage();
});

// ─── addHubAsset ─────────────────────────────────────────────────────────────

describe('addHubAsset', () => {
  it('prepends a new asset to the hub', async () => {
    let captured;
    const ctx = {};

    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const asset = createHubAsset({ type: 'summary', body: 'AI summary text' });
    await act(async () => { ctx.addHubAsset(999, asset); });

    expect(captured.assets).toHaveLength(1);
    expect(captured.assets[0].type).toBe('summary');
    expect(captured.assets[0].title).toBe('AI summary text');
  });

  it('prepends (newest first) when multiple assets exist', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const a1 = createHubAsset({ type: 'note', body: 'First' });
    const a2 = createHubAsset({ type: 'report', body: 'Second' });
    await act(async () => { ctx.addHubAsset(999, a1); });
    await act(async () => { ctx.addHubAsset(999, a2); });

    expect(captured.assets[0].type).toBe('report');
    expect(captured.assets[1].type).toBe('note');
  });

  it('returns null and does not mutate hub for null asset', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );
    const result = ctx.addHubAsset(999, null);
    expect(result).toBeNull();
    expect(captured.assets).toHaveLength(0);
  });
});

// ─── updateHubAsset ──────────────────────────────────────────────────────────

describe('updateHubAsset', () => {
  it('updates only the targeted asset', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const a1 = createHubAsset({ type: 'note', body: 'Note A' });
    const a2 = createHubAsset({ type: 'summary', body: 'Summary B' });
    await act(async () => { ctx.addHubAsset(999, a1); ctx.addHubAsset(999, a2); });
    await act(async () => { ctx.updateHubAsset(999, a1.id, { status: 'archived' }); });

    const updated = captured.assets.find((a) => a.id === a1.id);
    const other = captured.assets.find((a) => a.id === a2.id);
    expect(updated.status).toBe('archived');
    expect(other.status).toBe('active');
  });

  it('applies the patch fields correctly', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const asset = createHubAsset({ type: 'insight', body: 'Insight' });
    await act(async () => { ctx.addHubAsset(999, asset); });
    expect(captured.assets[0].pinned).toBe(false);
    await act(async () => { ctx.updateHubAsset(999, asset.id, { pinned: true }); });
    expect(captured.assets[0].pinned).toBe(true);
    expect(captured.assets[0].updatedAt).toBeTruthy();
  });
});

// ─── removeHubAsset ──────────────────────────────────────────────────────────

describe('removeHubAsset', () => {
  it('removes the asset by id', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const asset = createHubAsset({ type: 'report', body: 'Report' });
    await act(async () => { ctx.addHubAsset(999, asset); });
    expect(captured.assets).toHaveLength(1);

    await act(async () => { ctx.removeHubAsset(999, asset.id); });
    expect(captured.assets).toHaveLength(0);
  });

  it('is a no-op for unknown asset ids', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const asset = createHubAsset({ type: 'note', body: 'Note' });
    await act(async () => { ctx.addHubAsset(999, asset); });
    await act(async () => { ctx.removeHubAsset(999, 'nonexistent-id'); });
    expect(captured.assets).toHaveLength(1);
  });
});

// ─── addHubMembers ───────────────────────────────────────────────────────────

describe('addHubMembers', () => {
  it('adds new members to the hub', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const newMember = createHubMember({ name: 'Alice', email: 'alice@co.com', role: 'contributor' });
    await act(async () => { ctx.addHubMembers(999, [newMember]); });

    expect(captured.members).toHaveLength(2); // original owner + Alice
    const alice = captured.members.find((m) => m.email === 'alice@co.com');
    expect(alice).toBeTruthy();
    expect(alice.role).toBe('contributor');
  });

  it('deduplicates by email — does not add same user twice', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const m1 = createHubMember({ name: 'Alice', email: 'alice@co.com', role: 'viewer' });
    const m2 = createHubMember({ name: 'Alice Duplicate', email: 'alice@co.com', role: 'editor' });
    await act(async () => { ctx.addHubMembers(999, [m1]); });
    await act(async () => { ctx.addHubMembers(999, [m2]); });

    const aliceEntries = captured.members.filter((m) => (m.email ?? '').toLowerCase() === 'alice@co.com');
    expect(aliceEntries).toHaveLength(1);
  });

  it('deduplicates teams across two separate calls (cross-call dedup works)', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const t1 = createHubMember({ principalType: 'team', name: 'Engineering', memberCount: 10 });
    const t2 = createHubMember({ principalType: 'team', name: 'Engineering', memberCount: 10 });
    await act(async () => { ctx.addHubMembers(999, [t1]); });
    await act(async () => { ctx.addHubMembers(999, [t2]); }); // second call — should be deduped

    const teams = captured.members.filter((m) => m.principalType === 'team');
    expect(teams).toHaveLength(1);
  });

  it('BUG: same-batch duplicates are NOT deduplicated (known limitation)', async () => {
    // addHubMembers deduplicates incoming against existing members, but NOT
    // within the incoming batch itself. Passing [t1, t2] with the same team
    // in a single call adds both. This is a code-level gap to fix.
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const t1 = createHubMember({ principalType: 'team', name: 'Engineering', memberCount: 10 });
    const t2 = createHubMember({ principalType: 'team', name: 'Engineering', memberCount: 10 });
    await act(async () => { ctx.addHubMembers(999, [t1, t2]); });

    // Both get added — dedup only guards against `existing`, not within the batch
    const teams = captured.members.filter((m) => m.principalType === 'team');
    expect(teams).toHaveLength(2); // BUG: should be 1
  });

  it('sets hub visibility to "shared" on first share', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const m = createHubMember({ name: 'Bob', email: 'bob@co.com', role: 'viewer' });
    await act(async () => { ctx.addHubMembers(999, [m]); });
    expect(captured.visibility).toBe('shared');
  });

  it('skips empty member arrays without crashing', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const result = ctx.addHubMembers(999, []);
    expect(result.added).toBe(0);
    expect(captured.members).toHaveLength(1);
  });
});

// ─── updateHubMemberRole ─────────────────────────────────────────────────────

describe('updateHubMemberRole', () => {
  it('changes only the targeted member role', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const m = createHubMember({ name: 'Alice', email: 'alice@co.com', role: 'viewer' });
    await act(async () => { ctx.addHubMembers(999, [m]); });
    await act(async () => { ctx.updateHubMemberRole(999, m.id, 'editor'); });

    const alice = captured.members.find((mem) => mem.id === m.id);
    expect(alice.role).toBe('editor');
    // Owner's role must not change
    const owner = captured.members.find((mem) => mem.role === 'owner');
    expect(owner).toBeTruthy();
  });
});

// ─── removeHubMember ─────────────────────────────────────────────────────────

describe('removeHubMember', () => {
  it('removes a member from the hub', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    const m = createHubMember({ name: 'Carol', email: 'carol@co.com', role: 'contributor' });
    await act(async () => { ctx.addHubMembers(999, [m]); });
    expect(captured.members).toHaveLength(2);

    await act(async () => { ctx.removeHubMember(999, m.id); });
    expect(captured.members).toHaveLength(1);
    expect(captured.members[0].role).toBe('owner');
  });

  it('is a no-op for unknown member ids', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );
    await act(async () => { ctx.removeHubMember(999, 'phantom-id'); });
    expect(captured.members).toHaveLength(1);
  });
});

// ─── updateHub ───────────────────────────────────────────────────────────────

describe('updateHub', () => {
  it('patches hub fields and timestamps updated', async () => {
    const ctx = {};
    let captured;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
        <HubStateReader onRender={(hub) => { captured = hub; }} />
      </Wrapper>,
    );

    await act(async () => { ctx.updateHub(999, { name: 'Renamed Hub', visibility: 'shared' }); });

    expect(captured.name).toBe('Renamed Hub');
    expect(captured.visibility).toBe('shared');
    expect(captured.updated).toBe('Just now');
  });
});

// ─── deleteHub ───────────────────────────────────────────────────────────────

describe('deleteHub', () => {
  it('removes the hub from the list', async () => {
    let hubs;
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(ctx) => {
          hubs = ctx.hubs;
          if (hubs.find((h) => h.id === 999)) {
            // trigger delete inline for simplicity
          }
        }} />
      </Wrapper>,
    );

    const ctx = {};
    render(
      <Wrapper>
        <HubActions hubId={999} onCtx={(c) => Object.assign(ctx, c)} />
      </Wrapper>,
    );

    const before = ctx.hubs.length;
    await act(async () => { ctx.deleteHub(999); });
    expect(ctx.hubs.length).toBe(before - 1);
    expect(ctx.hubs.find((h) => h.id === 999)).toBeUndefined();
  });
});
