/**
 * Unit tests — knowledgeHubs.js pure data helpers
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  inferHubFileType,
  parseDisplaySizeToKb,
  formatFileSizeKb,
  formatDisplayDate,
  getHubFileStatus,
  fileToHubRecord,
  cloudFileToHubRecord,
  hubRecordsToStats,
  buildHubFileInventory,
  createHubAsset,
  createHubMember,
  summarizeHubAssets,
  createHubPayload,
  normalizeHubs,
  loadHubsFromStorage,
  saveHubsToStorage,
  KNOWLEDGE_HUBS_STORAGE_KEY,
  SEED_KNOWLEDGE_HUBS,
  ASSET_TYPES,
  assetTypeLabel,
} from '@/data/knowledgeHubs';

// ─── inferHubFileType ────────────────────────────────────────────────────────

describe('inferHubFileType', () => {
  it('resolves known extensions', () => {
    expect(inferHubFileType('report.pdf')).toBe('PDF');
    expect(inferHubFileType('data.csv')).toBe('CSV');
    expect(inferHubFileType('notes.md')).toBe('Markdown');
    expect(inferHubFileType('deck.pptx')).toBe('PowerPoint');
    expect(inferHubFileType('sheet.xlsx')).toBe('Excel');
    expect(inferHubFileType('clip.mp4')).toBe('Video');
    expect(inferHubFileType('track.mp3')).toBe('Audio');
    expect(inferHubFileType('photo.png')).toBe('Image');
    expect(inferHubFileType('book.epub')).toBe('eBook');
  });

  it('falls back to MIME when extension is unknown', () => {
    expect(inferHubFileType('file', 'application/pdf')).toBe('PDF');
    expect(inferHubFileType('file', 'text/csv')).toBe('CSV');
    expect(inferHubFileType('file', 'video/webm')).toBe('Video');
    expect(inferHubFileType('file', 'audio/ogg')).toBe('Audio');
    expect(inferHubFileType('file', 'image/jpeg')).toBe('Image');
  });

  it('returns uppercase extension when completely unknown', () => {
    expect(inferHubFileType('archive.xyz')).toBe('XYZ');
  });

  it('returns "File" for blank filename with no MIME', () => {
    expect(inferHubFileType('')).toBe('File');
    expect(inferHubFileType(null)).toBe('File');
  });

  it('is case-insensitive on extension', () => {
    expect(inferHubFileType('REPORT.PDF')).toBe('PDF');
    expect(inferHubFileType('DATA.CSV')).toBe('CSV');
  });
});

// ─── parseDisplaySizeToKb ────────────────────────────────────────────────────

describe('parseDisplaySizeToKb', () => {
  it('parses MB correctly', () => {
    expect(parseDisplaySizeToKb('7.4 MB')).toBe(Math.round(7.4 * 1024));
    expect(parseDisplaySizeToKb('1.2 MB')).toBe(Math.round(1.2 * 1024));
    expect(parseDisplaySizeToKb('100 MB')).toBe(100 * 1024);
  });

  it('parses KB correctly', () => {
    expect(parseDisplaySizeToKb('240 KB')).toBe(240);
    expect(parseDisplaySizeToKb('512 KB')).toBe(512);
  });

  it('parses GB correctly', () => {
    expect(parseDisplaySizeToKb('1 GB')).toBe(1024 * 1024);
  });

  it('returns minimum 1 for empty or dash', () => {
    expect(parseDisplaySizeToKb('—')).toBe(1);
    expect(parseDisplaySizeToKb('')).toBe(1);
    expect(parseDisplaySizeToKb(null)).toBe(1);
    expect(parseDisplaySizeToKb(undefined)).toBe(1);
  });

  it('handles bare numbers as raw bytes', () => {
    expect(parseDisplaySizeToKb('1000')).toBe(1000);
  });
});

// ─── formatFileSizeKb ────────────────────────────────────────────────────────

describe('formatFileSizeKb', () => {
  it('formats sub-MB values as KB', () => {
    expect(formatFileSizeKb(512)).toBe('512 KB');
    expect(formatFileSizeKb(1)).toBe('1 KB');
  });

  it('formats values >= 1024 as MB', () => {
    expect(formatFileSizeKb(2048)).toBe('2.0 MB');
    expect(formatFileSizeKb(10240)).toBe('10 MB');
  });

  it('returns — for null/zero/negative', () => {
    expect(formatFileSizeKb(null)).toBe('—');
    expect(formatFileSizeKb(0)).toBe('—');
    expect(formatFileSizeKb(-1)).toBe('—');
  });
});

// ─── formatDisplayDate ───────────────────────────────────────────────────────

describe('formatDisplayDate', () => {
  it('formats valid ISO date strings', () => {
    const result = formatDisplayDate('2026-04-01');
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/2026/);
  });

  it('returns — for null/undefined', () => {
    expect(formatDisplayDate(null)).toBe('—');
    expect(formatDisplayDate(undefined)).toBe('—');
    expect(formatDisplayDate('')).toBe('—');
  });

  it('returns the raw string when not a valid date', () => {
    expect(formatDisplayDate('not-a-date')).toBe('not-a-date');
  });
});

// ─── getHubFileStatus ────────────────────────────────────────────────────────

describe('getHubFileStatus', () => {
  it('always returns "success" for user uploads', () => {
    expect(getHubFileStatus({ source: 'user' })).toBe('success');
    expect(getHubFileStatus({ source: 'user', fileStatus: 'failed' })).toBe('success');
  });

  it('returns "linked" for cloud files without localBlobId', () => {
    expect(getHubFileStatus({ source: 'cloud', syncStatus: 'linked' })).toBe('linked');
    expect(getHubFileStatus({ source: 'cloud' })).toBe('linked');
  });

  it('returns "success" for stored cloud files', () => {
    expect(getHubFileStatus({ source: 'cloud', syncStatus: 'stored' })).toBe('success');
    expect(getHubFileStatus({ source: 'cloud', localBlobId: 'blob-123' })).toBe('success');
  });

  it('returns "loading" and "failed" for cloud files in-flight', () => {
    expect(getHubFileStatus({ source: 'cloud', syncStatus: 'loading' })).toBe('loading');
    expect(getHubFileStatus({ source: 'cloud', syncStatus: 'failed' })).toBe('failed');
  });

  it('returns "success" for demo files by default', () => {
    expect(getHubFileStatus({ source: 'demo', fileStatus: 'processing' })).toBe('success');
  });

  it('exposes demo statuses when includeDemoStatuses=true', () => {
    expect(getHubFileStatus({ source: 'demo', fileStatus: 'processing' }, { includeDemoStatuses: true })).toBe('loading');
  });
});

// ─── fileToHubRecord ─────────────────────────────────────────────────────────

describe('fileToHubRecord', () => {
  it('creates a hub record with correct shape', () => {
    const file = { name: 'report.pdf', size: 204800, type: 'application/pdf' };
    const record = fileToHubRecord(file, 1);
    expect(record.name).toBe('report.pdf');
    expect(record.type).toBe('PDF');
    expect(record.sizeKb).toBe(200);
    expect(record.source).toBe('user');
    expect(record.indexStatus).toBe('stored');
    expect(record.fileStatus).toBe('success');
    expect(record.id).toMatch(/^kh1-u/);
  });

  it('uses at least 1 KB for tiny files', () => {
    const file = { name: 'empty.txt', size: 0, type: 'text/plain' };
    const record = fileToHubRecord(file, 2);
    expect(record.sizeKb).toBeGreaterThanOrEqual(1);
  });
});

// ─── cloudFileToHubRecord ────────────────────────────────────────────────────

describe('cloudFileToHubRecord', () => {
  it('creates a linked record for unsynced cloud files', () => {
    const file = { id: 'f1', name: 'deck.pptx', size: '3.2 MB' };
    const record = cloudFileToHubRecord(file, 1, { provider: 'onedrive', connectionId: 'od-1' });
    expect(record.source).toBe('cloud');
    expect(record.cloudProvider).toBe('onedrive');
    expect(record.indexStatus).toBe('linked');
    expect(record.syncStatus).toBe('linked');
  });

  it('creates a stored record for locally-synced cloud files', () => {
    const file = { id: 'f2', name: 'doc.docx', size: '1 MB', localBlobId: 'blob-abc' };
    const record = cloudFileToHubRecord(file, 1, { provider: 'google-drive' });
    expect(record.indexStatus).toBe('stored');
    expect(record.syncStatus).toBe('stored');
    expect(record.fileStatus).toBe('success');
  });
});

// ─── hubRecordsToStats ───────────────────────────────────────────────────────

describe('hubRecordsToStats', () => {
  it('calculates storage from sizeKb', () => {
    const records = [
      { sizeKb: 512 },
      { sizeKb: 1024 },
    ];
    const stats = hubRecordsToStats(records);
    expect(stats.added).toBe(2);
    expect(stats.storageMB).toBeGreaterThan(0);
    expect(stats.collectionDelta).toBe(1);
  });

  it('returns zero stats for empty array', () => {
    const stats = hubRecordsToStats([]);
    expect(stats.added).toBe(0);
    expect(stats.storageMB).toBe(0);
    expect(stats.collectionDelta).toBe(0);
  });

  it('handles null gracefully', () => {
    const stats = hubRecordsToStats(null);
    expect(stats.added).toBe(0);
  });
});

// ─── buildHubFileInventory ───────────────────────────────────────────────────

describe('buildHubFileInventory', () => {
  const seedHub = { id: 1, name: 'Test Hub', files: 10, updated: '2026-04-01' };

  it('returns empty inventory for hub with zero files and no userFiles', () => {
    const inv = buildHubFileInventory({ id: 99, name: 'Empty', files: 0 });
    expect(inv.allFiles).toHaveLength(0);
    expect(inv.hasDemoRows).toBe(false);
  });

  it('generates demo rows for seed hubs', () => {
    const inv = buildHubFileInventory(seedHub);
    expect(inv.demoFiles.length).toBeGreaterThan(0);
    expect(inv.hasDemoRows).toBe(true);
  });

  it('shows only userFiles for user-created hubs', () => {
    const hub = {
      id: 10, name: 'My Hub', files: 2, isUserCreated: true,
      userFiles: [
        { id: 'kh10-u1', name: 'a.pdf', sizeKb: 100, source: 'user', indexStatus: 'stored', fileStatus: 'success' },
        { id: 'kh10-u2', name: 'b.docx', sizeKb: 200, source: 'user', indexStatus: 'stored', fileStatus: 'success' },
      ],
    };
    const inv = buildHubFileInventory(hub);
    expect(inv.allFiles).toHaveLength(2);
    expect(inv.demoFiles).toHaveLength(0);
    expect(inv.hasDemoRows).toBe(false);
  });

  it('filters out hidden file IDs', () => {
    const hub = {
      id: 11, name: 'Hub', files: 2, isUserCreated: true,
      hiddenFileIds: ['kh11-u1'],
      userFiles: [
        { id: 'kh11-u1', name: 'hidden.pdf', sizeKb: 100, source: 'user' },
        { id: 'kh11-u2', name: 'visible.pdf', sizeKb: 100, source: 'user' },
      ],
    };
    const inv = buildHubFileInventory(hub);
    expect(inv.allFiles).toHaveLength(1);
    expect(inv.allFiles[0].id).toBe('kh11-u2');
  });
});

// ─── createHubAsset ──────────────────────────────────────────────────────────

describe('createHubAsset', () => {
  it('creates an asset with correct defaults', () => {
    const asset = createHubAsset({ type: 'summary', body: 'This is a summary.' });
    expect(asset.type).toBe('summary');
    expect(asset.status).toBe('active');
    expect(asset.pinned).toBe(false);
    expect(asset.origin).toBe('ai');
    expect(asset.createdAt).toBeTruthy();
    expect(asset.id).toMatch(/^asset-/);
  });

  it('derives title from body when no title given', () => {
    const asset = createHubAsset({ body: 'My first line\nSome more text' });
    expect(asset.title).toBe('My first line');
  });

  it('falls back to explicit title over body', () => {
    const asset = createHubAsset({ title: 'Explicit Title', body: 'Body text' });
    expect(asset.title).toBe('Explicit Title');
  });

  it('falls back to type + date when body is empty', () => {
    const asset = createHubAsset({ type: 'report' });
    expect(asset.title).toMatch(/Report/);
  });

  it('clamps type to "note" for unknown types', () => {
    const asset = createHubAsset({ type: 'unknown_type' });
    expect(asset.type).toBe('note');
  });

  it('stores actor info', () => {
    const actor = { name: 'Alice', email: 'alice@co.com' };
    const asset = createHubAsset({ actor });
    expect(asset.createdByName).toBe('Alice');
    expect(asset.createdByEmail).toBe('alice@co.com');
  });

  it('all ASSET_TYPES are valid type values', () => {
    Object.keys(ASSET_TYPES).forEach((type) => {
      const asset = createHubAsset({ type });
      expect(asset.type).toBe(type);
    });
  });
});

// ─── assetTypeLabel ──────────────────────────────────────────────────────────

describe('assetTypeLabel', () => {
  it('returns correct labels for known types', () => {
    expect(assetTypeLabel('summary')).toBe('Summary');
    expect(assetTypeLabel('report')).toBe('Report');
    expect(assetTypeLabel('insight')).toBe('Insight');
    expect(assetTypeLabel('note')).toBe('Note');
  });

  it('returns "Asset" for unknown types', () => {
    expect(assetTypeLabel('bogus')).toBe('Asset');
    expect(assetTypeLabel(undefined)).toBe('Asset');
  });
});

// ─── summarizeHubAssets ──────────────────────────────────────────────────────

describe('summarizeHubAssets', () => {
  const hub = {
    assets: [
      { status: 'active', pinned: false },
      { status: 'active', pinned: true },
      { status: 'active', pinned: true },
      { status: 'archived', pinned: false },
      { status: 'archived', pinned: false },
    ],
  };

  it('counts active, pinned, archived correctly', () => {
    const s = summarizeHubAssets(hub);
    expect(s.active).toBe(3);
    expect(s.pinned).toBe(2);
    expect(s.archived).toBe(2);
    expect(s.total).toBe(5);
  });

  it('returns zeros for hub with no assets', () => {
    const s = summarizeHubAssets({ assets: [] });
    expect(s.active).toBe(0);
    expect(s.pinned).toBe(0);
    expect(s.archived).toBe(0);
  });

  it('handles undefined assets gracefully', () => {
    const s = summarizeHubAssets({});
    expect(s.total).toBe(0);
  });

  it('pinned assets count toward active', () => {
    const s = summarizeHubAssets({ assets: [{ status: 'active', pinned: true }] });
    expect(s.active).toBe(1);
    expect(s.pinned).toBe(1);
    expect(s.archived).toBe(0);
  });
});

// ─── createHubMember ─────────────────────────────────────────────────────────

describe('createHubMember', () => {
  it('creates a user member with correct shape', () => {
    const m = createHubMember({ principalType: 'user', name: 'Alice', email: 'alice@co.com', role: 'editor' });
    expect(m.principalType).toBe('user');
    expect(m.name).toBe('Alice');
    expect(m.email).toBe('alice@co.com');
    expect(m.role).toBe('editor');
    expect(m.id).toMatch(/^u-/);
    expect(m.addedAt).toBeTruthy();
  });

  it('creates a team member with member count', () => {
    const m = createHubMember({ principalType: 'team', name: 'Platform Eng', memberCount: 12, role: 'contributor' });
    expect(m.principalType).toBe('team');
    expect(m.memberCount).toBe(12);
    expect(m.id).toMatch(/^t-/);
  });

  it('creates a department member', () => {
    const m = createHubMember({ principalType: 'department', name: 'Engineering', memberCount: 40 });
    expect(m.principalType).toBe('department');
    expect(m.id).toMatch(/^d-/);
  });

  it('defaults role to "viewer"', () => {
    const m = createHubMember({ name: 'Bob' });
    expect(m.role).toBe('viewer');
  });

  it('records actor as addedByName', () => {
    const m = createHubMember({ name: 'Carol', actor: { name: 'Admin' } });
    expect(m.addedByName).toBe('Admin');
  });
});

// ─── createHubPayload ────────────────────────────────────────────────────────

describe('createHubPayload', () => {
  it('creates a valid hub with required fields', () => {
    const hub = createHubPayload({ name: 'My Hub', description: 'Test hub' });
    expect(hub.name).toBe('My Hub');
    expect(hub.description).toBe('Test hub');
    expect(hub.isUserCreated).toBe(true);
    expect(hub.status).toBe('published');
    expect(hub.visibility).toBe('private');
    expect(hub.members).toHaveLength(1);
    expect(hub.members[0].role).toBe('owner');
    expect(hub.assets).toHaveLength(0);
  });

  it('trims whitespace from name and description', () => {
    const hub = createHubPayload({ name: '  Trimmed  ', description: '  desc  ' });
    expect(hub.name).toBe('Trimmed');
    expect(hub.description).toBe('desc');
  });

  it('has a numeric id', () => {
    const hub = createHubPayload({ name: 'Hub' });
    expect(typeof hub.id).toBe('number');
  });

  it('falls back to default OneDrive content when no files provided', () => {
    const hub = createHubPayload({ name: 'Empty Hub' });
    expect(hub.userFiles.length).toBeGreaterThan(0);
    expect(hub.cloudConnections.length).toBeGreaterThan(0);
  });

  it('uses provided files instead of defaults', () => {
    const mockFile = { name: 'upload.pdf', size: 1024, type: 'application/pdf' };
    const hub = createHubPayload({ name: 'Hub', pendingFile: mockFile });
    const userFile = hub.userFiles.find((f) => f.name === 'upload.pdf');
    expect(userFile).toBeTruthy();
    expect(userFile.source).toBe('user');
  });

  it('sets createdOn to today ISO date', () => {
    const hub = createHubPayload({ name: 'Hub' });
    expect(hub.createdOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─── normalizeHubs ───────────────────────────────────────────────────────────

describe('normalizeHubs', () => {
  it('backfills members onto seed hubs', () => {
    const seed = [{ id: 1, name: 'Hub', files: 5, createdOn: '2026-01-01', updated: '2026-01-01' }];
    const normalized = normalizeHubs(seed);
    expect(Array.isArray(normalized[0].members)).toBe(true);
    expect(normalized[0].members.length).toBeGreaterThan(0);
  });

  it('backfills assets onto seed hubs', () => {
    const seed = [{ id: 1, name: 'Hub', files: 10, createdOn: '2026-01-01', updated: '2026-01-01' }];
    const normalized = normalizeHubs(seed);
    expect(Array.isArray(normalized[0].assets)).toBe(true);
    expect(normalized[0].assets.length).toBeGreaterThan(0);
  });

  it('respects existing members — does not overwrite', () => {
    const seed = [{
      id: 1, name: 'Hub', files: 5, createdOn: '2026-01-01',
      members: [{ id: 'm1', role: 'owner', name: 'Me' }],
      assets: [],
    }];
    const normalized = normalizeHubs(seed);
    expect(normalized[0].members).toHaveLength(1);
  });

  it('respects existing empty assets array — does not backfill', () => {
    const seed = [{ id: 1, name: 'Hub', files: 5, createdOn: '2026-01-01', assets: [] }];
    const normalized = normalizeHubs(seed);
    expect(normalized[0].assets).toHaveLength(0);
  });

  it('returns input unchanged for non-array', () => {
    expect(normalizeHubs(null)).toBeNull();
    expect(normalizeHubs(undefined)).toBeUndefined();
  });

  it('backfills default cloud content for user-created hubs without files', () => {
    const hub = { id: 5, name: 'New Hub', isUserCreated: true, userFiles: [], files: 0 };
    const [normalized] = normalizeHubs([hub]);
    expect(normalized.userFiles.length).toBeGreaterThan(0);
  });
});

// ─── localStorage persistence ────────────────────────────────────────────────

describe('saveHubsToStorage / loadHubsFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips hubs through localStorage', () => {
    // Must include createdOn so normalizeHubs → buildDemoAssets does not throw
    const hubs = [
      { id: 1, name: 'Hub A', files: 5, createdOn: '2026-01-01', isUserCreated: true, userFiles: [], members: [], assets: [] },
      { id: 2, name: 'Hub B', files: 3, createdOn: '2026-02-01', isUserCreated: true, userFiles: [], members: [], assets: [] },
    ];
    saveHubsToStorage(hubs);
    const loaded = loadHubsFromStorage();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].name).toBe('Hub A');
  });

  it('returns null when storage is empty', () => {
    expect(loadHubsFromStorage()).toBeNull();
  });

  it('returns null when storage contains corrupt JSON', () => {
    localStorage.setItem(KNOWLEDGE_HUBS_STORAGE_KEY, '{ not valid json');
    expect(loadHubsFromStorage()).toBeNull();
  });

  it('returns null when storage contains non-array JSON', () => {
    localStorage.setItem(KNOWLEDGE_HUBS_STORAGE_KEY, JSON.stringify({ key: 'value' }));
    expect(loadHubsFromStorage()).toBeNull();
  });
});

// ─── SEED_KNOWLEDGE_HUBS structure ───────────────────────────────────────────

describe('SEED_KNOWLEDGE_HUBS', () => {
  it('has 3 seed hubs', () => {
    expect(SEED_KNOWLEDGE_HUBS).toHaveLength(3);
  });

  it('each seed hub has required fields', () => {
    SEED_KNOWLEDGE_HUBS.forEach((hub) => {
      expect(hub.id).toBeTruthy();
      expect(hub.name).toBeTruthy();
      expect(hub.files).toBeGreaterThanOrEqual(0);
      expect(hub.visibility).toBe('private');
    });
  });

  it('seed hubs do not have members or assets pre-set (backfilled by normalizeHubs)', () => {
    SEED_KNOWLEDGE_HUBS.forEach((hub) => {
      expect(hub.members).toBeUndefined();
      expect(hub.assets).toBeUndefined();
    });
  });
});
