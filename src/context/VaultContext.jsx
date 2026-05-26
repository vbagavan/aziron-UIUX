import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createVaultSecretPayload,
  loadVaultSecretsFromStorage,
  saveVaultSecretsToStorage,
  SEED_VAULT_SECRETS,
} from "@/data/vaultSecrets";

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [secrets, setSecrets] = useState(() => loadVaultSecretsFromStorage() ?? SEED_VAULT_SECRETS);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const ok = saveVaultSecretsToStorage(secrets);
    setSaveFailed(!ok);
  }, [secrets]);

  const addSecret = useCallback((payload) => {
    const secret = createVaultSecretPayload(payload);
    setSecrets((prev) => [...prev, secret]);
    return secret;
  }, []);

  const updateSecret = useCallback((id, patch) => {
    setSecrets((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...patch,
              updatedOn: new Date().toISOString().slice(0, 10),
            }
          : s,
      ),
    );
  }, []);

  const deleteSecret = useCallback((id) => {
    let removed = null;
    setSecrets((prev) => {
      removed = prev.find((s) => s.id === id) ?? null;
      return prev.filter((s) => s.id !== id);
    });
    return removed;
  }, []);

  const restoreSecret = useCallback((secret) => {
    if (!secret?.id) return;
    setSecrets((prev) => {
      if (prev.some((s) => s.id === secret.id)) return prev;
      return [secret, ...prev];
    });
  }, []);

  const getSecretById = useCallback(
    (id) => secrets.find((s) => s.id === id) ?? null,
    [secrets],
  );

  const value = useMemo(
    () => ({
      secrets,
      saveFailed,
      addSecret,
      updateSecret,
      deleteSecret,
      restoreSecret,
      getSecretById,
    }),
    [secrets, saveFailed, addSecret, updateSecret, deleteSecret, restoreSecret, getSecretById],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
