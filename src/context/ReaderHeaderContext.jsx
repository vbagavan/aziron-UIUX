import { createContext, useContext, useState } from "react";

/**
 * Bridges a source reader's header into the global AppHeader.
 *
 * The reader (SourceDetailShell) portals its header content into `slotEl`
 * (rendered inside AppHeader) and flips `active` on mount so the AppHeader can
 * hide its default controls and the Knowledge scope rail can collapse — giving
 * a single, focused top bar while reading.
 */
const ReaderHeaderContext = createContext(null);

export function ReaderHeaderProvider({ children }) {
  const [slotEl, setSlotEl] = useState(null);
  const [active, setActive] = useState(false);

  return (
    <ReaderHeaderContext.Provider value={{ slotEl, setSlotEl, active, setActive }}>
      {children}
    </ReaderHeaderContext.Provider>
  );
}

export function useReaderHeader() {
  return useContext(ReaderHeaderContext);
}
