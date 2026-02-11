import React, { createContext, useContext } from 'react';
import { useLayout, type LayoutValues } from '@/hooks/useLayout';

const LayoutContext = createContext<LayoutValues | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const layout = useLayout();
  return (
    <LayoutContext.Provider value={layout}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext(): LayoutValues {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayoutContext must be used within LayoutProvider');
  return ctx;
}
