/**
 * Unit tests — hubRoles.js RBAC helpers
 */
import { describe, it, expect } from 'vitest';
import {
  HUB_ROLES,
  HUB_ROLE_META,
  ASSIGNABLE_HUB_ROLES,
  hubRoleRank,
  hubRoleLabel,
  hubRoleCan,
  resolveHubRole,
} from '@/lib/hubRoles';

// ─── Role metadata completeness ───────────────────────────────────────────────

describe('HUB_ROLE_META', () => {
  it('has an entry for every HUB_ROLES value', () => {
    HUB_ROLES.forEach((r) => {
      expect(HUB_ROLE_META[r]).toBeTruthy();
    });
  });

  it('each meta entry has label, description, badgeClass, rank', () => {
    HUB_ROLES.forEach((r) => {
      const m = HUB_ROLE_META[r];
      expect(typeof m.label).toBe('string');
      expect(typeof m.description).toBe('string');
      expect(typeof m.badgeClass).toBe('string');
      expect(typeof m.rank).toBe('number');
    });
  });

  it('ranks are strictly ascending: viewer < contributor < editor < owner', () => {
    expect(HUB_ROLE_META.viewer.rank).toBeLessThan(HUB_ROLE_META.contributor.rank);
    expect(HUB_ROLE_META.contributor.rank).toBeLessThan(HUB_ROLE_META.editor.rank);
    expect(HUB_ROLE_META.editor.rank).toBeLessThan(HUB_ROLE_META.owner.rank);
  });
});

describe('ASSIGNABLE_HUB_ROLES', () => {
  it('does not include "owner"', () => {
    expect(ASSIGNABLE_HUB_ROLES).not.toContain('owner');
  });

  it('includes viewer, contributor, editor', () => {
    expect(ASSIGNABLE_HUB_ROLES).toContain('viewer');
    expect(ASSIGNABLE_HUB_ROLES).toContain('contributor');
    expect(ASSIGNABLE_HUB_ROLES).toContain('editor');
  });
});

// ─── hubRoleRank ─────────────────────────────────────────────────────────────

describe('hubRoleRank', () => {
  it('returns 0 for unknown roles', () => {
    expect(hubRoleRank(undefined)).toBe(0);
    expect(hubRoleRank('superadmin')).toBe(0);
  });

  it('returns correct rank for known roles', () => {
    expect(hubRoleRank('viewer')).toBe(1);
    expect(hubRoleRank('contributor')).toBe(2);
    expect(hubRoleRank('editor')).toBe(3);
    expect(hubRoleRank('owner')).toBe(4);
  });
});

// ─── hubRoleLabel ────────────────────────────────────────────────────────────

describe('hubRoleLabel', () => {
  it('returns correct labels', () => {
    expect(hubRoleLabel('viewer')).toBe('Viewer');
    expect(hubRoleLabel('contributor')).toBe('Contributor');
    expect(hubRoleLabel('editor')).toBe('Editor');
    expect(hubRoleLabel('owner')).toBe('Owner');
  });

  it('falls back to "Viewer" for unknown roles', () => {
    expect(hubRoleLabel(undefined)).toBe('Viewer');
    expect(hubRoleLabel('god')).toBe('Viewer');
  });
});

// ─── hubRoleCan ──────────────────────────────────────────────────────────────

describe('hubRoleCan — action gate matrix', () => {
  // Viewer capabilities
  describe('viewer', () => {
    it('can view sources', () => expect(hubRoleCan('viewer', 'sources.view')).toBe(true));
    it('can ask AI', () => expect(hubRoleCan('viewer', 'ai.generate')).toBe(true));
    it('can create notes', () => expect(hubRoleCan('viewer', 'notes.create')).toBe(true));
    it('cannot add sources', () => expect(hubRoleCan('viewer', 'sources.upload')).toBe(false));
    it('cannot pin assets', () => expect(hubRoleCan('viewer', 'assets.pin')).toBe(false));
    it('cannot delete sources', () => expect(hubRoleCan('viewer', 'sources.delete')).toBe(false));
    it('cannot archive assets', () => expect(hubRoleCan('viewer', 'assets.archive')).toBe(false));
    it('cannot manage members', () => expect(hubRoleCan('viewer', 'members.manage')).toBe(false));
  });

  // Contributor capabilities
  describe('contributor', () => {
    it('can add sources', () => expect(hubRoleCan('contributor', 'sources.upload')).toBe(true));
    it('can pin assets', () => expect(hubRoleCan('contributor', 'assets.pin')).toBe(true));
    it('cannot delete sources', () => expect(hubRoleCan('contributor', 'sources.delete')).toBe(false));
    it('cannot archive assets', () => expect(hubRoleCan('contributor', 'assets.archive')).toBe(false));
    it('cannot manage members', () => expect(hubRoleCan('contributor', 'members.manage')).toBe(false));
  });

  // Editor capabilities
  describe('editor', () => {
    it('can delete sources', () => expect(hubRoleCan('editor', 'sources.delete')).toBe(true));
    it('can archive assets', () => expect(hubRoleCan('editor', 'assets.archive')).toBe(true));
    it('can manage members', () => expect(hubRoleCan('editor', 'members.manage')).toBe(true));
  });

  // Owner capabilities
  describe('owner', () => {
    it('can do everything', () => {
      const actions = ['sources.view', 'ai.generate', 'notes.create', 'sources.upload', 'assets.pin', 'sources.delete', 'assets.archive', 'members.manage'];
      actions.forEach((action) => {
        expect(hubRoleCan('owner', action)).toBe(true);
      });
    });
  });

  // Edge cases
  it('returns false for unknown actions', () => {
    expect(hubRoleCan('owner', 'fly.to.moon')).toBe(false);
    expect(hubRoleCan('editor', undefined)).toBe(false);
  });

  it('returns false for unknown roles', () => {
    expect(hubRoleCan(undefined, 'sources.view')).toBe(false);
    expect(hubRoleCan('superadmin', 'sources.view')).toBe(false);
  });
});

// ─── resolveHubRole ──────────────────────────────────────────────────────────

describe('resolveHubRole', () => {
  const user = { email: 'alice@co.com' };

  it('returns "owner" fallback when user is not in hub.members', () => {
    const hub = { id: 1, members: [] };
    expect(resolveHubRole(hub, user)).toBe('owner');
  });

  it('returns the member role when user email and principalType match', () => {
    const hub = {
      members: [{ principalType: 'user', email: 'alice@co.com', role: 'contributor' }],
    };
    expect(resolveHubRole(hub, user)).toBe('contributor');
  });

  it('returns "owner" when members array is undefined (seed hub before normalisation)', () => {
    const hub = { id: 1 };
    expect(resolveHubRole(hub, user)).toBe('owner');
  });

  it('returns "viewer" when hub is null (safe read-only default for unknown context)', () => {
    expect(resolveHubRole(null, user)).toBe('viewer');
  });

  it('returns "owner" when user is null', () => {
    const hub = { members: [{ principalType: 'user', email: 'other@co.com', role: 'viewer' }] };
    expect(resolveHubRole(hub, null)).toBe('owner');
  });

  it('matches the correct member when multiple members present', () => {
    const hub = {
      members: [
        { principalType: 'user', email: 'bob@co.com', role: 'viewer' },
        { principalType: 'user', email: 'alice@co.com', role: 'editor' },
        { principalType: 'user', email: 'carol@co.com', role: 'contributor' },
      ],
    };
    expect(resolveHubRole(hub, { email: 'alice@co.com' })).toBe('editor');
    expect(resolveHubRole(hub, { email: 'bob@co.com' })).toBe('viewer');
  });

  it('ignores team/department members — only matches principalType "user"', () => {
    const hub = {
      members: [{ principalType: 'team', email: 'alice@co.com', role: 'editor' }],
    };
    expect(resolveHubRole(hub, user)).toBe('owner');
  });
});
