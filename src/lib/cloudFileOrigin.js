import { getCloudProviderConfig } from "@/components/features/knowledge/cloud/cloudProviderConfig";

/** @typedef {'onedrive' | 'google-drive' | 'dropbox'} CloudProviderId */

/**
 * @typedef {Object} FileOrigin
 * @property {CloudProviderId} provider
 * @property {string} connectionId
 * @property {string} [connectionLabel]
 * @property {string} [folderId]
 * @property {string} folderPath
 * @property {string} [folderLabel]
 * @property {string} [driveItemId]
 */

export const KUDOS_DEFAULT_ONEDRIVE_CONNECTION = {
  provider: "onedrive",
  connectionId: "od-kudos-default",
  connectionLabel: "Microsoft OneDrive",
};

/**
 * @param {Object} params
 * @returns {FileOrigin}
 */
export function buildFileOrigin({
  provider = "onedrive",
  connectionId = KUDOS_DEFAULT_ONEDRIVE_CONNECTION.connectionId,
  connectionLabel = KUDOS_DEFAULT_ONEDRIVE_CONNECTION.connectionLabel,
  folderPath = "/KudosTemplates",
  folderLabel,
  folderId,
  driveItemId,
} = {}) {
  const normalizedPath = folderPath.startsWith("/") ? folderPath : `/${folderPath}`;
  const segments = normalizedPath.split("/").filter(Boolean);
  const resolvedFolderLabel =
    folderLabel ?? (segments.length > 0 ? segments[segments.length - 1] : "Templates");

  return {
    provider,
    connectionId,
    connectionLabel,
    folderId,
    folderPath: normalizedPath,
    folderLabel: resolvedFolderLabel,
    driveItemId,
  };
}

/**
 * @param {{ origin?: FileOrigin, source?: string, cloudProvider?: string, path?: string, folder?: string, name?: string, connectionId?: string, connectionLabel?: string, driveItemId?: string }} file
 * @returns {FileOrigin}
 */
export function getFileOrigin(file) {
  if (file?.origin) return file.origin;

  const path = file?.path ?? `/${file?.folder ?? "KudosTemplates"}/${file?.name ?? "file"}`;
  const segments = path.split("/").filter(Boolean);
  const folderPath =
    segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : `/${file?.folder ?? "KudosTemplates"}`;

  return buildFileOrigin({
    provider: file?.source ?? file?.cloudProvider ?? "onedrive",
    connectionId: file?.connectionId ?? KUDOS_DEFAULT_ONEDRIVE_CONNECTION.connectionId,
    connectionLabel: file?.connectionLabel ?? KUDOS_DEFAULT_ONEDRIVE_CONNECTION.connectionLabel,
    folderPath,
    folderLabel: file?.folder,
    driveItemId: file?.driveItemId,
  });
}

/** @param {FileOrigin} origin */
export function originSourceKey(origin) {
  return `${origin.provider}:${origin.connectionId}:${origin.folderPath}`;
}

/**
 * @param {Array<{ origin?: FileOrigin, [key: string]: unknown }>} files
 */
export function summarizeOrigins(files) {
  const list = files ?? [];
  if (list.length === 0) {
    return {
      fileCount: 0,
      providerCount: 0,
      sourceCount: 0,
      folderCount: 0,
      providers: [],
      headerLocationLabel: "",
      isHomogeneous: true,
    };
  }

  const origins = list.map(getFileOrigin);
  const providerSet = new Set();
  const sourceKeys = new Set();
  const folderLabels = new Set();

  for (const origin of origins) {
    providerSet.add(origin.provider);
    sourceKeys.add(originSourceKey(origin));
    folderLabels.add(origin.folderLabel ?? origin.folderPath);
  }

  const providers = [...providerSet];
  const providerCount = providers.length;
  const sourceCount = sourceKeys.size;
  const folderCount = folderLabels.size;
  const fileCount = list.length;

  let headerLocationLabel = [...folderLabels][0] ?? "";
  if (sourceCount > 1) {
    if (providerCount === 1 && folderCount > 1) {
      headerLocationLabel = `${folderCount} folders`;
    } else {
      headerLocationLabel = `${sourceCount} sources`;
    }
  }

  return {
    fileCount,
    providerCount,
    sourceCount,
    folderCount,
    providers,
    headerLocationLabel,
    isHomogeneous: sourceCount === 1,
    singleProvider: providerCount === 1 ? providers[0] : null,
  };
}

/**
 * @param {{ name?: string, origin?: FileOrigin, [key: string]: unknown }} file
 * @param {string} [displayName]
 */
export function formatFileOriginTooltip(file, displayName) {
  const origin = getFileOrigin(file);
  const providerLabel = getCloudProviderConfig(origin.provider).label;
  const account = origin.connectionLabel;
  const label = displayName ?? file?.label ?? file?.name ?? "File";
  const pathLine = [origin.folderPath, file?.name].filter(Boolean).join("/").replace(/\/+/g, "/");

  return [label, [providerLabel, account].filter(Boolean).join(" · "), pathLine]
    .filter(Boolean)
    .join(" › ");
}

/**
 * @param {CloudProviderId} provider
 * @param {string} [className]
 */
export function getCloudProviderLogoSrc(provider) {
  return getCloudProviderConfig(provider).connectorLogo;
}
